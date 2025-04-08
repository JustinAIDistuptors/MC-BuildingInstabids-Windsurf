'use client';

import React from 'react';
import { BidCard } from '@/types/bidding';
import { 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface ProjectDetailsStepProps {
  data: BidCard;
  errors: Record<string, string>;
  onChange: (fieldName: string, value: any) => void;
}

/**
 * Step 2: Project Details
 * 
 * This step collects detailed information about the project:
 * - Project title
 * - Project description
 * - Custom questions based on project type (dynamic)
 * - Additional guidance for bidders
 */
export default function ProjectDetailsStep({
  data,
  errors,
  onChange
}: ProjectDetailsStepProps) {
  return (
    <div className="space-y-6 py-4">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Project Details</h2>
        <p className="text-muted-foreground">
          Tell us more about your project. The more detail you provide, the better contractors can understand your needs.
        </p>
      </div>

      {/* Project Title */}
      <div className="space-y-4">
        <FormItem className="space-y-1">
          <FormLabel className="text-base">Project Title</FormLabel>
          <FormDescription>A clear, concise title for your project</FormDescription>
          <Input
            value={data.title}
            onChange={(e) => onChange('title', e.target.value)}
            placeholder="e.g., Kitchen Renovation, Lawn Maintenance, Plumbing Repair"
            className={errors.title ? 'border-red-500' : ''}
          />
          {errors.title && <FormMessage>{errors.title}</FormMessage>}
        </FormItem>

        {/* Project Description */}
        <FormItem className="space-y-1">
          <FormLabel className="text-base">Project Description</FormLabel>
          <FormDescription>Provide a detailed description of what you need done</FormDescription>
          <Textarea
            value={data.description}
            onChange={(e) => onChange('description', e.target.value)}
            placeholder="Describe your project in detail. What specifically needs to be done? Are there any special requirements or challenges?"
            className={`min-h-[150px] ${errors.description ? 'border-red-500' : ''}`}
          />
          {errors.description && <FormMessage>{errors.description}</FormMessage>}
        </FormItem>

        {/* Guidance for Bidders */}
        <FormItem className="space-y-1">
          <FormLabel className="text-base">Guidance for Bidders (Optional)</FormLabel>
          <FormDescription>Any specific instructions for contractors who will bid on this project</FormDescription>
          <Textarea
            value={data.guidance_for_bidders || ''}
            onChange={(e) => onChange('guidance_for_bidders', e.target.value)}
            placeholder="E.g., Please include your experience with similar projects, estimated timeline, or any special certifications in your bid"
            className="min-h-[100px]"
          />
        </FormItem>
      </div>

      {/* Custom questions based on job type - these would dynamically load based on the selected job type */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Custom Project Information</h3>
          <p className="text-sm text-muted-foreground">
            These questions help us gather more specific information about your project type.
          </p>
        </div>

        {/* Example custom question fields - in a real implementation, these would be dynamically loaded based on job type */}
        <div className="bg-muted p-4 rounded-md">
          <p className="text-sm text-center">
            Custom questions for this project type will appear here
          </p>
        </div>
      </div>
    </div>
  );
}
