'use client';

import { useFormContext } from 'react-hook-form';
import { BidCardSchemaType, validateBudgetRange } from '@/schemas/bidding.schema';
import { useState, useEffect } from 'react';

// UI Components
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

// Visibility options
const VISIBILITY_OPTIONS = [
  { 
    value: 'public', 
    label: 'Public', 
    description: 'Any qualified contractor can see your project and submit a bid' 
  },
  { 
    value: 'private', 
    label: 'Private', 
    description: 'Only invited contractors can see your project and submit bids' 
  },
  { 
    value: 'group', 
    label: 'Specific Groups', 
    description: 'Only contractors in selected groups can see and bid on your project' 
  },
];

type BudgetBiddingProps = {
  mediaFiles: File[];
  setMediaFiles: (files: File[]) => void;
};

export default function BudgetBidding({ mediaFiles, setMediaFiles }: BudgetBiddingProps) {
  const { control, watch, setValue, formState: { errors }, trigger } = useFormContext<BidCardSchemaType>();
  
  // Watch values to handle custom validation
  const budgetMin = watch('budget_min');
  const budgetMax = watch('budget_max');
  const groupBidding = watch('group_bidding_enabled');
  const visibility = watch('visibility');
  
  // Initialize slider value with budget range or defaults
  const [sliderValues, setSliderValues] = useState<number[]>([
    budgetMin || 1000, 
    budgetMax || 10000
  ]);
  
  // Custom budget range validation
  useEffect(() => {
    const validateBudget = async () => {
      if (budgetMin && budgetMax) {
        const customErrors = validateBudgetRange({ budget_min: budgetMin, budget_max: budgetMax });
        
        if (Object.keys(customErrors).length > 0) {
          // We have validation errors - handle them
          for (const [field, error] of Object.entries(customErrors)) {
            // We need to manually set error state here
            // In a real app, you might integrate this with react-hook-form setError
            console.error(`${field}: ${error}`);
          }
        } else {
          // Revalidate fields to clear errors
          await trigger(['budget_min', 'budget_max']);
        }
      }
    };
    
    validateBudget();
  }, [budgetMin, budgetMax, trigger]);
  
  // Update form values when slider changes
  const handleSliderChange = (values: number[]) => {
    setSliderValues(values);
    setValue('budget_min', values[0]);
    setValue('budget_max', values[1]);
    trigger(['budget_min', 'budget_max']);
  };
  
  // Update slider when inputs change
  const handleInputChange = (field: 'budget_min' | 'budget_max', value: number) => {
    setValue(field, value);
    
    if (field === 'budget_min') {
      setSliderValues([value, sliderValues[1]]);
    } else {
      setSliderValues([sliderValues[0], value]);
    }
    
    trigger(['budget_min', 'budget_max']);
  };
  
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-4">Budget & Bidding Preferences</h2>
        <p className="text-gray-600 mb-6">
          Set your budget range and preferences for how contractors can bid on your project.
        </p>
      </div>

      {/* Budget Section */}
      <div className="space-y-6">
        <h3 className="text-lg font-medium">Project Budget</h3>
        
        {/* Budget Range Slider */}
        <div className="pt-6 pb-2">
          <FormItem>
            <FormLabel className="text-base">Budget Range</FormLabel>
            <FormDescription>
              Move the sliders to set your minimum and maximum budget for this project.
            </FormDescription>
            <div className="pt-4">
              <Slider
                defaultValue={sliderValues}
                min={500}
                max={100000}
                step={500}
                value={sliderValues}
                onValueChange={handleSliderChange}
                className="mb-6"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">$500</span>
              <span className="text-sm font-medium">${sliderValues[0]} - ${sliderValues[1]}</span>
              <span className="text-sm text-gray-500">$100,000+</span>
            </div>
          </FormItem>
        </div>
        
        {/* Min and Max Budget Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={control}
            name="budget_min"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum Budget ($)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={500}
                    value={field.value || ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      field.onChange(value);
                      handleInputChange('budget_min', value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={control}
            name="budget_max"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum Budget ($)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={500}
                    value={field.value || ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      field.onChange(value);
                      handleInputChange('budget_max', value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
      
      <Separator />
      
      {/* Bidding Preferences Section */}
      <div className="space-y-6">
        <h3 className="text-lg font-medium">Bidding Preferences</h3>
        
        {/* Project Visibility */}
        <FormField
          control={control}
          name="visibility"
          render={({ field }) => (
            <FormItem className="space-y-4">
              <FormLabel className="text-base">Project Visibility</FormLabel>
              <FormDescription>
                Control who can see and bid on your project
              </FormDescription>
              <FormControl>
                <RadioGroup
                  onValueChange={(value) => field.onChange(value)}
                  value={field.value}
                  className="space-y-3"
                >
                  {VISIBILITY_OPTIONS.map((option) => (
                    <Card 
                      key={option.value} 
                      className={`p-4 cursor-pointer transition-all ${
                        field.value === option.value ? 'ring-2 ring-blue-600 bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => field.onChange(option.value)}
                    >
                      <div className="flex items-start">
                        <RadioGroupItem 
                          value={option.value} 
                          id={`visibility-${option.value}`} 
                          className="sr-only" 
                        />
                        <div>
                          <Label 
                            htmlFor={`visibility-${option.value}`}
                            className="text-base font-medium cursor-pointer block mb-1"
                          >
                            {option.label}
                          </Label>
                          <p className="text-sm text-gray-500">{option.description}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Group Bidding */}
        <FormField
          control={control}
          name="group_bidding_enabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Allow Group Bidding</FormLabel>
                <FormDescription>
                  Enable contractors to form groups and submit joint bids
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        {/* Prohibit Negotiation (Optional) */}
        <FormField
          control={control}
          name="prohibit_negotiation"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Prohibit Negotiation</FormLabel>
                <FormDescription>
                  Only accept bids at your exact specified budget, no negotiations
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value || false}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        {/* Max Contractor Messages (Optional) */}
        <FormField
          control={control}
          name="max_contractor_messages"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Maximum Contractor Messages (Optional)</FormLabel>
              <FormDescription>
                Limit the number of messages contractors can send before bidding
              </FormDescription>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  max={20}
                  value={field.value || ''}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                  placeholder="No limit"
                  className="max-w-[200px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
