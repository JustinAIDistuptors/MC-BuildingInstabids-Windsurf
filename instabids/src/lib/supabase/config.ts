/**
 * Supabase Configuration
 * 
 * This file contains the configuration for the Supabase client.
 * It provides a consistent way to access Supabase credentials across the application.
 */

// Default values for development - REPLACE THESE with your actual Supabase credentials
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project-url.supabase.co';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

// Validate configuration
if (SUPABASE_URL === 'https://your-project-url.supabase.co' || 
    SUPABASE_ANON_KEY === 'your-anon-key') {
  console.warn(
    'Supabase credentials are using default values. ' +
    'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY ' +
    'in your .env.local file or environment variables.'
  );
}

export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

// Database schema names
export const SCHEMAS = {
  PUBLIC: 'public',
  MESSAGING: 'messaging',
};

// Database table names
export const TABLES = {
  MESSAGES: 'messages',
  MESSAGE_RECIPIENTS: 'message_recipients',
  CONTRACTOR_ALIASES: 'contractor_aliases',
  PROJECTS: 'projects',
  USERS: 'users',
};
