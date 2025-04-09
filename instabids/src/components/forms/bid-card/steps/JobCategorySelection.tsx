'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { BidCardFormSchemaType } from '../BidCardForm';
import { useState } from 'react';
import { FormStepProps } from '../BidCardForm';

// UI Components
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Expanded job categories with ~30 options per category
export const EXPANDED_JOB_CATEGORIES = {
  'one-time': [
    { id: 'roof-install', label: 'Roof Installation', image: '🏠' },
    { id: 'fence-building', label: 'Fence Building', image: '🏗️' },
    { id: 'driveway-paving', label: 'Driveway Paving', image: '🛣️' },
    { id: 'deck-construction', label: 'Deck Construction', image: '🏡' },
    { id: 'painting-exterior', label: 'Exterior Painting', image: '🖌️' },
    { id: 'siding-installation', label: 'Siding Installation', image: '🧱' },
    { id: 'gutter-installation', label: 'Gutter Installation', image: '🌧️' },
    { id: 'landscaping-project', label: 'Landscaping Project', image: '🌳' },
    { id: 'patio-installation', label: 'Patio Installation', image: '⛱️' },
    { id: 'concrete-work', label: 'Concrete Work', image: '🧰' },
    { id: 'insulation-install', label: 'Insulation Installation', image: '❄️' },
    { id: 'window-installation', label: 'Window Installation', image: '🪟' },
    { id: 'door-installation', label: 'Door Installation', image: '🚪' },
    { id: 'garage-door-install', label: 'Garage Door Installation', image: '🚗' },
    { id: 'solar-panel-install', label: 'Solar Panel Installation', image: '☀️' },
    { id: 'flooring-installation', label: 'Flooring Installation', image: '🪵' },
    { id: 'tile-installation', label: 'Tile Installation', image: '🧩' },
    { id: 'kitchen-countertop', label: 'Kitchen Countertop', image: '🍽️' },
    { id: 'bathroom-remodel', label: 'Bathroom Remodel', image: '🚿' },
    { id: 'basement-finishing', label: 'Basement Finishing', image: '🪜' },
    { id: 'outdoor-lighting', label: 'Outdoor Lighting', image: '💡' },
    { id: 'sprinkler-system', label: 'Sprinkler System', image: '💦' },
    { id: 'tree-removal', label: 'Tree Removal', image: '🌲' },
    { id: 'wallpaper-hanging', label: 'Wallpaper Hanging', image: '📜' },
    { id: 'shed-construction', label: 'Shed Construction', image: '🏚️' },
    { id: 'generator-install', label: 'Generator Installation', image: '⚡' },
    { id: 'chimney-construction', label: 'Chimney Construction', image: '🧱' },
    { id: 'water-heater-install', label: 'Water Heater Installation', image: '🔥' },
    { id: 'security-system', label: 'Security System Installation', image: '🔒' },
    { id: 'other-one-time', label: 'Other One-Time Project', image: '❓' }
  ],
  'continual': [
    { id: 'pool-cleaning', label: 'Pool Cleaning', image: '🏊' },
    { id: 'lawn-maintenance', label: 'Lawn Maintenance', image: '🌿' },
    { id: 'house-cleaning', label: 'House Cleaning', image: '🧹' },
    { id: 'snow-removal', label: 'Snow Removal', image: '❄️' },
    { id: 'pest-control', label: 'Pest Control', image: '🐜' },
    { id: 'hvac-maintenance', label: 'HVAC Maintenance', image: '🌡️' },
    { id: 'gutter-cleaning', label: 'Gutter Cleaning', image: '🍂' },
    { id: 'gardening-service', label: 'Gardening Service', image: '🌱' },
    { id: 'window-cleaning', label: 'Window Cleaning', image: '🪟' },
    { id: 'chimney-sweep', label: 'Chimney Sweeping', image: '🧹' },
    { id: 'carpet-cleaning', label: 'Carpet Cleaning', image: '🧽' },
    { id: 'pressure-washing', label: 'Pressure Washing', image: '💦' },
    { id: 'landscaping-ongoing', label: 'Landscaping (Ongoing)', image: '🌳' },
    { id: 'security-monitoring', label: 'Security Monitoring', image: '🔒' },
    { id: 'dog-walking', label: 'Dog Walking', image: '🐕' },
    { id: 'pet-sitting', label: 'Pet Sitting', image: '🐈' },
    { id: 'pool-maintenance', label: 'Pool Maintenance', image: '🏊' },
    { id: 'lawn-fertilization', label: 'Lawn Fertilization', image: '🌱' },
    { id: 'tree-trimming', label: 'Tree Trimming', image: '🌲' },
    { id: 'air-duct-cleaning', label: 'Air Duct Cleaning', image: '💨' },
    { id: 'septic-maintenance', label: 'Septic Maintenance', image: '🚽' },
    { id: 'trash-removal', label: 'Trash Removal', image: '🗑️' },
    { id: 'water-delivery', label: 'Water Delivery', image: '💧' },
    { id: 'fireplace-cleaning', label: 'Fireplace Cleaning', image: '🔥' },
    { id: 'laundry-service', label: 'Laundry Service', image: '👕' },
    { id: 'meal-preparation', label: 'Meal Preparation', image: '🍳' },
    { id: 'grocery-delivery', label: 'Grocery Delivery', image: '🛒' },
    { id: 'roof-inspection', label: 'Roof Inspection', image: '🏠' },
    { id: 'landscaping-seasonal', label: 'Seasonal Landscaping', image: '🍁' },
    { id: 'other-continual', label: 'Other Continual Service', image: '❓' }
  ],
  'repair': [
    { id: 'window-repair', label: 'Window Repair', image: '🪟' },
    { id: 'plumbing-repair', label: 'Plumbing Repair', image: '🚿' },
    { id: 'electrical-repair', label: 'Electrical Repair', image: '⚡' },
    { id: 'roof-repair', label: 'Roof Repair', image: '🏠' },
    { id: 'appliance-repair', label: 'Appliance Repair', image: '🧰' },
    { id: 'flooring-repair', label: 'Flooring Repair', image: '🪵' },
    { id: 'drywall-repair', label: 'Drywall Repair', image: '🧱' },
    { id: 'garage-door-repair', label: 'Garage Door Repair', image: '🚪' },
    { id: 'hvac-repair', label: 'HVAC Repair', image: '🌡️' },
    { id: 'fence-repair', label: 'Fence Repair', image: '🏗️' },
    { id: 'deck-repair', label: 'Deck Repair', image: '🏡' },
    { id: 'door-repair', label: 'Door Repair', image: '🚪' },
    { id: 'siding-repair', label: 'Siding Repair', image: '🧱' },
    { id: 'foundation-repair', label: 'Foundation Repair', image: '🏠' },
    { id: 'tile-repair', label: 'Tile Repair', image: '🧩' },
    { id: 'gutter-repair', label: 'Gutter Repair', image: '🌧️' },
    { id: 'water-heater-repair', label: 'Water Heater Repair', image: '🔥' },
    { id: 'toilet-repair', label: 'Toilet Repair', image: '🚽' },
    { id: 'faucet-repair', label: 'Faucet Repair', image: '🚰' },
    { id: 'refrigerator-repair', label: 'Refrigerator Repair', image: '❄️' },
    { id: 'oven-repair', label: 'Oven Repair', image: '🔥' },
    { id: 'dishwasher-repair', label: 'Dishwasher Repair', image: '🧽' },
    { id: 'washer-repair', label: 'Washing Machine Repair', image: '👕' },
    { id: 'dryer-repair', label: 'Dryer Repair', image: '👕' },
    { id: 'tv-repair', label: 'TV Repair', image: '📺' },
    { id: 'computer-repair', label: 'Computer Repair', image: '💻' },
    { id: 'ceiling-repair', label: 'Ceiling Repair', image: '☂️' },
    { id: 'stair-repair', label: 'Stair Repair', image: '🪜' },
    { id: 'cabinet-repair', label: 'Cabinet Repair', image: '🪑' },
    { id: 'other-repair', label: 'Other Repair', image: '❓' }
  ],
  'handyman': [
    { id: 'minor-repairs', label: 'Minor Repairs', image: '🔨' },
    { id: 'fixture-installation', label: 'Fixture Installation', image: '💡' },
    { id: 'cabinet-hardware', label: 'Cabinet Hardware', image: '🪛' },
    { id: 'door-adjustment', label: 'Door Adjustment', image: '🚪' },
    { id: 'small-paint-jobs', label: 'Small Paint Jobs', image: '🖌️' },
    { id: 'weatherstripping', label: 'Weatherstripping', image: '❄️' },
    { id: 'caulking', label: 'Caulking', image: '🧰' },
    { id: 'furniture-assembly', label: 'Furniture Assembly', image: '🪑' },
    { id: 'tv-mounting', label: 'TV Mounting', image: '📺' },
    { id: 'shelf-installation', label: 'Shelf Installation', image: '📚' },
    { id: 'baby-proofing', label: 'Baby-Proofing', image: '👶' },
    { id: 'curtain-hanging', label: 'Curtain Hanging', image: '🪟' },
    { id: 'blind-installation', label: 'Blind Installation', image: '🪟' },
    { id: 'picture-hanging', label: 'Picture Hanging', image: '🖼️' },
    { id: 'light-fixture-swap', label: 'Light Fixture Swap', image: '💡' },
    { id: 'ceiling-fan-install', label: 'Ceiling Fan Installation', image: '💨' },
    { id: 'towel-bar-install', label: 'Towel Bar Installation', image: '🛁' },
    { id: 'doorknob-installation', label: 'Doorknob Installation', image: '🚪' },
    { id: 'smoke-detector-install', label: 'Smoke Detector Install', image: '🔥' },
    { id: 'thermostat-install', label: 'Thermostat Installation', image: '🌡️' },
    { id: 'mailbox-install', label: 'Mailbox Installation', image: '📬' },
    { id: 'holiday-lights', label: 'Holiday Light Hanging', image: '🎄' },
    { id: 'gutter-cleaning-small', label: 'Small Gutter Cleaning', image: '🍂' },
    { id: 'grout-repair', label: 'Grout Repair', image: '🧩' },
    { id: 'small-drywall-patch', label: 'Small Drywall Patch', image: '🧱' },
    { id: 'shower-door-adjust', label: 'Shower Door Adjustment', image: '🚿' },
    { id: 'drawer-repair', label: 'Drawer Repair', image: '🗄️' },
    { id: 'pet-door-install', label: 'Pet Door Installation', image: '🐕' },
    { id: 'screen-repair', label: 'Screen Repair', image: '🪟' },
    { id: 'other-handyman', label: 'Other Handyman Task', image: '❓' }
  ],
  'labor': [
    { id: 'moving-help', label: 'Moving Help', image: '📦' },
    { id: 'furniture-assembly', label: 'Furniture Assembly', image: '🪑' },
    { id: 'material-installation', label: 'Material Installation', image: '🧱' },
    { id: 'heavy-lifting', label: 'Heavy Lifting', image: '💪' },
    { id: 'demo-removal', label: 'Demolition & Removal', image: '🔨' },
    { id: 'site-cleanup', label: 'Site Cleanup', image: '🧹' },
    { id: 'material-moving', label: 'Material Moving', image: '🚚' },
    { id: 'prep-work', label: 'Preparation Work', image: '🧤' },
    { id: 'furniture-moving', label: 'Furniture Moving', image: '🛋️' },
    { id: 'appliance-moving', label: 'Appliance Moving', image: '🧊' },
    { id: 'attic-cleanout', label: 'Attic Cleanout', image: '🏠' },
    { id: 'basement-cleanout', label: 'Basement Cleanout', image: '🪜' },
    { id: 'yard-work', label: 'Yard Work', image: '🌿' },
    { id: 'garage-cleanout', label: 'Garage Cleanout', image: '🚗' },
    { id: 'junk-removal', label: 'Junk Removal', image: '🗑️' },
    { id: 'landscaping-labor', label: 'Landscaping Labor', image: '🌳' },
    { id: 'garden-planting', label: 'Garden Planting', image: '🌱' },
    { id: 'snow-shoveling', label: 'Snow Shoveling', image: '❄️' },
    { id: 'leaf-removal', label: 'Leaf Removal', image: '🍂' },
    { id: 'wood-stacking', label: 'Wood Stacking', image: '🪵' },
    { id: 'moving-storage', label: 'Moving To/From Storage', image: '📦' },
    { id: 'party-setup', label: 'Party Setup/Cleanup', image: '🎉' },
    { id: 'fence-painting', label: 'Fence Painting', image: '🖌️' },
    { id: 'holiday-decorating', label: 'Holiday Decorating', image: '🎄' },
    { id: 'mulch-spreading', label: 'Mulch Spreading', image: '🍂' },
    { id: 'paint-prep', label: 'Painting Preparation', image: '🖌️' },
    { id: 'exercise-equipment', label: 'Exercise Equipment Assembly', image: '🏋️' },
    { id: 'patio-furniture', label: 'Patio Furniture Assembly', image: '⛱️' },
    { id: 'brick-laying', label: 'Brick Laying Assistance', image: '🧱' },
    { id: 'other-labor', label: 'Other Labor', image: '❓' }
  ],
  'multi-step': [
    { id: 'bathroom-remodel', label: 'Bathroom Remodel', image: '🚿' },
    { id: 'kitchen-remodel', label: 'Kitchen Remodel', image: '🍳' },
    { id: 'home-addition', label: 'Home Addition', image: '🏗️' },
    { id: 'basement-finishing', label: 'Basement Finishing', image: '🪜' },
    { id: 'attic-conversion', label: 'Attic Conversion', image: '🏠' },
    { id: 'garage-conversion', label: 'Garage Conversion', image: '🚗' },
    { id: 'full-home-renovation', label: 'Full Home Renovation', image: '🏡' },
    { id: 'outdoor-living-space', label: 'Outdoor Living Space', image: '🌳' },
    { id: 'master-suite-addition', label: 'Master Suite Addition', image: '🛏️' },
    { id: 'guest-house', label: 'Guest House Construction', image: '🏠' },
    { id: 'pool-installation', label: 'Pool Installation', image: '🏊' },
    { id: 'sauna-installation', label: 'Sauna Installation', image: '♨️' },
    { id: 'home-office-build', label: 'Home Office Build', image: '💼' },
    { id: 'theater-room', label: 'Home Theater Room', image: '🎬' },
    { id: 'wine-cellar', label: 'Wine Cellar Construction', image: '🍷' },
    { id: 'gym-construction', label: 'Home Gym Construction', image: '🏋️' },
    { id: 'laundry-room-remodel', label: 'Laundry Room Remodel', image: '👕' },
    { id: 'exterior-facelift', label: 'Exterior Facelift', image: '🏠' },
    { id: 'smart-home-installation', label: 'Smart Home Installation', image: '🤖' },
    { id: 'green-energy-retrofit', label: 'Green Energy Retrofit', image: '♻️' },
    { id: 'historical-restoration', label: 'Historical Restoration', image: '🏛️' },
    { id: 'sunroom-addition', label: 'Sunroom Addition', image: '☀️' },
    { id: 'in-law-suite', label: 'In-Law Suite Addition', image: '👵' },
    { id: 'landscaping-overhaul', label: 'Complete Landscaping Overhaul', image: '🌳' },
    { id: 'playroom-build', label: 'Playroom Build', image: '🧸' },
    { id: 'accessibility-remodel', label: 'Accessibility Remodel', image: '♿' },
    { id: 'multi-room-remodel', label: 'Multi-Room Remodel', image: '🏠' },
    { id: 'outdoor-kitchen', label: 'Outdoor Kitchen', image: '🍳' },
    { id: 'mudroom-addition', label: 'Mudroom Addition', image: '👢' },
    { id: 'other-multi-step', label: 'Other Major Project', image: '❓' }
  ]
};

export default function JobCategorySelection({ mediaFiles, setMediaFiles }: FormStepProps) {
  const { control, watch } = useFormContext<BidCardFormSchemaType>();
  const selectedJobType = watch('job_type_id');
  const [otherCategorySelected, setOtherCategorySelected] = useState(false);
  
  // Get categories based on project type
  const categories = selectedJobType ? EXPANDED_JOB_CATEGORIES[selectedJobType as keyof typeof EXPANDED_JOB_CATEGORIES] || [] : [];
  
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
      case 'handyman': return 'Handyman Task';
      case 'multi-step': return 'Major Project';
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
                  <SelectTrigger className="w-full md:w-[300px] border-2 border-gray-300 bg-white shadow-sm">
                    <SelectValue placeholder="Select another job category" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-2 border-gray-300 shadow-md max-h-[300px] overflow-y-auto">
                    {dropdownCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id} className="py-2 hover:bg-blue-50">
                        <div className="flex items-center gap-2">
                          <span>{category.image}</span> {category.label}
                        </div>
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
