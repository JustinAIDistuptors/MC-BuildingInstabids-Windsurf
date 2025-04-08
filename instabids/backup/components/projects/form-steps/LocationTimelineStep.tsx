'use client';

import React from 'react';
import { BidCard, MOCK_TIMELINE_HORIZONS } from '@/types/bidding';
import { 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';

interface LocationTimelineStepProps {
  data: BidCard;
  errors: Record<string, string>;
  onChange: (fieldName: string, value: any) => void;
}

/**
 * Step 3: Location & Timeline
 * 
 * This step collects location information and timeline preferences:
 * - Address and property details
 * - Timeline start/end dates
 * - Job start window
 * - Timeline horizon (urgency level)
 */
export default function LocationTimelineStep({
  data,
  errors,
  onChange
}: LocationTimelineStepProps) {
  // States for the location fields
  const US_STATES = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  // Handle address field changes
  const handleAddressChange = (field: string, value: string) => {
    onChange('location', {
      ...data.location,
      [field]: value
    });
  };

  return (
    <div className="space-y-6 py-4">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Location & Timeline</h2>
        <p className="text-muted-foreground">
          Where is your project located and when would you like it done?
        </p>
      </div>

      {/* Location Information */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Property Location</h3>
          <p className="text-sm text-muted-foreground">
            Enter the address where the work will be performed
          </p>
        </div>

        <div className="space-y-4">
          {/* Address Line 1 */}
          <FormItem className="space-y-1">
            <FormLabel>Street Address</FormLabel>
            <Input
              value={data.location.address_line1 || ''}
              onChange={(e) => handleAddressChange('address_line1', e.target.value)}
              placeholder="123 Main St"
              className={errors['location.address_line1'] ? 'border-red-500' : ''}
            />
            {errors['location.address_line1'] && <FormMessage>{errors['location.address_line1']}</FormMessage>}
          </FormItem>

          {/* Address Line 2 */}
          <FormItem className="space-y-1">
            <FormLabel>Apartment, Suite, etc. (Optional)</FormLabel>
            <Input
              value={data.location.address_line2 || ''}
              onChange={(e) => handleAddressChange('address_line2', e.target.value)}
              placeholder="Apt 4B"
            />
          </FormItem>

          {/* City, State, ZIP */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormItem className="space-y-1">
              <FormLabel>City</FormLabel>
              <Input
                value={data.location.city || ''}
                onChange={(e) => handleAddressChange('city', e.target.value)}
                placeholder="Boston"
                className={errors['location.city'] ? 'border-red-500' : ''}
              />
              {errors['location.city'] && <FormMessage>{errors['location.city']}</FormMessage>}
            </FormItem>

            <FormItem className="space-y-1">
              <FormLabel>State</FormLabel>
              <Select
                value={data.location.state || ''}
                onValueChange={(value) => handleAddressChange('state', value)}
              >
                <SelectTrigger className={errors['location.state'] ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors['location.state'] && <FormMessage>{errors['location.state']}</FormMessage>}
            </FormItem>

            <FormItem className="space-y-1">
              <FormLabel>ZIP Code</FormLabel>
              <Input
                value={data.zip_code || ''}
                onChange={(e) => onChange('zip_code', e.target.value)}
                placeholder="02108"
                className={errors.zip_code ? 'border-red-500' : ''}
              />
              {errors.zip_code && <FormMessage>{errors.zip_code}</FormMessage>}
            </FormItem>
          </div>
        </div>
      </div>

      {/* Timeline Information */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Project Timeline</h3>
          <p className="text-sm text-muted-foreground">
            When would you like the project to be started and completed?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Timeline Start Date */}
          <FormItem className="space-y-1">
            <FormLabel>Earliest Start Date</FormLabel>
            <div className={errors.timeline_start ? 'border rounded-md border-red-500' : ''}>
              <DatePicker
                date={data.timeline_start ? new Date(data.timeline_start) : undefined}
                setDate={(date) => onChange('timeline_start', date ? date.toISOString() : null)}
                placeholder="Select earliest start date"
              />
            </div>
            {errors.timeline_start && <FormMessage>{errors.timeline_start}</FormMessage>}
          </FormItem>

          {/* Timeline End Date */}
          <FormItem className="space-y-1">
            <FormLabel>Target Completion Date</FormLabel>
            <div className={errors.timeline_end ? 'border rounded-md border-red-500' : ''}>
              <DatePicker
                date={data.timeline_end ? new Date(data.timeline_end) : undefined}
                setDate={(date) => onChange('timeline_end', date ? date.toISOString() : null)}
                placeholder="Select target completion date"
              />
            </div>
            {errors.timeline_end && <FormMessage>{errors.timeline_end}</FormMessage>}
          </FormItem>
        </div>

        {/* Timeline Horizon */}
        <FormItem className="space-y-1">
          <FormLabel>How soon do you need this project done?</FormLabel>
          <Select
            value={data.timeline_horizon_id || ''}
            onValueChange={(value) => onChange('timeline_horizon_id', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select timeline priority" />
            </SelectTrigger>
            <SelectContent>
              {MOCK_TIMELINE_HORIZONS.map((horizon) => (
                <SelectItem key={horizon.id} value={horizon.id}>
                  {horizon.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormItem>
      </div>
    </div>
  );
}
