"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getCurrentUser } from '@/lib/auth/auth-utils';

export default function Navigation() {
  const [userType, setUserType] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const { user, profile, error } = await getCurrentUser();
        
        if (error) {
          console.error("Error getting current user:", error);
          setMessage("Error loading user information.");
          setIsLoading(false);
          return;
        }
        
        if (user) {
          // Use profile user_type if available, otherwise fall back to metadata
          const type = profile?.user_type || user.user_metadata?.user_type;
          setUserType(type);
          setUserId(user.id);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error("Error in navigation:", err);
        setMessage("An unexpected error occurred.");
        setIsLoading(false);
      }
    }
    
    loadUser();
  }, []);

  // Generate dashboard link based on user type
  const getDashboardLink = () => {
    if (!userType) return '/dashboard';
    return `/dashboard/${userType}`;
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">InstaBids Navigation</h1>
          
          {isLoading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-md">
                <h2 className="text-lg font-medium mb-2">User Information</h2>
                {userType ? (
                  <div className="space-y-1">
                    <p>User Type: <span className="font-medium">{userType}</span></p>
                    <p>User ID: <span className="font-medium text-xs">{userId}</span></p>
                  </div>
                ) : (
                  <p className="text-gray-500">Not logged in</p>
                )}
              </div>
              
              {message && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">{message}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-3">
                <h2 className="text-lg font-medium">Available Routes</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <NavigationCard 
                    title="Your Dashboard" 
                    description={`Go to your ${userType || 'user'} dashboard`}
                    href={getDashboardLink()}
                  />
                  
                  <NavigationCard 
                    title="Admin Panel" 
                    description="Access the admin panel and agent integration areas"
                    href="/admin"
                  />
                  
                  <NavigationCard 
                    title="Home Page" 
                    description="Return to the main landing page"
                    href="/"
                  />
                  
                  <NavigationCard 
                    title="Login Page" 
                    description="Sign in with a different account"
                    href="/login"
                  />

                  <NavigationCard 
                    title="Homeowner Dashboard" 
                    description="Access homeowner dashboard"
                    href="/dashboard/homeowner"
                  />

                  <NavigationCard 
                    title="Contractor Dashboard" 
                    description="Access contractor dashboard"
                    href="/dashboard/contractor"
                  />

                  <NavigationCard 
                    title="Labor-Contractor Dashboard" 
                    description="Access labor contractor dashboard"
                    href="/dashboard/labor-contractor"
                  />

                  <NavigationCard 
                    title="Property-Manager Dashboard" 
                    description="Access property manager dashboard"
                    href="/dashboard/property-manager"
                  />

                  <NavigationCard 
                    title="Admin Dashboard" 
                    description="Access admin dashboard"
                    href="/dashboard/admin"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NavigationCard({ 
  title, 
  description, 
  href 
}: { 
  title: string; 
  description: string; 
  href: string;
}) {
  return (
    <Link href={href}>
      <div className="bg-white border border-gray-200 rounded-md shadow-sm p-4 hover:bg-blue-50 hover:border-blue-100 transition-colors cursor-pointer">
        <h3 className="text-md font-medium text-gray-900">{title}</h3>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>
    </Link>
  );
}
