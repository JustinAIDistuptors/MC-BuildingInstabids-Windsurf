'use client';

import { useFormContext } from 'react-hook-form';
import { BidCardSchemaType } from '@/schemas/bidding.schema';

// UI Components
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { format, addDays } from 'date-fns';
import { useState } from 'react';

// Sample timeline options - replace with API data in production
const TIMELINE_HORIZONS = [
  { id: 'asap', label: 'As Soon As Possible' },
  { id: '2-weeks', label: 'Within 2 Weeks' },
  { id: '1-month', label: 'Within 1 Month' },
  { id: '3-months', label: 'Within 3 Months' },
  { id: 'custom', label: 'Custom Timeline' },
];

// Sample state options
const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  // Add more states as needed
  { value: 'NY', label: 'New York' },
  { value: 'TX', label: 'Texas' },
  { value: 'FL', label: 'Florida' },
  { value: 'IL', label: 'Illinois' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'OH', label: 'Ohio' },
  { value: 'GA', label: 'Georgia' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'MI', label: 'Michigan' },
];

type LocationTimelineProps = {
  mediaFiles: File[];
  setMediaFiles: (files: File[]) => void;
};

export default function LocationTimeline({ mediaFiles, setMediaFiles }: LocationTimelineProps) {
  const { control, watch, setValue } = useFormContext<BidCardSchemaType>();
  
  // Watch values to conditionally render fields
  const timelineHorizon = watch('timeline_horizon_id');
  const zipCode = watch('zip_code');
  
  // Handle ZIP code change to auto-fill location.zip_code
  const handleZipChange = (value: string) => {
    setValue('zip_code', value);
    setValue('location.zip_code', value);
  };
  
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-4">Location & Timeline</h2>
        <p className="text-gray-600 mb-6">
          Let's get your project location and timeline details.
        </p>
      </div>

      {/* Project Location Section */}
      <div className="space-y-6">
        <h3 className="text-lg font-medium">Project Location</h3>
        
        {/* Address Line 1 */}
        <FormField
          control={control}
          name="location.address_line1"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Street Address</FormLabel>
              <FormControl>
                <Input 
                  placeholder="123 Main St" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Address Line 2 */}
        <FormField
          control={control}
          name="location.address_line2"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Apt, Suite, Unit (Optional)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Apt #123" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* City and State */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="location.city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Anytown" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={control}
            name="location.state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <FormControl>
                  <select
                    className="w-full h-10 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    {...field}
                  >
                    <option value="">Select State</option>
                    {US_STATES.map((state) => (
                      <option key={state.value} value={state.value}>
                        {state.label}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* ZIP Code */}
        <FormField
          control={control}
          name="zip_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ZIP Code</FormLabel>
              <FormControl>
                <Input 
                  placeholder="12345" 
                  {...field} 
                  onChange={(e) => handleZipChange(e.target.value)}
                  className="max-w-[200px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <Separator />
      
      {/* Project Timeline Section */}
      <div className="space-y-6">
        <h3 className="text-lg font-medium">Project Timeline</h3>
        
        {/* Timeline Horizon */}
        <FormField
          control={control}
          name="timeline_horizon_id"
          render={({ field }) => (
            <FormItem className="space-y-4">
              <FormLabel className="text-base">When would you like this project to start?</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="space-y-3"
                >
                  {TIMELINE_HORIZONS.map((timeline) => (
                    <div 
                      key={timeline.id} 
                      className={`border rounded-md p-3 cursor-pointer transition-all ${
                        field.value === timeline.id ? 'border-blue-600 bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => field.onChange(timeline.id)}
                    >
                      <RadioGroupItem 
                        value={timeline.id} 
                        id={`timeline-${timeline.id}`} 
                        className="sr-only" 
                      />
                      <Label 
                        htmlFor={`timeline-${timeline.id}`}
                        className="cursor-pointer block"
                      >
                        {timeline.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Custom Timeline (conditional) */}
        {timelineHorizon === 'custom' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Timeline Start */}
            <FormField
              control={control}
              name="timeline_start"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Project Start Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={`w-full pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                        >
                          {field.value ? (
                            format(new Date(field.value), "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => field.onChange(date ? date.toISOString() : undefined)}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Timeline End */}
            <FormField
              control={control}
              name="timeline_end"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Project End Date (Estimated)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={`w-full pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                        >
                          {field.value ? (
                            format(new Date(field.value), "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => field.onChange(date ? date.toISOString() : undefined)}
                        disabled={(date) => {
                          const start = watch('timeline_start');
                          return date < (start ? new Date(start) : new Date());
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
        
        {/* Bid Deadline */}
        <FormField
          control={control}
          name="bid_deadline"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Bid Deadline (Optional)</FormLabel>
              <FormDescription>
                Set a deadline for when contractors can submit bids
              </FormDescription>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={`w-full md:w-[240px] pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                    >
                      {field.value ? (
                        format(new Date(field.value), "PPP")
                      ) : (
                        <span>Set a deadline</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={(date) => field.onChange(date ? date.toISOString() : undefined)}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
