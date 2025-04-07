import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { UserType } from '@/lib/auth/types';

/**
 * POST to create a user and profile together
 * /api/auth/register
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, fullName, userType } = body;

    if (!email || !password || !userType) {
      return NextResponse.json(
        { error: 'Email, password, and user type are required' },
        { status: 400 }
      );
    }

    // 1. Create the user in Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        user_type: userType
      }
    });

    if (authError) {
      console.error('Error creating user:', authError);
      return NextResponse.json(
        { error: `Failed to create user: ${authError.message}` },
        { status: 500 }
      );
    }

    // 2. Create the profile entry
    const userId = authData.user.id;
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([
        {
          id: userId,
          user_type: userType as UserType,
          full_name: fullName || email.split('@')[0],
        }
      ])
      .select()
      .single();

    if (profileError) {
      console.error('Error creating profile:', profileError);
      
      // Even if profile creation fails, we return the auth data
      // The profile can be created later when the user logs in
      return NextResponse.json({
        user: authData.user,
        profile: null,
        warning: `User created but profile creation failed: ${profileError.message}`
      });
    }

    return NextResponse.json({
      user: authData.user,
      profile: profileData,
      message: 'User and profile created successfully'
    });
  } catch (err: any) {
    console.error('Unexpected error in POST /api/auth:', err);
    return NextResponse.json(
      { error: `Server error: ${err.message}` },
      { status: 500 }
    );
  }
}

/**
 * GET current user with profile
 * /api/auth/user
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Error getting user from token:', authError);
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }
    
    // Get the user's profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile:', profileError);
    }
    
    // If profile doesn't exist, create it
    if (profileError && profileError.code === 'PGRST116') {
      const userType = user.user_metadata?.user_type as UserType; 
      const fullName = user.user_metadata?.full_name as string;
      
      if (userType) {
        const { data: newProfile, error: createError } = await supabaseAdmin
          .from('profiles')
          .insert([
            { 
              id: user.id,
              user_type: userType,
              full_name: fullName || 'InstaBids User',
            }
          ])
          .select()
          .single();
          
        if (!createError) {
          return NextResponse.json({ 
            user, 
            profile: newProfile,
            profileCreated: true
          });
        }
      }
    }
    
    return NextResponse.json({ 
      user, 
      profile,
      profileCreated: false
    });
  } catch (err: any) {
    console.error('Unexpected error in GET /api/auth/user:', err);
    return NextResponse.json(
      { error: `Server error: ${err.message}` },
      { status: 500 }
    );
  }
}
