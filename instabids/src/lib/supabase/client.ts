/**
 * Client-side Supabase client
 * For use in Client Components with "use client" directive
 */
import { createClient as createBrowserClient } from '@supabase/supabase-js';

// Standard client for regular auth operations
export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials. Please check your .env.local file.');
  }

  return createBrowserClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      storageKey: 'instabids-auth-token',
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
};

// Export singleton instance for consistent usage
export const supabase = createClient();
