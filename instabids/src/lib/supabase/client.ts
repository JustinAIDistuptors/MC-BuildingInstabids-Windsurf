/**
 * Client-side Supabase client
 * For use in Client Components with "use client" directive
 * 
 * Following Supabase best practices for InstaBids
 */
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

// Singleton pattern for the Supabase client to ensure consistent authentication state
let _supabaseClient: ReturnType<typeof createClientComponentClient<Database>> | null = null;

/**
 * Get the Supabase client instance
 * This ensures we're always using the same client instance throughout the application
 * which prevents authentication state inconsistencies
 */
export function getSupabaseClient() {
  if (typeof window === 'undefined') {
    // Server-side - create a new instance each time
    return createClientComponentClient<Database>();
  }
  
  // Client-side - use singleton pattern
  if (!_supabaseClient) {
    _supabaseClient = createClientComponentClient<Database>();
  }
  
  return _supabaseClient;
}

// Export the client for backward compatibility
export const supabase = typeof window !== 'undefined' ? getSupabaseClient() : null;

/**
 * Helper function to check authentication status
 * @returns Promise resolving to true if authenticated, false otherwise
 */
export async function ensureAuthentication(): Promise<boolean> {
  try {
    const client = getSupabaseClient();
    if (!client) return false;
    
    // Check if we have a session
    const { data: { session } } = await client.auth.getSession();
    
    if (session) {
      return true;
    }
    
    // Not authenticated
    return false;
  } catch (error) {
    console.error('Authentication check failed:', error);
    return false;
  }
}

/**
 * Get the current user ID
 * @returns Promise resolving to user ID if authenticated, null otherwise
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const client = getSupabaseClient();
    if (!client) return null;
    
    const { data } = await client.auth.getUser();
    return data?.user?.id || null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}
