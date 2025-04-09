'use client';

import React from 'react';
import { Toaster } from '@/components/ui/toaster';

export default function NewProjectPage() {
  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Create New Project</h1>
      <p className="text-gray-600 mb-8">
        This is a simplified test page to ensure routing works correctly.
      </p>
      
      <div className="bg-blue-100 p-6 rounded-lg">
        <h2 className="text-xl font-semibold">Test Component</h2>
        <p>If you can see this, the page is rendering correctly.</p>
      </div>
      
      <Toaster />
    </div>
  );
}
