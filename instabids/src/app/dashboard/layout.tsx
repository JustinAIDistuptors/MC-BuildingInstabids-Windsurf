"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getCurrentUser, signOutUser } from '@/lib/auth/auth-utils';
import type { UserType } from '@/lib/auth/types';
import { Button } from '@/components/ui/button';

// Define user interface with proper typing
interface UserProfile {
  id: string;
  full_name?: string;
  user_type?: UserType;
  [key: string]: any;
}

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    user_type?: UserType;
    [key: string]: any;
  };
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Early redirect for incorrect paths
  useEffect(() => {
    if (!pathname || !pathname.startsWith('/dashboard/')) return;
    
    // Automatically route '/dashboard' to '/dashboard/homeowner' as fallback
    if (pathname === '/dashboard') {
      router.replace('/dashboard/homeowner');
    }
  }, [pathname, router]);

  // Load user data and handle role-based routing
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        setAuthError(null);
        
        // For development, provide a default user to bypass auth
        const devUser = {
          id: 'dev-user-id',
          email: 'dev@example.com',
          user_metadata: {
            full_name: 'Developer User',
            user_type: 'homeowner' as UserType
          }
        };
        
        // Set the development user
        setUser(devUser);
        setProfile({
          id: devUser.id,
          full_name: devUser.user_metadata?.full_name,
          user_type: devUser.user_metadata?.user_type
        });
        
        setLoading(false);
        
      } catch (error) {
        console.error("Error loading user data:", error);
        setAuthError("Failed to load user data");
        setLoading(false);
      }
    };
    
    loadUserData();
    
    return () => {
      // Cleanup
    };
  }, [router]);

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOutUser();
      router.push('/login');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // If loading, show a loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin border-4 border-blue-500 border-t-transparent rounded-full"></div>
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  // If there's an auth error, show login button
  if (authError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-red-50 text-red-800 p-4 mb-4 rounded-md">
          {authError}
        </div>
        <Link href="/login" className="bg-blue-600 text-white px-4 py-2 rounded">
          Go to Login
        </Link>
      </div>
    );
  }

  // Get appropriate nav items based on user type
  const getNavItems = (userType: UserType | undefined) => {
    // Common items for all user types
    const commonItems = [
      { name: "Dashboard", href: `/dashboard/${userType}` },
      { name: "Account", href: `/dashboard/${userType}/account` },
    ];
    
    // User type specific items
    switch(userType) {
      case "homeowner":
        return [
          ...commonItems,
          { name: "My Projects", href: "/dashboard/homeowner/projects" },
          {
            name: "New Project",
            href: "/dashboard/homeowner/new-project",
          },
        ];
      case "contractor":
        return [
          ...commonItems,
          { name: "Available Jobs", href: "/dashboard/contractor/jobs" },
          { name: "My Bids", href: "/dashboard/contractor/bids" },
        ];
      case "admin":
        return [
          ...commonItems,
          { name: "Users", href: "/dashboard/admin/users" },
          { name: "Projects", href: "/dashboard/admin/projects" },
        ];
      default:
        return commonItems;
    }
  };

  // Get user type for navigation
  const userType = profile?.user_type || 'homeowner';
  const navItems = getNavItems(userType);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hover:scale-105 transition-transform">
              InstaBids
            </Link>
            <div className="px-2 py-1 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 text-xs font-medium text-blue-700 capitalize animate-fade-in">
              {userType}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="relative group">
              <div className="flex items-center space-x-2 cursor-pointer p-1 rounded-md hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-medium text-sm shadow-sm transform hover:scale-105 transition-transform">
                  {profile?.full_name?.[0] || user?.email?.[0] || 'U'}
                </div>
                <span className="text-sm font-medium">
                  {profile?.full_name || user?.email || 'User'}
                </span>
                <svg className="h-4 w-4 text-gray-400 group-hover:rotate-180 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              
              {/* Dropdown menu - hidden by default, shown on hover */}
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right group-hover:translate-y-0 translate-y-2 z-50">
                <div className="py-1">
                  <Link href="/dashboard/homeowner/account" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Account Settings
                  </Link>
                  <button 
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              onClick={handleSignOut}
              className="text-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all duration-200 transform hover:scale-105"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </Button>
          </div>
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-gradient-to-b from-gray-50 to-gray-100 border-r overflow-y-auto shadow-sm">
          <nav className="p-4">
            <div className="mb-6">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-4">
                {userType === 'homeowner' ? 'Homeowner Portal' : 
                 userType === 'contractor' ? 'Contractor Portal' : 'Admin Portal'}
              </div>
              <div className="h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-4 mb-4 opacity-70"></div>
            </div>
            <ul className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                <li key={item.href} className="transition-all duration-200 ease-in-out">
                  <Link
                    href={item.href}
                    className={`flex items-center px-4 py-3 rounded-md transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600 shadow-sm border-l-2 border-blue-500"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {item.name === "Dashboard" && (
                      <svg className={`mr-3 h-5 w-5 ${isActive ? "text-blue-500" : "text-gray-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    )}
                    {item.name === "Account" && (
                      <svg className={`mr-3 h-5 w-5 ${isActive ? "text-blue-500" : "text-gray-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                    {item.name === "My Projects" && (
                      <svg className={`mr-3 h-5 w-5 ${isActive ? "text-blue-500" : "text-gray-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    )}
                    {item.name === "New Project" && (
                      <svg className={`mr-3 h-5 w-5 ${isActive ? "text-blue-500" : "text-gray-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    )}
                    {item.name === "Available Jobs" && (
                      <svg className={`mr-3 h-5 w-5 ${isActive ? "text-blue-500" : "text-gray-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    )}
                    {item.name === "My Bids" && (
                      <svg className={`mr-3 h-5 w-5 ${isActive ? "text-blue-500" : "text-gray-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                    {item.name === "Users" && (
                      <svg className={`mr-3 h-5 w-5 ${isActive ? "text-blue-500" : "text-gray-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    )}
                    {item.name === "Projects" && (
                      <svg className={`mr-3 h-5 w-5 ${isActive ? "text-blue-500" : "text-gray-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    )}
                    <span className={`${isActive ? "font-medium" : ""} transition-all duration-200`}>{item.name}</span>
                    {isActive && (
                      <span className="ml-auto animate-pulse bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </Link>
                </li>
              )})}
            </ul>
            
            <div className="mt-8 px-4">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100 shadow-sm">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Need Help?</h3>
                <p className="text-xs text-blue-600 mb-3">Contact our support team for assistance with your projects.</p>
                <Button 
                  variant="outline" 
                  className="w-full text-xs bg-white hover:bg-blue-50 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  Contact Support
                </Button>
              </div>
            </div>
          </nav>
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-100">
          {children}
        </main>
      </div>
    </div>
  );
}
