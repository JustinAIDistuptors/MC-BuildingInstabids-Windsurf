'use client';

import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// UI components
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

// Define a minimal schema for initial testing
const simpleBidCardSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').optional(),
});

type SimpleBidCardSchema = z.infer<typeof simpleBidCardSchema>;

// Simple props interface
export interface SimpleBidCardFormProps {
  onSubmit?: (data: SimpleBidCardSchema) => Promise<void>;
  onSaveDraft?: (data: SimpleBidCardSchema) => Promise<void>;
}

export default function SimpleBidCardForm({ onSubmit, onSaveDraft }: SimpleBidCardFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize form with React Hook Form and Zod validation
  const methods = useForm<SimpleBidCardSchema>({
    resolver: zodResolver(simpleBidCardSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });
  
  const { handleSubmit, register, formState: { errors } } = methods;
  
  // Handle form submission
  const handleFormSubmit = async (data: SimpleBidCardSchema) => {
    try {
      setIsSubmitting(true);
      
      if (onSubmit) {
        await onSubmit(data);
      } else {
        // Default implementation
        console.log('Submitted data:', data);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      toast({
        title: 'Success',
        description: 'Form submitted successfully!',
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit form. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle save as draft
  const handleSaveDraft = async () => {
    try {
      const data = methods.getValues();
      
      if (onSaveDraft) {
        await onSaveDraft(data);
      } else {
        // Default implementation
        console.log('Draft saved:', data);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      toast({
        title: 'Draft Saved',
        description: 'Your form has been saved as a draft.',
      });
    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: 'Error',
        description: 'Failed to save draft. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Project Title
            </label>
            <input
              id="title"
              {...register('title')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter project title"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Project Description
            </label>
            <textarea
              id="description"
              {...register('description')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              rows={4}
              placeholder="Enter project description"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>
        </div>
        
        <div className="flex justify-between pt-4">
          <Button
            type="button"
            onClick={handleSaveDraft}
            variant="outline"
            className="border-2 border-gray-300"
          >
            Save as Draft
          </Button>
          
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Project'}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
