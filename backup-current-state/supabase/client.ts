/**
 * Client-side Supabase client
 * For use in Client Components with "use client" directive
 */
import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials. Please check your .env.local file.');
}

// Flag to indicate if we're using development fallbacks
export const isUsingDevFallback = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_DEV_FALLBACKS === 'true';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'instabids-auth-token',
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Helper function to check and fix authentication
export async function ensureAuthentication() {
  try {
    // Check if we have a session
    const { data: { session } } = await supabase.auth.getSession();
    
    // If no session, try to sign in anonymously
    if (!session) {
      console.log('No session found, attempting anonymous sign-in');
      const { data, error } = await supabase.auth.signInAnonymously();
      
      if (error) {
        console.error('Anonymous sign-in failed:', error);
        return false;
      }
      
      console.log('Anonymous sign-in successful');
      return true;
    }
    
    return true;
  } catch (error) {
    console.error('Authentication check failed:', error);
    return false;
  }
}

// Initialize authentication on load
if (typeof window !== 'undefined') {
  ensureAuthentication().catch(error => {
    console.error('Failed to initialize authentication:', error);
  });
}
