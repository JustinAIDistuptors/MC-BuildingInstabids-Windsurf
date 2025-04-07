/**
 * Client-side Supabase client
 * For use in Client Components with "use client" directive
 */
import { createBrowserClient } from '@supabase/ssr';
import { createMockSupabaseClient } from './mock-client';

export function createClient() {
  // Check if Supabase environment variables are available
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    // Fall back to mock client for development/testing
    console.warn('⚠️ Using mock Supabase client - no environment variables found');
    return createMockSupabaseClient();
  }
  
  // Use real Supabase client if environment variables are available
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
