'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProjectDetailsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the full bid form
    router.replace('/dashboard/homeowner/new-project');
  }, [router]);
  
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Redirecting to Full Project Form...</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <p className="mb-4">You are being redirected to the complete project form.</p>
        
        <div className="mb-4">
          <a 
            href="/dashboard/homeowner/new-project" 
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded"
          >
            Click here if you are not redirected automatically
          </a>
        </div>
        
        <div className="flex justify-center mt-4">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      </div>
    </div>
  );
}
