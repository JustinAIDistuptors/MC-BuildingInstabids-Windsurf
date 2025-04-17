'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import AuthButton from '@/components/auth/AuthButton';
import { ContractorMessagingService } from '@/services/ContractorMessagingService';
import { toast } from 'sonner';

/**
 * Test page for authentication
 * This page is used to verify that authentication is working correctly
 */
export default function AuthTestPage() {
  const { user, isLoading } = useAuth();
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  // Function to test authentication
  const testAuth = async () => {
    setTestLoading(true);
    setTestResult(null);
    
    try {
      // Test if we can get messages (requires authentication)
      const isAuthenticated = await ContractorMessagingService.ensureAuthentication();
      
      if (isAuthenticated) {
        setTestResult('✅ Authentication successful! User is authenticated.');
        toast.success('Authentication test passed');
      } else {
        setTestResult('❌ Authentication failed. User is not authenticated.');
        toast.error('Authentication test failed');
      }
    } catch (error: any) {
      setTestResult(`❌ Error testing authentication: ${error.message}`);
      toast.error('Authentication test error');
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Authentication Test Page</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
        
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <span>Loading authentication status...</span>
          </div>
        ) : user ? (
          <div className="space-y-2">
            <p className="text-green-600 font-medium">✅ Authenticated</p>
            <div className="bg-gray-50 p-4 rounded border">
              <p><span className="font-medium">User ID:</span> {user.id}</p>
              <p><span className="font-medium">Email:</span> {user.email}</p>
            </div>
          </div>
        ) : (
          <p className="text-red-600 font-medium">❌ Not authenticated</p>
        )}
        
        <div className="mt-4">
          <AuthButton />
        </div>
      </div>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Authentication Test</h2>
        <p className="mb-4">Click the button below to test if the authentication is working correctly with the messaging service.</p>
        
        <button
          onClick={testAuth}
          disabled={testLoading || isLoading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {testLoading ? (
            <span className="flex items-center space-x-2">
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
              <span>Testing...</span>
            </span>
          ) : 'Test Authentication'}
        </button>
        
        {testResult && (
          <div className={`mt-4 p-4 rounded ${testResult.includes('✅') ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            {testResult}
          </div>
        )}
      </div>
    </div>
  );
}
