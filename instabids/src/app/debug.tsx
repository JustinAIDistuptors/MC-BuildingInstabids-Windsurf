'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DebugPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [clientInfo, setClientInfo] = useState<{
    url: string;
    userAgent: string;
    windowSize: string;
  } | null>(null);

  useEffect(() => {
    setClientInfo({
      url: window.location.href,
      userAgent: navigator.userAgent,
      windowSize: `${window.innerWidth}x${window.innerHeight}`,
    });
  }, []);

  return (
    <div className="min-h-screen p-8 bg-white">
      <h1 className="text-2xl font-bold mb-6">InstaBids Debug Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-6 border rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">System Information</h2>
          <div className="space-y-2">
            <p><strong>Current Path:</strong> {pathname}</p>
            {clientInfo && (
              <>
                <p><strong>Full URL:</strong> {clientInfo.url}</p>
                <p><strong>User Agent:</strong> {clientInfo.userAgent}</p>
                <p><strong>Window Size:</strong> {clientInfo.windowSize}</p>
              </>
            )}
          </div>
        </div>
        
        <div className="p-6 border rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Navigation Tests</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Direct Links</h3>
              <div className="flex flex-wrap gap-2">
                <Link href="/" className="px-3 py-1 bg-blue-100 rounded hover:bg-blue-200">
                  Root (/)
                </Link>
                <Link href="/dashboard" className="px-3 py-1 bg-blue-100 rounded hover:bg-blue-200">
                  Dashboard
                </Link>
                <Link href="/dashboard/homeowner" className="px-3 py-1 bg-blue-100 rounded hover:bg-blue-200">
                  Homeowner Dashboard
                </Link>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Router Navigation</h3>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => router.push('/')}
                  className="px-3 py-1 bg-green-100 rounded hover:bg-green-200"
                >
                  Push to Root
                </button>
                <button 
                  onClick={() => router.push('/dashboard/homeowner')}
                  className="px-3 py-1 bg-green-100 rounded hover:bg-green-200"
                >
                  Push to Homeowner
                </button>
                <button 
                  onClick={() => router.replace('/dashboard/homeowner')}
                  className="px-3 py-1 bg-green-100 rounded hover:bg-green-200"
                >
                  Replace to Homeowner
                </button>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Cache Control</h3>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => {
                    router.refresh();
                  }}
                  className="px-3 py-1 bg-yellow-100 rounded hover:bg-yellow-200"
                >
                  Refresh Router
                </button>
                <button 
                  onClick={() => {
                    window.location.reload();
                  }}
                  className="px-3 py-1 bg-yellow-100 rounded hover:bg-yellow-200"
                >
                  Hard Reload
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 p-6 border rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link 
            href="/dashboard/homeowner" 
            className="p-4 bg-blue-500 text-white rounded-lg text-center hover:bg-blue-600"
          >
            Go to Homeowner Dashboard
          </Link>
          <Link 
            href="/test-messaging" 
            className="p-4 bg-purple-500 text-white rounded-lg text-center hover:bg-purple-600"
          >
            Test Messaging Component
          </Link>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            className="p-4 bg-red-500 text-white rounded-lg text-center hover:bg-red-600"
          >
            Clear LocalStorage & Reload
          </button>
        </div>
      </div>
    </div>
  );
}
