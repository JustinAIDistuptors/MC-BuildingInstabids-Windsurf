'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

export default function ResetPage() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  
  const handleReset = async () => {
    try {
      setIsResetting(true);
      setMessage('Resetting application state...');
      
      // Clear all localStorage
      localStorage.clear();
      
      // Set a clean mock_projects array
      localStorage.setItem('mock_projects', '[]');
      
      // Force using localStorage
      localStorage.setItem('use_supabase', 'false');
      
      // Clear any React Query cache if it exists
      if (window.queryCache) {
        window.queryCache.clear();
      }
      
      // Clear any service worker caches
      if ('caches' in window) {
        try {
          const cacheNames = await window.caches.keys();
          await Promise.all(
            cacheNames.map(cacheName => window.caches.delete(cacheName))
          );
        } catch (e) {
          console.error('Error clearing caches:', e);
        }
      }
      
      // Unregister service workers
      if ('serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const registration of registrations) {
            await registration.unregister();
          }
        } catch (e) {
          console.error('Error unregistering service workers:', e);
        }
      }
      
      setMessage('Reset complete! Redirecting...');
      
      // Force a hard reload
      setTimeout(() => {
        window.location.href = '/dashboard/homeowner';
      }, 2000);
    } catch (error) {
      console.error('Error during reset:', error);
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsResetting(false);
    }
  };
  
  return (
    <div className="container max-w-md mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle>Reset Application</CardTitle>
          <CardDescription>
            This will completely reset the application state and clear all data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            Use this option if you're experiencing issues with the application, such as:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-500 mb-4">
            <li>Projects that can't be deleted</li>
            <li>UI not updating properly</li>
            <li>Unexpected behavior</li>
          </ul>
          <div className="bg-amber-50 border border-amber-200 rounded p-3 text-amber-800 text-sm">
            <strong>Warning:</strong> This will delete all your local data. This action cannot be undone.
          </div>
          
          {message && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-blue-800 text-sm">
              {message}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={isResetting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleReset}
            disabled={isResetting}
          >
            {isResetting ? (
              <>
                <span className="mr-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
                Resetting...
              </>
            ) : (
              'Reset Application'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
