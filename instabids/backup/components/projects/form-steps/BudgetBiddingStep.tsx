'use client';

import React from 'react';
import { BidCard } from '@/types/bidding';
import { 
  FormDescription, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface BudgetBiddingStepProps {
  data: BidCard;
  errors: Record<string, string>;
  onChange: (fieldName: string, value: any) => void;
}

/**
 * Step 4: Budget & Bidding Parameters
 * 
 * This step collects budget information and bidding preferences:
 * - Budget range (min/max)
 * - Bid deadline
 * - Group bidding options
 * - Contractor communication settings
 * - Negotiation settings
 */
export default function BudgetBiddingStep({
  data,
  errors,
  onChange
}: BudgetBiddingStepProps) {
  // Format currency with dollar sign
  const formatCurrency = (value: number): string => {
    return `$${value.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`;
  };

  // Parse currency input (removes dollar sign and commas)
  const parseCurrency = (value: string): number => {
    return parseFloat(value.replace(/[$,]/g, '')) || 0;
  };

  // Handle budget change
  const handleBudgetChange = (field: 'budget_min' | 'budget_max', e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseCurrency(e.target.value);
    onChange(field, value);
  };

  return (
    <div className="space-y-6 py-4">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Budget & Bidding</h2>
        <p className="text-muted-foreground">
          Set your budget range and bidding preferences to get the best matches.
        </p>
      </div>

      {/* Budget Range Section */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Budget Range</h3>
          <p className="text-sm text-muted-foreground">
            Setting a realistic budget range helps contractors provide appropriate bids
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Minimum Budget */}
          <FormItem className="space-y-1">
            <FormLabel>Minimum Budget</FormLabel>
            <FormDescription>Lowest amount you're expecting to spend</FormDescription>
            <Input
              type="text"
              value={data.budget_min !== undefined ? formatCurrency(data.budget_min) : ''}
              onChange={(e) => handleBudgetChange('budget_min', e)}
              placeholder="$0"
              className={errors.budget_min ? 'border-red-500' : ''}
            />
            {errors.budget_min && <FormMessage>{errors.budget_min}</FormMessage>}
          </FormItem>

          {/* Maximum Budget */}
          <FormItem className="space-y-1">
            <FormLabel>Maximum Budget</FormLabel>
            <FormDescription>Highest amount you're willing to spend</FormDescription>
            <Input
              type="text"
              value={data.budget_max !== undefined ? formatCurrency(data.budget_max) : ''}
              onChange={(e) => handleBudgetChange('budget_max', e)}
              placeholder="$10,000"
              className={errors.budget_max ? 'border-red-500' : ''}
            />
            {errors.budget_max && <FormMessage>{errors.budget_max}</FormMessage>}
          </FormItem>
        </div>
      </div>

      {/* Bidding Preferences Section */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Bidding Preferences</h3>
          <p className="text-sm text-muted-foreground">
            Configure how contractors can bid on your project
          </p>
        </div>

        {/* Bid Deadline */}
        <FormItem className="space-y-1">
          <FormLabel>Bid Deadline</FormLabel>
          <FormDescription>Date by which contractors must submit bids</FormDescription>
          <div className={errors.bid_deadline ? 'border rounded-md border-red-500' : ''}>
            <DatePicker
              date={data.bid_deadline ? new Date(data.bid_deadline) : undefined}
              setDate={(date) => onChange('bid_deadline', date ? date.toISOString() : null)}
              placeholder="Select bid deadline"
            />
          </div>
          {errors.bid_deadline && <FormMessage>{errors.bid_deadline}</FormMessage>}
        </FormItem>

        {/* Allow Price Negotiations */}
        <div className="flex items-center justify-between space-x-2 rounded-md border p-4">
          <div className="space-y-0.5">
            <div className="flex items-center">
              <Label className="text-base">Allow Price Negotiations</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoCircledIcon className="ml-2 h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    When disabled, contractors must submit their best price first.
                    <br />
                    When enabled, you can negotiate with contractors after bids are received.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-sm text-muted-foreground">
              {data.prohibit_negotiation 
                ? "Contractors must submit their best price first (recommended)" 
                : "Allow contractors to negotiate prices after bid submission"}
            </p>
          </div>
          <Switch
            checked={!data.prohibit_negotiation}
            onCheckedChange={(checked) => onChange('prohibit_negotiation', !checked)}
          />
        </div>

        {/* Group Bidding */}
        <div className="flex items-center justify-between space-x-2 rounded-md border p-4">
          <div className="space-y-0.5">
            <div className="flex items-center">
              <Label className="text-base">Enable Group Bidding</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoCircledIcon className="ml-2 h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Group bidding allows contractors to collaborate and submit joint bids for your project.
                    <br />
                    This is useful for complex projects requiring multiple specialties.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-sm text-muted-foreground">
              {data.group_bidding_enabled 
                ? "Allow contractors to team up and submit group bids" 
                : "Only allow individual contractors to bid"}
            </p>
          </div>
          <Switch
            checked={!!data.group_bidding_enabled}
            onCheckedChange={(checked) => onChange('group_bidding_enabled', checked)}
          />
        </div>

        {/* Maximum Contractor Messages */}
        <FormItem className="space-y-3">
          <FormLabel>Maximum Contractor Messages</FormLabel>
          <FormDescription>
            Limit how many contractors can message you about this project
          </FormDescription>
          <div className="flex items-center space-x-4">
            <Slider
              value={[data.max_contractor_messages || 5]}
              min={1}
              max={20}
              step={1}
              onValueChange={(value) => onChange('max_contractor_messages', value[0])}
              className="flex-1"
            />
            <span className="w-12 text-center font-medium">
              {data.max_contractor_messages || 5}
            </span>
          </div>
        </FormItem>

        {/* Visibility */}
        <FormItem className="space-y-1">
          <FormLabel>Project Visibility</FormLabel>
          <FormDescription>Who can see and bid on your project</FormDescription>
          <Select
            value={data.visibility}
            onValueChange={(value: 'public' | 'private' | 'group') => onChange('visibility', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select visibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public - Any approved contractor can bid</SelectItem>
              <SelectItem value="private">Private - Only invited contractors can bid</SelectItem>
              <SelectItem value="group">Group - Available to specific contractor groups</SelectItem>
            </SelectContent>
          </Select>
        </FormItem>
      </div>
    </div>
  );
}
