"use client";

import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/auth/auth-utils";

export default function PropertyManagerDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userType, setUserType] = useState("");

  useEffect(() => {
    async function loadUserInfo() {
      const { user, profile } = await getCurrentUser();
      
      if (profile) {
        setUserName(profile.full_name || "Property Manager");
        setUserType(profile.user_type || "Unknown");
      } else if (user) {
        setUserName(user.user_metadata?.full_name || "Property Manager");
        setUserType(user.user_metadata?.user_type || "Unknown");
      }
      
      setIsLoading(false);
    }
    
    loadUserInfo();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-green-600 px-6 py-4">
            <h1 className="text-white text-2xl font-bold">Property Manager Dashboard</h1>
          </div>
          
          {/* Content */}
          <div className="p-6">
            <div className="bg-green-50 rounded-lg p-4 mb-6 border border-green-100">
              <h2 className="text-lg font-medium text-green-800">Welcome, {userName}!</h2>
              <p className="text-green-600 mt-1">You are logged in as: {userType}</p>
            </div>
            
            <div className="space-y-6">
              <section>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Your Properties</h3>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-gray-500 text-center py-6">No properties added yet.</p>
                </div>
              </section>
              
              <section>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Active Renovation Projects</h3>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-gray-500 text-center py-6">No active projects found.</p>
                </div>
              </section>
              
              <section>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Recent Activity</h3>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="text-green-600 text-xs">✓</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">Account created</p>
                        <p className="text-xs text-gray-500">Just now</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
              
              <div className="flex justify-between">
                <a href="/navigation" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none">
                  Go to Navigation
                </a>
                <a href="/" className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none">
                  Back to Home
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
