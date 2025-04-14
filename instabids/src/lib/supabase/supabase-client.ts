/**
 * Supabase Client
 * 
 * This file provides a configured Supabase client for use throughout the application.
 * It handles authentication and provides a consistent interface to Supabase.
 */

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';

// Create a single supabase client for the entire app
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    storageKey: 'instabids-auth',
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

/**
 * Ensure the user is authenticated
 * This is useful for components that require authentication
 */
export async function ensureAuthentication(): Promise<boolean> {
  try {
    // Check if we have a session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      return true;
    }
    
    // If no session, try to sign in anonymously for development
    if (process.env.NODE_ENV === 'development') {
      const { data, error } = await supabase.auth.signInAnonymously();
      
      if (error) {
        console.error('Error signing in anonymously:', error);
        return false;
      }
      
      return !!data.session;
    }
    
    return false;
  } catch (error) {
    console.error('Error ensuring authentication:', error);
    return false;
  }
}
