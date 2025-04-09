'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// Explicit interface for component props following TypeScript Safety rule
interface ProjectClassificationProps {
  mediaFiles: File[];
  setMediaFiles: React.Dispatch<React.SetStateAction<File[]>>;
}

// Project type options - centralized and typed
const PROJECT_TYPES = [
  {
    id: 'one-time',
    label: 'One Off Project',
    icon: '🏗️',
    description: 'Single-time projects like roof installation or driveway paving'
  },
  {
    id: 'continual',
    label: 'Continual Service',
    icon: '🔄',
    description: 'Recurring services like pool cleaning or lawn maintenance'
  },
  {
    id: 'repair',
    label: 'Repair',
    icon: '🔧',
    description: 'Fix something that\'s broken like window repair or appliance fixes'
  },
  {
    id: 'handyman',
    label: 'Handyman',
    icon: '🧰',
    description: 'Small mixed tasks and home improvements'
  },
  {
    id: 'labor',
    label: 'Labor Only',
    icon: '👷',
    description: 'Just need help with tasks like moving or assembly'
  },
  {
    id: 'multi-step',
    label: 'Multi-Step Project',
    icon: '🏢',
    description: 'Complex projects like bathroom remodels or additions'
  }
];

export default function ProjectClassification({ mediaFiles, setMediaFiles }: ProjectClassificationProps) {
  const { register, setValue, watch } = useFormContext();
  const selectedType = watch('job_type_id');
  
  // Handler to properly set the form value
  const handleTypeSelect = (value: string) => {
    setValue('job_type_id', value, { shouldValidate: true });
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">What type of project is this?</h2>
        <p className="text-gray-600 mb-6">Select the category that best describes your project.</p>
      </div>
      
      {/* RadioGroup parent component is REQUIRED for RadioGroupItem to work */}
      <RadioGroup value={selectedType || ''} onValueChange={handleTypeSelect}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Map through project types to generate options consistently */}
          {PROJECT_TYPES.map((type) => (
            <div 
              key={type.id}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                selectedType === type.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
              onClick={() => handleTypeSelect(type.id)}
            >
              <div className="flex items-center gap-2 mb-2">
                <RadioGroupItem value={type.id} id={type.id} />
                <Label htmlFor={type.id} className="text-lg font-medium cursor-pointer">
                  {type.label} {type.icon}
                </Label>
              </div>
              <p className="text-gray-600 ml-6">{type.description}</p>
            </div>
          ))}
        </div>
      </RadioGroup>
      
      {/* AIGC Coming Soon Banner */}
      <div className="mt-8 p-4 bg-gray-100 border border-dashed border-gray-300 rounded-lg text-center">
        <p className="text-gray-600">
          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded mb-2">COMING SOON</span>
          <br />
          AI-Generated Project Categories - Let AI help determine your project type
        </p>
      </div>
      
      {/* Hidden input for form handling */}
      <input type="hidden" {...register('job_type_id')} />
    </div>
  );
}
