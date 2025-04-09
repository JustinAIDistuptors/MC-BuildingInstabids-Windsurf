'use client';

import { useFormContext } from 'react-hook-form';
import { BidCardSchemaType } from '@/schemas/bidding.schema';
import { useState } from 'react';
import { JOB_CATEGORIES } from './ProjectClassification';

// UI Components
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type JobCategorySelectionProps = {
  mediaFiles: File[];
  setMediaFiles: (files: File[]) => void;
};

export default function JobCategorySelection({ mediaFiles, setMediaFiles }: JobCategorySelectionProps) {
  const { control, watch } = useFormContext<BidCardSchemaType>();
  const selectedJobType = watch('job_type_id');
  const [otherCategorySelected, setOtherCategorySelected] = useState(false);
  
  // Get categories based on project type
  const categories = selectedJobType ? JOB_CATEGORIES[selectedJobType as keyof typeof JOB_CATEGORIES] : [];
  
  // Split into visual bubbles (first 8) and dropdown options (rest)
  const visualCategories = categories.slice(0, 8);
  const dropdownCategories = categories.slice(8);
  
  // Get project type name for display
  const getProjectTypeName = () => {
    switch(selectedJobType) {
      case 'one-time': return 'Single Job';
      case 'continual': return 'Continual Service';
      case 'repair': return 'Repair Job';
      case 'labor': return 'Labor-Only Job';
      case 'kitchen': return 'Kitchen Remodel';
      default: return 'Project';
    }
  };
  
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-4">What type of {getProjectTypeName()} do you need?</h2>
        <p className="text-gray-600 mb-6">
          Select the specific job category that best describes your project.
        </p>
      </div>

      {/* Visual Category Selection */}
      <FormField
        control={control}
        name="job_category_id"
        render={({ field }) => (
          <FormItem className="space-y-6">
            <FormLabel className="text-base">Popular Options</FormLabel>
            <FormControl>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {visualCategories.map((category) => (
                  <Card 
                    key={category.id} 
                    className={`p-4 cursor-pointer transition-all border-2 ${
                      field.value === category.id ? 'ring-2 ring-blue-600 border-blue-300 bg-blue-50' : 'hover:shadow-md border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      field.onChange(category.id);
                      setOtherCategorySelected(false);
                    }}
                  >
                    <div className="flex flex-col items-center text-center space-y-2">
                      <span className="text-3xl">{category.image}</span>
                      <span className="font-medium text-sm">{category.label}</span>
                    </div>
                  </Card>
                ))}
              </div>
            </FormControl>
            
            {/* Dropdown for additional options */}
            {dropdownCategories.length > 0 && (
              <div className="mt-6">
                <FormLabel className="text-base">More Options</FormLabel>
                <Select
                  value={otherCategorySelected ? field.value : ""}
                  onValueChange={(value: string) => {
                    field.onChange(value);
                    setOtherCategorySelected(true);
                  }}
                >
                  <SelectTrigger className="w-full md:w-[300px]">
                    <SelectValue placeholder="Select another job category" />
                  </SelectTrigger>
                  <SelectContent>
                    {dropdownCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
