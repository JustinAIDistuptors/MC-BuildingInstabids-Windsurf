'use client';

import { useFormContext } from 'react-hook-form';
import { BidCardSchemaType } from '@/schemas/bidding.schema';

// UI Components
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type ProjectDetailsProps = {
  mediaFiles: File[];
  setMediaFiles: (files: File[]) => void;
};

export default function ProjectDetails({ mediaFiles, setMediaFiles }: ProjectDetailsProps) {
  const { control, formState: { errors } } = useFormContext<BidCardSchemaType>();
  
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-4">Project Details</h2>
        <p className="text-gray-600 mb-6">
          Now, let's get some details about your project to help contractors understand what you need.
        </p>
      </div>

      {/* Project Title */}
      <FormField
        control={control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-medium">Project Title</FormLabel>
            <FormDescription>
              Create a clear, descriptive title for your project
            </FormDescription>
            <FormControl>
              <Input
                placeholder="e.g., Kitchen Renovation in Colonial Home"
                {...field}
                className="w-full"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* Project Description */}
      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-medium">Project Description</FormLabel>
            <FormDescription>
              Provide a detailed description of what you want to accomplish
            </FormDescription>
            <FormControl>
              <Textarea
                placeholder="Describe your project in detail, including your goals, specific requirements, and any challenges or constraints..."
                {...field}
                className="min-h-[150px]"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* Special Requirements */}
      <FormField
        control={control}
        name="special_requirements"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-medium">Special Requirements (Optional)</FormLabel>
            <FormDescription>
              Include any special requirements or considerations for this project
            </FormDescription>
            <FormControl>
              <Textarea
                placeholder="E.g., Historic home with preservation requirements, specific materials needed, accessibility considerations, etc."
                {...field}
                className="min-h-[100px]"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* Guidance for Bidders */}
      <FormField
        control={control}
        name="guidance_for_bidders"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-medium">Guidance for Bidders (Optional)</FormLabel>
            <FormDescription>
              Provide specific instructions for contractors bidding on your project
            </FormDescription>
            <FormControl>
              <Textarea
                placeholder="E.g., Please include timeline estimates, information about your team size, examples of similar projects, etc."
                {...field}
                className="min-h-[100px]"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
