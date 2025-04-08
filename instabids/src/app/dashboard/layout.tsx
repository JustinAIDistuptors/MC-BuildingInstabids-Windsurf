"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getCurrentUser, signOutUser } from '@/lib/auth/auth-utils';
import type { UserType } from '@/lib/auth/types';

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
    let isMounted = true;
    
    async function loadUserData() {
      try {
        console.log("Fetching current user data...");
        const { user, profile, error } = await getCurrentUser();
        
        if (!isMounted) return;
        
        if (error || !user) {
          console.error("Authentication error:", error);
          setAuthError("You must be signed in to access this dashboard");
          setLoading(false);
          return;
        }
        
        // Set user data in state
        setUser(user);
        setProfile(profile);
        
        // Determine the correct user type (profile is the source of truth)
        let correctUserType = profile?.user_type || user.user_metadata?.user_type;
        
        // Enhanced logging for debugging user type issues
        console.log('User profile data:', {
          userId: user.id,
          email: user.email,
          profileUserType: profile?.user_type,
          metadataUserType: user.user_metadata?.user_type,
          laborEmail: user.email === 'labor@instabids.com'
        });
        
        // Fix common labor contractor type confusion
        if (correctUserType === 'labor-contractor' || correctUserType === 'labor_contractor' || user.email === 'labor@instabids.com') {
          console.log('Applying labor contractor fix for user:', user.email);
          correctUserType = 'labor-contractor'; // Ensure consistent hyphenated format
        }
        
        if (!correctUserType) {
          console.error("Could not determine user type - missing from both profile and metadata");
          setAuthError("Your account is missing a role. Please contact support.");
          setLoading(false);
          return;
        }
        
        console.log("User authenticated as type:", correctUserType);
        
        // Extract current dashboard path segment from URL
        const currentPath = pathname.split('/')[2]; // dashboard/[userType]/...
        
        // Define valid role paths with consistency
        const validUserTypes = ['homeowner', 'contractor', 'property-manager', 'labor-contractor', 'admin'];
        
        // Special case for /dashboard (no specific path)
        if (!currentPath) {
          console.log(`No specific dashboard path, redirecting to ${correctUserType}`);
          router.replace(`/dashboard/${correctUserType}`);
          setLoading(false);
          return;
        }
        
        // Skip redirection for the navigation page
        if (pathname === '/navigation') {
          console.log("On navigation page, not redirecting");
          setLoading(false);
          return;
        }
        
        // Admin can access all dashboards
        if (correctUserType === 'admin') {
          console.log("Admin user, allowing access to any dashboard");
          setLoading(false);
          return;
        }
        
        // Redirect if the user is on the wrong dashboard for their role
        if (currentPath !== correctUserType && validUserTypes.includes(currentPath)) {
          console.log(`User is ${correctUserType} but trying to access ${currentPath} dashboard`);
          console.log(`Redirecting to /dashboard/${correctUserType}`);
          router.replace(`/dashboard/${correctUserType}`);
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error loading user data:", err);
        if (isMounted) {
          setAuthError("An unexpected error occurred");
          setLoading(false);
        }
      }
    }
    
    loadUserData();
    
    return () => {
      isMounted = false;
    };
  }, [pathname, router]);

  // Handle sign out
  const handleSignOut = async () => {
    const { error } = await signOutUser();
    if (error) {
      console.error("Error signing out:", error);
    } else {
      router.push("/login");
    }
  };

  // Get appropriate navigation items based on user type
  const getNavItems = () => {
    const commonItems = [
      { name: "Dashboard", href: "/dashboard" },
      { name: "Navigation", href: "/navigation" },
    ];
    
    if (!user || !profile) return commonItems;
    
    const userType = profile?.user_type || user.user_metadata?.user_type;
    
    switch (userType) {
      case "homeowner":
        return [
          ...commonItems,
          { name: "My Projects", href: "/dashboard/homeowner/projects" },
          { name: "New Project", href: "/dashboard/homeowner/new-project" },
        ];
      case "contractor":
        return [
          ...commonItems,
          { name: "Available Jobs", href: "/dashboard/contractor/jobs" },
          { name: "My Bids", href: "/dashboard/contractor/bids" },
        ];
      case "labor-contractor":
        return [
          ...commonItems,
          { name: "Available Work", href: "/dashboard/labor-contractor/jobs" },
          { name: "My Teams", href: "/dashboard/labor-contractor/teams" },
        ];
      case "property-manager":
        return [
          ...commonItems,
          { name: "Properties", href: "/dashboard/property-manager/properties" },
          { name: "Projects", href: "/dashboard/property-manager/projects" },
        ];
      case "admin":
        return [
          ...commonItems,
          { name: "Users", href: "/dashboard/admin/users" },
          { name: "Projects", href: "/dashboard/admin/projects" },
          { name: "Agent Integration", href: "/admin" },
        ];
      default:
        return commonItems;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-md shadow-md w-full max-w-md">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
          <p className="text-center mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-md shadow-md w-full max-w-md">
          <div className="text-center">
            <h1 className="text-red-500 text-xl font-bold mb-4">Authentication Error</h1>
            <p className="text-gray-600 mb-6">{authError}</p>
            <Link 
              href="/login" 
              className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Left sidebar */}
      <div className="w-64 bg-gray-100 p-4 border-r">
        <div className="mb-6">
          <h1 className="text-xl font-bold">InstaBids</h1>
        </div>
        
        <div className="mb-4">
          <p className="text-sm uppercase font-semibold text-gray-500 mb-2">NAVIGATION</p>
          <ul className="space-y-1">
            {getNavItems().map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`block px-4 py-2 rounded-md ${
                    pathname === item.href
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'hover:bg-gray-200'
                  }`}
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="mt-auto">
          <p className="text-sm uppercase font-semibold text-gray-500 mb-2">ACCOUNT</p>
          <ul>
            <li>
              <Link
                href="/dashboard/profile"
                className="block px-4 py-2 rounded-md hover:bg-gray-200"
              >
                Profile Settings
              </Link>
            </li>
            <li>
              <button
                className="w-full text-left px-4 py-2 rounded-md hover:bg-gray-200"
                onClick={handleSignOut}
              >
                Sign Out
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 bg-white">
        {children}
      </div>
    </div>
  );
}
