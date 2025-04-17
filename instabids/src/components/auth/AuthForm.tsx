'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuth } from '@/providers/AuthProvider';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

interface AuthFormProps {
  mode?: 'signin' | 'signup';
  redirectUrl?: string;
  onSuccess?: () => void;
}

export default function AuthForm({ mode = 'signin', redirectUrl, onSuccess }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, refreshSession } = useAuth();
  const supabase = createClientComponentClient<Database>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(`Sign in failed: ${error.message}`);
          return;
        }
        
        toast.success('Signed in successfully');
        
        if (redirectUrl) {
          window.location.href = redirectUrl;
        } else if (onSuccess) {
          onSuccess();
        }
      } else {
        // Sign up flow
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl || window.location.origin,
          },
        });

        if (error) {
          toast.error(`Sign up failed: ${error.message}`);
          return;
        }

        toast.success('Check your email for the confirmation link');
      }
    } catch (error: any) {
      toast.error(`Authentication error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle OAuth sign in
  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl || window.location.origin,
        },
      });
      
      if (error) {
        toast.error(`OAuth sign in failed: ${error.message}`);
      }
    } catch (error: any) {
      toast.error(`OAuth error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {mode === 'signin' ? 'Sign In' : 'Create Account'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            disabled={loading}
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            disabled={loading}
          />
        </div>
        
        <Button 
          type="submit" 
          className="w-full" 
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <span className="animate-spin mr-2 h-4 w-4 border-2 border-b-0 border-r-0 rounded-full"></span>
              {mode === 'signin' ? 'Signing In' : 'Creating Account'}
            </span>
          ) : mode === 'signin' ? 'Sign In' : 'Create Account'}
        </Button>
      </form>
      
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOAuthSignIn('google')}
            disabled={loading}
            className="w-full"
          >
            Google
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOAuthSignIn('github')}
            disabled={loading}
            className="w-full"
          >
            GitHub
          </Button>
        </div>
      </div>
      
      <div className="mt-6 text-center text-sm">
        {mode === 'signin' ? (
          <p>
            Don't have an account?{' '}
            <a href="/signup" className="text-blue-600 hover:text-blue-800">
              Sign up
            </a>
          </p>
        ) : (
          <p>
            Already have an account?{' '}
            <a href="/signin" className="text-blue-600 hover:text-blue-800">
              Sign in
            </a>
          </p>
        )}
      </div>
    </div>
  );
}