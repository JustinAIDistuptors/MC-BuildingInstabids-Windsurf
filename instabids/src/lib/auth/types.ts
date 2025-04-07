/**
 * Type definitions for authentication and user profiles
 */

// User types supported by InstaBids
export type UserType = 'homeowner' | 'contractor' | 'property-manager' | 'labor-contractor' | 'admin';

// User profile structure as stored in the database
export interface UserProfile {
  id: string;
  full_name: string;
  user_type: UserType;
  avatar_url?: string;
  company_name?: string;
  website?: string;
  phone?: string;
  bio?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  created_at: string;
  updated_at: string;
}

// Supabase auth user 
export interface AuthUser {
  id: string;
  email?: string;
  app_metadata: {
    provider?: string;
    [key: string]: any;
  };
  user_metadata: {
    full_name?: string;
    user_type?: UserType;
    [key: string]: any;
  };
  aud: string;
  created_at?: string;
}

// Sign-up response type
export interface SignUpResponse {
  data: {
    user: AuthUser | null;
    session: any | null;
  } | null;
  error: any | null;
}

// Sign-in response type
export interface SignInResponse {
  data: {
    user: AuthUser | null;
    session: any | null;
  } | null;
  error: any | null;
}

// Get current user response
export interface GetUserResponse {
  user: AuthUser | null;
  profile: UserProfile | null;
  error: any | null;
}
