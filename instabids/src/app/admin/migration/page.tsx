'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MigrationTool from '@/components/admin/MigrationTool';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

/**
 * Admin Migration Page
 * 
 * This page provides access to the data migration tool for administrators.
 * It includes authentication checks to ensure only admins can access it.
 */
export default function MigrationPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  
  // Check if user is an admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        // Check localStorage for user role (this should be replaced with proper auth check)
        const userDataStr = localStorage.getItem('user_data');
        if (!userDataStr) {
          setIsAdmin(false);
          return;
        }
        
        const userData = JSON.parse(userDataStr);
        setIsAdmin(userData.role === 'admin');
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    };
    
    checkAdminStatus();
  }, []);
  
  // Handle navigation back to dashboard
  const handleBack = () => {
    router.push('/dashboard/admin');
  };
  
  // Show loading state while checking admin status
  if (isAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  // Show access denied if not admin
  if (isAdmin === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground mb-6">You do not have permission to access this page.</p>
        <Button onClick={handleBack}>Return to Dashboard</Button>
      </div>
    );
  }
  
  // Show migration tool for admins
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Database Migration</h1>
        <p className="text-muted-foreground mt-2">
          Migrate project data from localStorage to Supabase database
        </p>
      </div>
      
      <div className="bg-card rounded-lg border p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Important Information</h2>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>This tool will migrate all projects from localStorage to Supabase</li>
          <li>Existing data in localStorage will not be deleted</li>
          <li>After migration, the application will use Supabase for all operations</li>
          <li>This process cannot be automatically reversed</li>
        </ul>
      </div>
      
      <MigrationTool />
    </div>
  );
}
