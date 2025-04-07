/**
 * Authentication Test Script
 * 
 * This React component can be used to test that all user types can properly
 * sign up and log in within the InstaBids application.
 * 
 * Usage:
 * - Create a test page that imports and renders this component
 * - It will display a UI to test signup and login for all user types
 * - Results will be displayed in the UI and console
 */

import React, { useState, useEffect } from 'react';
import { signUpUser, signInUser, signOutUser, getCurrentUser } from '../lib/auth/auth-utils';
import { UserType } from '../lib/auth/types';
import { TEST_USERS } from '../lib/supabase/mock-client';

export default function AuthTester() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [autoTestComplete, setAutoTestComplete] = useState(false);
  const [autoTestInProgress, setAutoTestInProgress] = useState(false);

  const userTypes: UserType[] = ['homeowner', 'contractor', 'property-manager', 'labor-contractor'];
  
  // Add a log entry to the results
  const log = (message: string) => {
    console.log(message);
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()} - ${message}`]);
  };

  // Test user signup
  const testSignUp = async (userType: UserType) => {
    setLoading(true);
    log(`Testing signup for ${userType}...`);
    
    const email = `test-${userType}@example.com`;
    const password = 'Password123!';
    const fullName = `Test ${userType.charAt(0).toUpperCase() + userType.slice(1)}`;
    
    try {
      const { data, error } = await signUpUser({
        email,
        password,
        fullName,
        userType
      });
      
      if (error) {
        log(`❌ Signup failed for ${userType}: ${error.message}`);
        return false;
      } else {
        log(`✅ Signup successful for ${userType}!`);
        log(`User ID: ${data?.user?.id}`);
        log(`User Type: ${data?.user?.user_metadata?.user_type}`);
        return true;
      }
    } catch (err: any) {
      log(`❌ Error during signup: ${err.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Test user login
  const testSignIn = async (userType: UserType) => {
    setLoading(true);
    log(`Testing login for ${userType}...`);
    
    const email = `test-${userType}@example.com`;
    const password = 'Password123!';
    
    try {
      const { data, error } = await signInUser({
        email,
        password
      });
      
      if (error) {
        log(`❌ Login failed for ${userType}: ${error.message}`);
        return false;
      } else {
        log(`✅ Login successful for ${userType}!`);
        log(`User ID: ${data?.user?.id}`);
        log(`User Type: ${data?.user?.user_metadata?.user_type}`);
        setCurrentUser(data?.user);
        return true;
      }
    } catch (err: any) {
      log(`❌ Error during login: ${err.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Test login with pre-defined users from mock client
  const testSignInMockUser = async (userType: UserType) => {
    setLoading(true);
    log(`Testing login for mock ${userType}...`);
    
    const mockUser = TEST_USERS[userType];
    if (!mockUser) {
      log(`❌ No mock user found for ${userType}`);
      setLoading(false);
      return false;
    }
    
    try {
      const { data, error } = await signInUser({
        email: mockUser.email,
        password: mockUser.password
      });
      
      if (error) {
        log(`❌ Login failed for mock ${userType}: ${error.message}`);
        return false;
      } else {
        log(`✅ Login successful for mock ${userType}!`);
        log(`User ID: ${data?.user?.id}`);
        log(`User Type: ${data?.user?.user_metadata?.user_type}`);
        setCurrentUser(data?.user);
        return true;
      }
    } catch (err: any) {
      log(`❌ Error during login: ${err.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Test getting the current user
  const testGetCurrentUser = async () => {
    setLoading(true);
    log(`Testing getCurrentUser...`);
    
    try {
      const { user, profile, error } = await getCurrentUser();
      
      if (error) {
        log(`❌ getCurrentUser failed: ${error.message}`);
        return false;
      } else if (!user) {
        log(`❌ No user is currently logged in`);
        return false;
      } else {
        log(`✅ getCurrentUser successful!`);
        log(`User ID: ${user.id}`);
        log(`User Email: ${user.email}`);
        log(`User Type: ${user.user_metadata?.user_type}`);
        
        if (profile) {
          log(`Profile Full Name: ${profile.full_name}`);
          log(`Profile User Type: ${profile.user_type}`);
        } else {
          log(`⚠️ No profile found for user`);
        }
        
        setCurrentUser(user);
        return true;
      }
    } catch (err: any) {
      log(`❌ Error during getCurrentUser: ${err.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Test signing out
  const testSignOut = async () => {
    setLoading(true);
    log(`Testing signOut...`);
    
    try {
      const { error } = await signOutUser();
      
      if (error) {
        log(`❌ signOut failed: ${error.message}`);
        return false;
      } else {
        log(`✅ signOut successful!`);
        setCurrentUser(null);
        return true;
      }
    } catch (err: any) {
      log(`❌ Error during signOut: ${err.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Run automated tests for all user types
  const runAutoTests = async () => {
    if (autoTestInProgress) return;
    
    setAutoTestInProgress(true);
    log('Starting automated tests for all user types...');
    
    try {
      // Clear results and reset state
      setResults([]);
      setCurrentUser(null);
      
      // Test the pre-defined mock users first
      log('🧪 TESTING PRE-DEFINED MOCK USERS');
      for (const userType of userTypes) {
        await testSignInMockUser(userType);
        await testSignOut();
      }
      
      // Then test creating new users
      log('🧪 TESTING USER CREATION AND LOGIN');
      for (const userType of userTypes) {
        const signupResult = await testSignUp(userType);
        
        if (signupResult) {
          await testGetCurrentUser();
        }
        
        await testSignOut();
        
        if (signupResult) {
          await testSignIn(userType);
          await testSignOut();
        }
      }
      
      log('✅✅✅ All automated tests completed! ✅✅✅');
    } catch (error: any) {
      log(`❌ Error during automated tests: ${error.message}`);
    } finally {
      setAutoTestComplete(true);
      setAutoTestInProgress(false);
    }
  };

  // Auto-run tests when component mounts
  useEffect(() => {
    if (!autoTestComplete && !autoTestInProgress) {
      runAutoTests();
    }
  }, [autoTestComplete, autoTestInProgress]);

  return (
    <div className="max-w-4xl mx-auto px-4">
      <h1 className="text-2xl font-bold mb-4">InstaBids Authentication Tester</h1>
      <p className="mb-6">Test authentication flows for all user types in the InstaBids platform.</p>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Test Controls</h2>
        <div className="flex flex-wrap gap-2">
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            onClick={runAutoTests}
            disabled={loading || autoTestInProgress}
          >
            {autoTestInProgress ? 'Testing...' : autoTestComplete ? 'Run Tests Again' : 'Run All Tests'}
          </button>
          
          <button 
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            onClick={testSignOut}
            disabled={loading || !currentUser}
          >
            Sign Out
          </button>
          
          <button 
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            onClick={testGetCurrentUser}
            disabled={loading}
          >
            Get Current User
          </button>
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Manual Testing</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium mb-2">Test Sign Up</h3>
            <div className="flex flex-col gap-2">
              {userTypes.map(userType => (
                <button
                  key={`signup-${userType}`}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                  onClick={() => testSignUp(userType)}
                  disabled={loading}
                >
                  Sign Up as {userType}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Test Sign In</h3>
            <div className="flex flex-col gap-2">
              {userTypes.map(userType => (
                <button
                  key={`signin-${userType}`}
                  className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 disabled:opacity-50"
                  onClick={() => testSignIn(userType)}
                  disabled={loading}
                >
                  Sign In as {userType}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Mock Users</h2>
        <p className="mb-2 text-sm">The following pre-defined mock users are available for testing:</p>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Password</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(TEST_USERS).map(([type, user]) => (
                <tr key={type}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.password}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      className="text-indigo-600 hover:text-indigo-900"
                      onClick={() => testSignInMockUser(type as UserType)}
                    >
                      Sign In
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-2">Test Results</h2>
        {currentUser && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded">
            <h3 className="font-medium text-green-800">Current User</h3>
            <pre className="mt-2 text-sm overflow-x-auto">
              {JSON.stringify(currentUser, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="p-4 bg-gray-50 border border-gray-200 rounded h-96 overflow-y-auto">
          {results.length === 0 ? (
            <p className="text-gray-500">No results yet. Run a test to see output.</p>
          ) : (
            <div className="space-y-1">
              {results.map((result, index) => (
                <div 
                  key={index} 
                  className={`p-2 rounded text-sm font-mono ${
                    result.includes('❌') ? 'bg-red-50 text-red-800' : 
                    result.includes('✅') ? 'bg-green-50 text-green-800' : 
                    result.includes('⚠️') ? 'bg-yellow-50 text-yellow-800' : 
                    'bg-gray-50 text-gray-800'
                  }`}
                >
                  {result}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
