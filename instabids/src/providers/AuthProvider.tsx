'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';

// Define the auth context type
type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

// Create the auth context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signIn: async () => {},
  signOut: async () => {},
  refreshSession: async () => {},
});

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = getSupabaseClient();

  // Function to refresh the session
  const refreshSession = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error refreshing session:', error);
        return;
      }
      
      setSession(data.session);
      setUser(data.session?.user || null);
    } catch (error) {
      console.error('Unexpected error refreshing session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to sign in with Google OAuth
  const signIn = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.href,
        },
      });
      
      if (error) {
        toast.error('Sign in failed: ' + error.message);
      }
    } catch (error: any) {
      toast.error('Sign in error: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to sign out
  const signOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast.error('Sign out failed: ' + error.message);
      } else {
        setUser(null);
        setSession(null);
        toast.success('Signed out successfully');
      }
    } catch (error: any) {
      toast.error('Sign out error: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize auth state and set up listener for auth changes
  useEffect(() => {
    // Get initial session
    refreshSession();
    
    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log('Auth state changed:', event);
      setSession(newSession);
      setUser(newSession?.user || null);
      setIsLoading(false);
    });
    
    // Clean up listener on unmount
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Context value
  const value = {
    user,
    session,
    isLoading,
    signIn,
    signOut,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
