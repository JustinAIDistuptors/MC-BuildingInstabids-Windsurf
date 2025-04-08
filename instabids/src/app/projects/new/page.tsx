'use client';

import { BidCardForm } from '@/components/forms/bid-card';
import { BidCardSchemaType } from '@/lib/validations/bid-card';

export default function NewProjectPage() {
  // Handle form submission
  const handleSubmit = async (data: BidCardSchemaType, mediaFiles: File[]) => {
    // In a real implementation, this would send the data to the server
    console.log('Form submitted:', data);
    console.log('Media files:', mediaFiles);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return Promise.resolve();
  };
  
  // Handle saving draft
  const handleSaveDraft = async (data: BidCardSchemaType, mediaFiles: File[]) => {
    // In a real implementation, this would save the draft to the server
    console.log('Draft saved:', data);
    console.log('Media files:', mediaFiles);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return Promise.resolve();
  };
  
  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create New Project</h1>
        <p className="text-muted-foreground">
          Fill out the form below to create a new project and receive bids from contractors.
        </p>
      </div>
      
      <BidCardForm 
        onSubmit={handleSubmit}
        onSaveDraft={handleSaveDraft}
      />
    </div>
  );
}
