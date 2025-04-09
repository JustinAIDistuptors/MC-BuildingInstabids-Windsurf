'use client';

import React from 'react';
import { Toaster } from '@/components/ui/toaster';
import BidCardForm from '@/components/forms/bid-card/BidCardForm';
import { BidCardSchemaType } from '@/schemas/bidding.schema';

export default function NewProjectPage() {
  // Mock handlers for form submission and draft saving
  const handleSubmit = async (data: BidCardSchemaType, mediaFiles: File[]): Promise<void> => {
    console.log('Submitting project:', data);
    console.log('Media files:', mediaFiles);
    // This would normally call a server action
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const handleSaveDraft = async (data: BidCardSchemaType, mediaFiles: File[]): Promise<void> => {
    console.log('Saving draft:', data);
    console.log('Media files:', mediaFiles);
    // This would normally call a server action
    await new Promise(resolve => setTimeout(resolve, 1000));
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
