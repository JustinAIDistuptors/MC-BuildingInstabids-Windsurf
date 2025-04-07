/**
 * Authentication utilities for InstaBids
 * Provides helper functions for auth-related operations
 */

import { supabase } from "../supabase/client";
import type { UserType } from "./types";

/**
 * Sign up a new user
 */
export async function signUpUser({ email, password, fullName, userType }: { 
  email: string; 
  password: string; 
  fullName: string; 
  userType: UserType;
}) {
  try {
    // 1. Sign up user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { 
          full_name: fullName,
          user_type: userType
        }
      }
    });
    
    if (error) {
      return { data: null, error };
    }

    // 2. Create profile via secure API route if user was created
    if (data?.user) {
      try {
        const profileResponse = await fetch('/api/profiles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: data.user.id,
            userType,
            fullName
          }),
        });

        if (!profileResponse.ok) {
          console.warn('Profile creation via API failed, but user was created');
        }
      } catch (profileError) {
        console.error('Error creating profile via API:', profileError);
      }
    }
    
    return { data, error: null };
  } catch (err: any) {
    console.error("Error in signUpUser:", err);
    return { data: null, error: err };
  }
}

/**
 * Sign in a user
 */
export async function signInUser({ email, password }: { email: string; password: string; }) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { data, error };
  } catch (err: any) {
    console.error("Error in signInUser:", err);
    return { data: null, error: err };
  }
}

/**
 * Sign out the current user
 */
export async function signOutUser() {
  try {
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (err: any) {
    console.error("Error in signOutUser:", err);
    return { error: err };
  }
}

/**
 * Get the current authenticated user and their profile data
 */
export async function getCurrentUser() {
  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.log("No active session found:", sessionError);
      return { user: null, profile: null, error: sessionError || new Error("No session found") };
    }
    
    console.log("Active session found for user:", session.user.id);
    
    // Get profile through secure API route instead of direct database access
    try {
      const profileResponse = await fetch(`/api/profiles?userId=${session.user.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!profileResponse.ok) {
        console.log("Profile fetch from API failed:", await profileResponse.text());
        
        // If we get a 404 (not found), attempt to create the profile
        if (profileResponse.status === 404) {
          console.log("No profile found, attempting to create one");
          
          const userType = session.user.user_metadata?.user_type as UserType;
          const fullName = session.user.user_metadata?.full_name;
          
          if (userType) {
            const { success, profile: newProfile } = await ensureUserProfile(
              session.user.id,
              userType,
              fullName
            );
            
            if (success) {
              console.log("Successfully created missing profile");
              return { user: session.user, profile: newProfile, error: null };
            }
          }
        }
        
        // If we reach here, there was some error with the profile, but we still have the user
        // Return the session user but with null profile
        return { 
          user: session.user, 
          profile: null, 
          error: new Error(`Profile error: API returned ${profileResponse.status}`) 
        };
      }
      
      const { profile } = await profileResponse.json();
      
      // Success - we have both user and profile
      return { user: session.user, profile, error: null };
    } catch (err: any) {
      console.error("Unexpected error in profile fetch:", err);
      // Still return user if we have it, even if profile fetch failed
      return { 
        user: session.user, 
        profile: null, 
        error: new Error(`Profile fetch error: ${err.message}`) 
      };
    }
  } catch (err: any) {
    console.error("Error in getCurrentUser:", err);
    return { user: null, profile: null, error: err };
  }
}

/**
 * Create a user profile if it doesn't exist
 * Uses secure API route instead of direct database access
 */
export async function ensureUserProfile(
  userId: string, 
  userType: UserType,
  fullName?: string
) {
  if (!userId || !userType) {
    return { success: false, error: new Error('Missing required parameters') };
  }
  
  try {
    // Create/update profile through API route
    const response = await fetch('/api/profiles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        userType,
        fullName: fullName || 'InstaBids User',
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error from profile API:', errorText);
      return { success: false, error: new Error(errorText) };
    }
    
    const data = await response.json();
    console.log('Profile API response:', data);
    
    return { 
      success: true, 
      profileExists: !data.created, 
      profile: data.profile 
    };
  } catch (err) {
    console.error('Unexpected error in ensureUserProfile:', err);
    return { success: false, error: err };
  }
}

/**
 * Get user type explicitly from the profiles table
 * Uses secure API route instead of direct database access
 */
export async function getUserType(userId: string): Promise<UserType | null> {
  if (!userId) return null;
  
  try {
    // Query profile via API route
    const response = await fetch(`/api/profiles?userId=${userId}`);
    
    if (!response.ok) {
      console.error('Error fetching user type:', response.statusText);
      
      // If the error is that no rows were returned, the profile might not exist
      if (response.status === 404) {
        // Try to find the user in auth to get their type from metadata
        const { data: { user } } = await supabase.auth.getUser(userId);
        
        if (user && user.user_metadata?.user_type) {
          const userType = user.user_metadata.user_type as UserType;
          
          // Create the missing profile
          await ensureUserProfile(
            userId, 
            userType, 
            user.user_metadata?.full_name
          );
          
          return userType;
        }
      }
      
      return null;
    }
    
    const { profile } = await response.json();
    console.log('Retrieved user type from API:', profile?.user_type);
    return profile?.user_type as UserType || null;
  } catch (err) {
    console.error('Unexpected error in getUserType:', err);
    return null;
  }
}
