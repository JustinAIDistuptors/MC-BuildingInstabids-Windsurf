/**
 * Authentication utilities for InstaBids
 * Provides helper functions for auth-related operations
 */

import { UserType } from "./types";
import { createClient } from "../supabase/client";

// Create a Supabase client that will automatically use the mock version when needed
export const supabaseAuth = createClient();

/**
 * Sign up a new user with email, password and profile information
 */
export async function signUpUser({
  email,
  password,
  fullName,
  userType,
}: {
  email: string;
  password: string;
  fullName: string;
  userType: UserType;
}) {
  try {
    // 1. Sign up user in Supabase Auth
    const { data, error } = await supabaseAuth.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          user_type: userType,
        },
      },
    });

    if (error) throw error;
    
    console.log('User signed up successfully:', data?.user);

    // 2. Create a profile entry in our profiles table
    if (data?.user) {
      const { error: profileError } = await supabaseAuth.from("profiles").insert({
        id: data.user.id,
        full_name: fullName,
        user_type: userType,
      });

      if (profileError) {
        console.error("Error creating profile:", profileError);
      }
    }

    return { data, error: null };
  } catch (err: any) {
    console.error("Error in signUpUser:", err);
    return { data: null, error: err };
  }
}

/**
 * Sign in existing user with email/password
 */
export async function signInUser({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  try {
    const { data, error } = await supabaseAuth.auth.signInWithPassword({
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
    const { error } = await supabaseAuth.auth.signOut();
    return { error };
  } catch (err: any) {
    console.error("Error in signOutUser:", err);
    return { error: err };
  }
}

/**
 * Get the current user's session and profile
 */
export async function getCurrentUser() {
  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabaseAuth.auth.getSession();
    
    if (sessionError || !session) {
      return { user: null, profile: null, error: sessionError };
    }
    
    // Get user profile from our profiles table
    const { data: profile, error: profileError } = await supabaseAuth
      .from("profiles")
      .select("*")
      .eq("id", session.user?.id)
      .single();
    
    if (profileError) {
      console.error("Error fetching profile:", profileError);
    }
    
    return { 
      user: session.user, 
      profile, 
      error: profileError 
    };
  } catch (err: any) {
    console.error("Error in getCurrentUser:", err);
    return { user: null, profile: null, error: err };
  }
}
