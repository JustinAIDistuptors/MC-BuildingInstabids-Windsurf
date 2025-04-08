'use client';

import React, { useState, useEffect } from 'react';
import { 
  BidCard, 
  MOCK_JOB_CATEGORIES, 
  MOCK_JOB_TYPES, 
  MOCK_INTENTION_TYPES,
  JobSize
} from '@/types/bidding';
import { 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

interface ProjectClassificationStepProps {
  data: BidCard;
  errors: Record<string, string>;
  onChange: (field: string, value: string | number | JobSize) => void;
}

/**
 * Step 1: Project Classification
 * 
 * This step allows users to classify their project by:
 * - Job category (e.g., Home Improvement)
 * - Job type (e.g., Kitchen Remodeling)
 * - Intention type (One-time, Ongoing, Repair, Labor)
 * - Job size (Small, Medium, Large, X-Large)
 */
export default function ProjectClassificationStep({
  data,
  errors,
  onChange
}: ProjectClassificationStepProps) {
  const [filteredJobTypes, setFilteredJobTypes] = useState(MOCK_JOB_TYPES);
  
  // Filter job types when job category changes
  useEffect(() => {
    if (data.job_category_id) {
      setFilteredJobTypes(
        MOCK_JOB_TYPES.filter(jobType => jobType.category_id === data.job_category_id)
      );
      
      // Reset job type if the selected one doesn't belong to the new category
      const currentJobTypeStillValid = MOCK_JOB_TYPES.some(
        jobType => jobType.id === data.job_type_id && jobType.category_id === data.job_category_id
      );
      
      if (!currentJobTypeStillValid) {
        onChange('job_type_id', '');
      }
    } else {
      setFilteredJobTypes([]);
    }
  }, [data.job_category_id]);

  return (
    <div className="space-y-6 py-4">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Project Classification</h2>
        <p className="text-muted-foreground">
          Let's start by understanding what kind of project you're looking to get help with.
        </p>
      </div>

      {/* Job Category Selection */}
      <div className="space-y-4">
        <FormItem className="space-y-1">
          <FormLabel className="text-base">Job Category</FormLabel>
          <FormDescription>Select the general category for your project</FormDescription>
          <Select
            value={data.job_category_id}
            onValueChange={(value: string) => onChange('job_category_id', value)}
          >
            <SelectTrigger className={errors.job_category_id ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {MOCK_JOB_CATEGORIES.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.job_category_id && <FormMessage>{errors.job_category_id}</FormMessage>}
        </FormItem>

        {/* Job Type Selection */}
        <FormItem className="space-y-1">
          <FormLabel className="text-base">Job Type</FormLabel>
          <FormDescription>Select the specific type of work needed</FormDescription>
          <Select
            value={data.job_type_id}
            onValueChange={(value: string) => onChange('job_type_id', value)}
            disabled={!data.job_category_id}
          >
            <SelectTrigger className={errors.job_type_id ? 'border-red-500' : ''}>
              <SelectValue placeholder={data.job_category_id ? "Select a job type" : "Select a category first"} />
            </SelectTrigger>
            <SelectContent>
              {filteredJobTypes.map((jobType) => (
                <SelectItem key={jobType.id} value={jobType.id}>
                  {jobType.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.job_type_id && <FormMessage>{errors.job_type_id}</FormMessage>}
        </FormItem>
      </div>

      {/* Project Intention Type */}
      <div className="space-y-4">
        <FormItem className="space-y-1">
          <FormLabel className="text-base">Project Type</FormLabel>
          <FormDescription>What kind of project is this?</FormDescription>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {MOCK_INTENTION_TYPES.map((intentionType) => (
              <Card 
                key={intentionType.id}
                className={`cursor-pointer transition-colors hover:bg-muted ${
                  data.intention_type_id === intentionType.id ? 'border-2 border-primary' : ''
                }`}
                onClick={() => onChange('intention_type_id', intentionType.id)}
              >
                <CardContent className="p-4">
                  <h3 className="font-medium">{intentionType.display_name}</h3>
                  <p className="text-sm text-muted-foreground">{intentionType.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {errors.intention_type_id && <FormMessage>{errors.intention_type_id}</FormMessage>}
        </FormItem>
      </div>

      {/* Job Size Selection */}
      <div className="space-y-4">
        <FormItem className="space-y-1">
          <FormLabel className="text-base">Job Size</FormLabel>
          <FormDescription>How extensive is this project?</FormDescription>
          
          <RadioGroup
            value={data.job_size}
            onValueChange={(value: JobSize) => onChange('job_size', value)}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2"
          >
            <div className={`flex items-center space-x-2 rounded-md border p-3 ${data.job_size === JobSize.Small ? 'border-primary bg-muted' : ''}`}>
              <RadioGroupItem value={JobSize.Small} id="size-small" />
              <Label htmlFor="size-small" className="cursor-pointer flex-1">Small</Label>
            </div>
            
            <div className={`flex items-center space-x-2 rounded-md border p-3 ${data.job_size === JobSize.Medium ? 'border-primary bg-muted' : ''}`}>
              <RadioGroupItem value={JobSize.Medium} id="size-medium" />
              <Label htmlFor="size-medium" className="cursor-pointer flex-1">Medium</Label>
            </div>
            
            <div className={`flex items-center space-x-2 rounded-md border p-3 ${data.job_size === JobSize.Large ? 'border-primary bg-muted' : ''}`}>
              <RadioGroupItem value={JobSize.Large} id="size-large" />
              <Label htmlFor="size-large" className="cursor-pointer flex-1">Large</Label>
            </div>
            
            <div className={`flex items-center space-x-2 rounded-md border p-3 ${data.job_size === JobSize.ExtraLarge ? 'border-primary bg-muted' : ''}`}>
              <RadioGroupItem value={JobSize.ExtraLarge} id="size-xlarge" />
              <Label htmlFor="size-xlarge" className="cursor-pointer flex-1">X-Large</Label>
            </div>
          </RadioGroup>
          
          {errors.job_size && <FormMessage>{errors.job_size}</FormMessage>}
        </FormItem>
      </div>
    </div>
  );
}
