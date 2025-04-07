import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { UserType } from '@/lib/auth/types';

/**
 * GET profile by user ID
 * /api/profiles?userId=123
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Use admin client to bypass RLS
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return NextResponse.json(
        { error: `Failed to fetch profile: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile: data });
  } catch (err: any) {
    console.error('Unexpected error in GET /api/profiles:', err);
    return NextResponse.json(
      { error: `Server error: ${err.message}` },
      { status: 500 }
    );
  }
}

/**
 * POST create or update profile
 * /api/profiles
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, userType, fullName } = body;

    if (!userId || !userType) {
      return NextResponse.json(
        { error: 'User ID and user type are required' },
        { status: 400 }
      );
    }

    // First check if profile exists
    const { data: existingProfile, error: checkError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // If profile exists, update it
    if (existingProfile) {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update({
          user_type: userType,
          full_name: fullName || existingProfile.full_name,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json(
          { error: `Failed to update profile: ${error.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        profile: data,
        created: false,
        message: 'Profile updated successfully' 
      });
    }

    // If profile doesn't exist, create it
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .insert([
        {
          id: userId,
          user_type: userType as UserType,
          full_name: fullName || 'InstaBids User',
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating profile:', error);
      return NextResponse.json(
        { error: `Failed to create profile: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      profile: data,
      created: true,
      message: 'Profile created successfully' 
    });
  } catch (err: any) {
    console.error('Unexpected error in POST /api/profiles:', err);
    return NextResponse.json(
      { error: `Server error: ${err.message}` },
      { status: 500 }
    );
  }
}

/**
 * DELETE profile
 * /api/profiles?userId=123
 */
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('Error deleting profile:', error);
      return NextResponse.json(
        { error: `Failed to delete profile: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: 'Profile deleted successfully',
      userId 
    });
  } catch (err: any) {
    console.error('Unexpected error in DELETE /api/profiles:', err);
    return NextResponse.json(
      { error: `Server error: ${err.message}` },
      { status: 500 }
    );
  }
}
