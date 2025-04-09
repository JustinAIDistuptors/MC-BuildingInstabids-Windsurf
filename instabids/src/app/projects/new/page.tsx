'use client';

import React from 'react';
import { Toaster } from '@/components/ui/toaster';
import { BidCardForm } from '@/components/forms/bid-card';

// Import components with proper types
import type { BidCardFormSchemaType } from '@/components/forms/bid-card/BidCardForm';

export default function ProjectsNewPage() {
  const handleSubmit = async (data: BidCardFormSchemaType, mediaFiles: File[]) => {
    console.log('Form submitted:', data);
    console.log('Media files:', mediaFiles);
    
    // Simulate API request
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return Promise.resolve();
  };
  
  const handleSaveDraft = async (data: BidCardFormSchemaType, mediaFiles: File[]) => {
    console.log('Draft saved:', data);
    console.log('Media files:', mediaFiles);
    
    // Simulate API request
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return Promise.resolve();
  };
  
  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Create New Project</h1>
      <p className="text-gray-600 mb-8">
        Fill out the form below to create a new project bid card. This will help contractors understand your project and provide accurate bids.
      </p>
      
      <BidCardForm 
        onSubmit={handleSubmit}
        onSaveDraft={handleSaveDraft}
      />
      
      <Toaster />
    </div>
  );
}
