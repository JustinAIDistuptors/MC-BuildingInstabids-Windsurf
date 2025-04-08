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
            href: "/simple-bid",
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
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-xl font-bold text-blue-600">
              InstaBids
            </Link>
            <span className="text-sm text-gray-500">{userType}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm mr-2">
              {profile?.full_name || user?.email || 'User'}
            </span>
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-gray-50 border-r overflow-y-auto">
          <nav className="p-4">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`block px-4 py-2 rounded ${
                      pathname === item.href
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
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
