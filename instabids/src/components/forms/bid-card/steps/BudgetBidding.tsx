'use client';

import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Control } from 'react-hook-form';
import { useState } from 'react';

// Simple job size options
const PROJECT_SIZE_OPTIONS = [
  { value: 'small', label: 'Small Project', description: 'Quick jobs that take a few hours to complete' },
  { value: 'medium', label: 'Medium Project', description: 'Projects that take a few days to complete' },
  { value: 'large', label: 'Large Project', description: 'Projects that take weeks to complete' },
  { value: 'extra_large', label: 'Extra Large Project', description: 'Major renovations that take months to complete' }
];

type BudgetBiddingProps = {
  control: Control<any>;
};

export default function BudgetBidding({ control }: BudgetBiddingProps) {
  // Local state to ensure immediate UI feedback
  const [selectedSize, setSelectedSize] = useState<string>('medium');

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-4">Project Size & Group Bidding</h2>
        <p className="text-gray-600 mb-6">
          Help contractors understand your project scope and explore group bidding options.
        </p>
      </div>

      {/* Project Size Section */}
      <div className="space-y-6">
        <h3 className="text-lg font-medium">Project Size</h3>
        <FormField
          control={control}
          name="job_size"
          render={({ field }) => (
            <FormItem className="space-y-4">
              <FormControl>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {PROJECT_SIZE_OPTIONS.map((option) => {
                    const isSelected = field.value === option.value || selectedSize === option.value;
                    
                    return (
                      <div 
                        key={option.value}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          field.onChange(option.value);
                          setSelectedSize(option.value);
                        }}
                        className={`p-4 cursor-pointer transition-all h-full rounded-lg border-2 ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50 shadow-md' 
                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex items-center h-5 mt-1">
                            <input
                              type="radio"
                              id={`size-${option.value}`}
                              name="job_size"
                              value={option.value}
                              checked={isSelected}
                              onChange={() => {
                                field.onChange(option.value);
                                setSelectedSize(option.value);
                              }}
                              className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                          </div>
                          <div className="flex-1">
                            <label 
                              htmlFor={`size-${option.value}`}
                              className="text-base font-medium cursor-pointer block mb-1"
                            >
                              {option.label}
                            </label>
                            <p className="text-sm text-gray-500">{option.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      {/* Group Bidding Section */}
      <div className="space-y-6 mt-8">
        <h3 className="text-lg font-medium">Group Bidding</h3>
        
        {/* Group Bidding Toggle with Enhanced UI */}
        <FormField
          control={control}
          name="group_bidding_enabled"
          render={({ field }) => (
            <FormItem className="rounded-lg border p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex flex-col space-y-4">
                <div className="flex flex-row items-center justify-between">
                  <div>
                    <FormLabel className="text-lg font-semibold text-blue-800">Enable Group Bidding</FormLabel>
                    <FormDescription className="text-blue-700">
                      Get better rates when multiple neighbors join together
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value !== undefined ? field.value : false}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-blue-600"
                    />
                  </FormControl>
                </div>
                
                <div className="bg-white rounded-lg border border-blue-200 p-5 mt-3">
                  <div className="flex">
                    <div className="ml-4">
                      <h4 className="text-base font-medium text-blue-800">How Group Bidding Works</h4>
                      <ul className="mt-2 space-y-3 text-sm text-gray-700">
                        <li>
                          <span><strong>Save 15-30%</strong> when multiple neighbors join your project</span>
                        </li>
                        <li>
                          <span>Perfect for <strong>lawn care, snow removal, painting, and more</strong></span>
                        </li>
                        <li>
                          <span>Contractors save on travel time and can purchase materials in bulk</span>
                        </li>
                        <li>
                          <span>We'll notify neighbors in your area who might be interested</span>
                        </li>
                      </ul>
                      
                      <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-100">
                        <p className="text-sm text-blue-800">
                          <strong>Example:</strong> A lawn service could offer a 20% discount if 3-5 houses on the same street sign up together, saving everyone money while the contractor still benefits from efficiency.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
