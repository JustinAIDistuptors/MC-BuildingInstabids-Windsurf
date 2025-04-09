'use client';

import { useFormContext } from 'react-hook-form';
import { BidCardSchemaType } from '@/schemas/bidding.schema';
import { useState } from 'react';

// UI Components
import { FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form';
import { Card } from '@/components/ui/card';

// Project types with examples and images
const PROJECT_TYPES = [
  {
    id: 'one-time',
    label: 'Single Jobs',
    description: 'One-time projects with a clear beginning and end',
    examples: ['Roof Replacement', 'Kitchen Remodel', 'Deck Installation'],
    image: '🏠',
    color: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  {
    id: 'continual',
    label: 'Continual Services',
    description: 'Ongoing maintenance and care for your property',
    examples: ['Lawn Care', 'Pool Cleaning', 'House Cleaning'],
    image: '🔄',
    color: 'bg-green-100 text-green-800 border-green-200'
  },
  {
    id: 'repair',
    label: 'Repair & Handyman',
    description: 'Fix what needs fixing around your home',
    examples: ['Plumbing Repairs', 'Roof Repair', 'Electrical Work'],
    image: '🔧',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  },
  {
    id: 'labor',
    label: 'Labor Only',
    description: 'You provide materials, we provide the work',
    examples: ['Furniture Assembly', 'TV Mounting', 'Moving Help'],
    image: '👷',
    color: 'bg-purple-100 text-purple-800 border-purple-200'
  },
  {
    id: 'kitchen',
    label: 'Kitchen Remodel',
    description: 'Transform your kitchen into something special',
    examples: ['Full Remodel', 'Cabinet Replacement', 'Countertop Update'],
    image: '🍳',
    color: 'bg-orange-100 text-orange-800 border-orange-200'
  },
  {
    id: 'ai-gc',
    label: 'AI GC',
    description: 'AI-powered General Contractor services',
    examples: ['Coming Soon'],
    image: '🤖',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    disabled: true
  }
];

// Job category data
export const JOB_CATEGORIES = {
  'one-time': [
    // Most common 8 for visual bubbles
    { id: 'roof-replacement', label: 'Roof Replacement', image: '🏠' },
    { id: 'kitchen-remodel', label: 'Kitchen Remodeling', image: '🍳' },
    { id: 'bathroom-reno', label: 'Bathroom Renovation', image: '🚿' },
    { id: 'deck-patio', label: 'Deck/Patio Installation', image: '🏞️' },
    { id: 'fence', label: 'Fence Installation', image: '🧱' },
    { id: 'painting', label: 'Interior/Exterior Painting', image: '🎨' },
    { id: 'flooring', label: 'Flooring Installation', image: '🪵' },
    { id: 'windows', label: 'Window Replacement', image: '🪟' },
    // Additional options for dropdown
    { id: 'siding', label: 'Siding Installation' },
    { id: 'basement', label: 'Basement Finishing' },
    { id: 'attic', label: 'Attic Conversion' },
    { id: 'addition', label: 'Home Addition' },
    { id: 'pool', label: 'Swimming Pool Installation' },
    { id: 'hvac', label: 'HVAC System Installation' },
    { id: 'solar', label: 'Solar Panel Installation' },
    { id: 'landscaping', label: 'Landscape Design/Installation' },
    { id: 'concrete', label: 'Concrete Work' },
    { id: 'driveway', label: 'Driveway Paving/Resurfacing' }
  ],
  'continual': [
    // Most common 8 for visual bubbles
    { id: 'lawn-care', label: 'Lawn Mowing/Maintenance', image: '🌱' },
    { id: 'pool-cleaning', label: 'Pool Cleaning/Maintenance', image: '🏊' },
    { id: 'house-cleaning', label: 'Housekeeping/Cleaning', image: '🧹' },
    { id: 'pest-control', label: 'Pest Control', image: '🐜' },
    { id: 'hvac-maintenance', label: 'HVAC Maintenance', image: '❄️' },
    { id: 'gutter-cleaning', label: 'Gutter Cleaning', image: '🏡' },
    { id: 'window-cleaning', label: 'Window Cleaning', image: '🪟' },
    { id: 'snow-removal', label: 'Snow Removal', image: '❄️' },
    // Additional options for dropdown
    { id: 'landscape-maint', label: 'Landscape Maintenance' },
    { id: 'pressure-washing', label: 'Pressure Washing' },
    { id: 'chimney-sweep', label: 'Chimney Sweeping' },
    { id: 'septic-maint', label: 'Septic Tank Maintenance' },
    { id: 'carpet-cleaning', label: 'Carpet Cleaning' },
    { id: 'security-monitor', label: 'Home Security Monitoring' },
    { id: 'furnace-tuneup', label: 'Furnace/AC Tune-up' },
    { id: 'dryer-vent', label: 'Dryer Vent Cleaning' }
  ],
  'repair': [
    // Most common 8 for visual bubbles
    { id: 'roof-repair', label: 'Roof Repair', image: '🏠' },
    { id: 'plumbing-repair', label: 'Plumbing Repairs', image: '🚿' },
    { id: 'electrical-repair', label: 'Electrical Repairs', image: '⚡' },
    { id: 'hvac-repair', label: 'HVAC Repairs', image: '❄️' },
    { id: 'appliance-repair', label: 'Appliance Repairs', image: '🔌' },
    { id: 'drywall-repair', label: 'Drywall Repair', image: '🧱' },
    { id: 'deck-repair', label: 'Deck/Fence Repair', image: '🏞️' },
    { id: 'flooring-repair', label: 'Flooring Repair', image: '🪵' },
    // Additional options for dropdown
    { id: 'window-repair', label: 'Window Repair' },
    { id: 'door-repair', label: 'Door Repair' },
    { id: 'gutter-repair', label: 'Gutter Repair' },
    { id: 'foundation-repair', label: 'Foundation Repair' },
    { id: 'chimney-repair', label: 'Chimney Repair' },
    { id: 'siding-repair', label: 'Siding Repair' },
    { id: 'ceiling-repair', label: 'Ceiling Repair' },
    { id: 'pool-repair', label: 'Pool Equipment Repairs' },
    { id: 'toilet-repair', label: 'Toilet Repairs' },
    { id: 'sink-repair', label: 'Sink/Faucet Repairs' }
  ],
  'labor': [
    // Most common 8 for visual bubbles
    { id: 'furniture-assembly', label: 'Furniture Assembly', image: '🪑' },
    { id: 'tv-mounting', label: 'TV Mounting', image: '📺' },
    { id: 'curtain-install', label: 'Curtain/Blind Installation', image: '🪟' },
    { id: 'light-install', label: 'Light Fixture Installation', image: '💡' },
    { id: 'moving', label: 'Moving Assistance', image: '📦' },
    { id: 'shelving', label: 'Shelving Installation', image: '📚' },
    { id: 'smart-home', label: 'Smart Home Device Installation', image: '🏠' },
    { id: 'holiday-decor', label: 'Holiday Decoration Installation', image: '🎄' },
    // Additional options for dropdown
    { id: 'ceiling-fan', label: 'Ceiling Fan Installation' },
    { id: 'art-hanging', label: 'Art/Picture Hanging' },
    { id: 'closet-org', label: 'Closet Organization' },
    { id: 'garage-org', label: 'Garage Organization' },
    { id: 'shed-assembly', label: 'Shed Assembly' },
    { id: 'grill-assembly', label: 'BBQ/Grill Assembly' },
    { id: 'cabinet-install', label: 'Cabinet Installation' },
    { id: 'doorbell-camera', label: 'Doorbell Camera Installation' },
    { id: 'mirror-hanging', label: 'Mirror Hanging' }
  ],
  'kitchen': [
    // Most common 8 for visual bubbles
    { id: 'full-kitchen', label: 'Full Kitchen Remodel', image: '🍳' },
    { id: 'cabinets', label: 'Cabinet Replacement', image: '🪑' },
    { id: 'countertops', label: 'Countertop Installation', image: '🧱' },
    { id: 'backsplash', label: 'Backsplash Installation', image: '🧩' },
    { id: 'kitchen-island', label: 'Kitchen Island Addition', image: '🏝️' },
    { id: 'appliance-install', label: 'Appliance Installation', image: '🍽️' },
    { id: 'kitchen-flooring', label: 'Kitchen Flooring', image: '🪵' },
    { id: 'kitchen-lighting', label: 'Kitchen Lighting', image: '💡' },
    // Additional options for dropdown
    { id: 'sink-faucet', label: 'Sink & Faucet Replacement' },
    { id: 'pantry', label: 'Pantry Organization/Installation' },
    { id: 'open-concept', label: 'Open Concept Conversion' },
    { id: 'kitchen-paint', label: 'Kitchen Painting' }
  ]
};

type ProjectClassificationProps = {
  mediaFiles: File[];
  setMediaFiles: (files: File[]) => void;
};

export default function ProjectClassification({ mediaFiles, setMediaFiles }: ProjectClassificationProps) {
  const { control, watch } = useFormContext<BidCardSchemaType>();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-4">What type of project do you need?</h2>
        <p className="text-gray-600 mb-6">
          Select the option that best describes your project, and we'll help you get started.
        </p>
      </div>

      {/* Project Type Selection */}
      <FormField
        control={control}
        name="job_type_id"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormControl>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {PROJECT_TYPES.map((type) => (
                  <Card 
                    key={type.id} 
                    className={`p-0 cursor-pointer transition-all border-2 overflow-hidden ${
                      type.disabled ? 'opacity-70 cursor-not-allowed' : 
                      field.value === type.id ? 'ring-2 ring-blue-600 border-blue-300' : 'hover:shadow-md border-gray-200'
                    }`}
                    onClick={() => {
                      if (!type.disabled) {
                        field.onChange(type.id);
                        setSelectedType(type.id);
                      }
                    }}
                  >
                    <div className={`p-3 ${type.color}`}>
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg">{type.label}</h3>
                        <span className="text-2xl">{type.image}</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-gray-600 text-sm mb-3">{type.description}</p>
                      <div className="text-xs text-gray-500">
                        {type.disabled ? (
                          <span className="font-medium">Coming Soon</span>
                        ) : (
                          <>
                            <span className="font-medium">Examples:</span> {type.examples.join(', ')}
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
