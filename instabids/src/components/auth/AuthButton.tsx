'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/AuthProvider';

interface AuthButtonProps {
  onAuthStateChange?: (isAuthenticated: boolean, userId?: string) => void;
  redirectUrl?: string;
}

/**
 * Authentication button component that handles sign-in and sign-out
 * Uses the AuthProvider for consistent auth state management
 */
export default function AuthButton({ onAuthStateChange, redirectUrl }: AuthButtonProps) {
  // Use the auth context
  const { user, isLoading, signIn, signOut } = useAuth();

  // Notify parent component of auth state changes
  React.useEffect(() => {
    if (onAuthStateChange) {
      onAuthStateChange(!!user, user?.id);
    }
  }, [user, onAuthStateChange]);

  // Handle sign in
  const handleSignIn = async () => {
    await signIn();
  };

  // Handle sign out
  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <Button
      onClick={user ? handleSignOut : handleSignIn}
      disabled={isLoading}
      variant={user ? "outline" : "default"}
      className="min-w-[100px] h-9 px-3 text-sm"
    >
      {isLoading ? (
        <span className="flex items-center">
          <span className="animate-spin mr-2 h-4 w-4 border-2 border-b-0 border-r-0 rounded-full"></span>
          {user ? 'Signing out' : 'Signing in'}
        </span>
      ) : user ? 'Sign Out' : 'Sign In'}
    </Button>
  );
}