'use client';

import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, FormProvider } from 'react-hook-form';
import { z } from 'zod';

// UI components
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

// Import project classification - following incremental build process (one component at a time)
import ProjectClassification from './steps/ProjectClassification';
import ProjectDetails from './steps/ProjectDetails';
import JobCategorySelection from './steps/JobCategorySelection';
import LocationTimeline from './steps/LocationTimeline';

// Define a simple initial schema for validation - will expand as steps are added
const bidCardFormSchema = z.object({
  job_type_id: z.string().min(1, "Please select a project type"),
  job_category_id: z.string().optional(),
  title: z.string().min(3, "Title must be at least 3 characters").optional(),
  description: z.string().min(10, "Description must be at least 10 characters").optional(),
  special_requirements: z.string().optional(),
  guidance_for_bidders: z.string().optional(),
  // Location fields
  zip_code: z.string().optional(),
  location: z.object({
    address_line1: z.string().optional(),
    address_line2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip_code: z.string().optional()
  }).optional(),
  // Timeline fields
  timeline_horizon_id: z.string().optional(),
  timeline_start: z.string().optional(),
  timeline_end: z.string().optional(),
  bid_deadline: z.string().optional()
});

// Type inferred from schema
export type BidCardFormSchemaType = z.infer<typeof bidCardFormSchema>;

// Define explicit props interface following TypeScript Safety rule
export interface BidCardFormProps {
  onSubmit?: (data: BidCardFormSchemaType, mediaFiles: File[]) => Promise<void>;
  onSaveDraft?: (data: BidCardFormSchemaType, mediaFiles: File[]) => Promise<void>;
  initialValues?: Partial<BidCardFormSchemaType>;
}

// Define component props for steps to ensure consistent interface
export interface FormStepProps {
  mediaFiles: File[];
  setMediaFiles: React.Dispatch<React.SetStateAction<File[]>>;
}

// Strict typing for form steps to ensure type safety
interface FormStepDefinition {
  id: string;
  title: string;
  component: React.ComponentType<FormStepProps>;
}

// Form steps definition with proper typing
const FORM_STEPS: FormStepDefinition[] = [
  { id: 'type', title: 'Project Type', component: ProjectClassification },
  { id: 'category', title: 'Job Category', component: JobCategorySelection },
  { id: 'details', title: 'Project Details', component: ProjectDetails },
  { id: 'location', title: 'Location & Timeline', component: LocationTimeline },
  { id: 'budget', title: 'Budget & Bidding', component: PlaceholderStep },
  { id: 'media', title: 'Media Upload', component: PlaceholderStep },
  { id: 'review', title: 'Review & Submit', component: PlaceholderStep }
];

// Placeholder component for steps we haven't implemented yet
function PlaceholderStep({ mediaFiles, setMediaFiles }: FormStepProps) {
  return (
    <div className="p-6 bg-gray-50 rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Coming Soon</h2>
      <p className="text-gray-600">This step is currently under development.</p>
    </div>
  );
}

export default function BidCardForm({ onSubmit, onSaveDraft, initialValues = {} }: BidCardFormProps) {
  const [step, setStep] = useState(0);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  
  // Initialize form with React Hook Form and Zod validation
  const methods = useForm<BidCardFormSchemaType>({
    resolver: zodResolver(bidCardFormSchema),
    defaultValues: initialValues,
    mode: 'onChange'
  });
  
  const handleNextStep = async () => {
    // Get fields to validate based on current step
    let fieldsToValidate: string[] = [];
    
    switch(step) {
      case 0: // Project Type
        fieldsToValidate = ['job_type_id'];
        break;
      case 1: // Job Category
        fieldsToValidate = ['job_category_id'];
        break;
      case 2: // Project Details
        fieldsToValidate = ['title', 'description'];
        break;
      case 3: // Location Timeline
        fieldsToValidate = ['zip_code'];
        break;
    }
    
    // Only validate if we have fields to validate
    if (fieldsToValidate.length > 0) {
      const isValid = await methods.trigger(fieldsToValidate as any);
      if (!isValid) {
        toast({
          title: "Validation Error",
          description: "Please complete all required fields before continuing.",
          variant: "destructive"
        });
        return;
      }
    }
    
    setStep(prev => Math.min(prev + 1, FORM_STEPS.length - 1));
  };
  
  const handlePreviousStep = () => {
    setStep(prev => Math.max(0, prev - 1));
  };
  
  const handleSubmitForm = async (data: BidCardFormSchemaType) => {
    try {
      if (onSubmit) {
        await onSubmit(data, mediaFiles);
        toast({
          title: "Project Submitted",
          description: "Your project has been successfully submitted.",
        });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your project. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleSaveDraft = async () => {
    try {
      const data = methods.getValues();
      if (onSaveDraft) {
        await onSaveDraft(data, mediaFiles);
        toast({
          title: "Draft Saved",
          description: "Your project draft has been saved.",
        });
      }
    } catch (error) {
      console.error("Error saving draft:", error);
      toast({
        title: "Failed to Save Draft",
        description: "There was an error saving your draft. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Get current step component with explicit null check
  const CurrentStep = FORM_STEPS[step]?.component || PlaceholderStep;
  
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(handleSubmitForm)} className="space-y-8">
        {/* Progress indicator */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            {FORM_STEPS.map((formStep, idx) => (
              <div key={formStep.id} className="text-xs text-center flex-1">
                <div 
                  className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center mb-1 
                    ${idx <= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                >
                  {idx + 1}
                </div>
                <span className="hidden sm:block">{formStep.title}</span>
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${((step + 1) / FORM_STEPS.length) * 100}%` }}
            ></div>
          </div>
        </div>
        
        {/* Current step content */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <CurrentStep mediaFiles={mediaFiles} setMediaFiles={setMediaFiles} />
        </div>
        
        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handlePreviousStep}
            disabled={step === 0}
          >
            Back
          </Button>
          
          <div className="space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleSaveDraft}
            >
              Save Draft
            </Button>
            
            {(step < FORM_STEPS.length - 1) ? (
              <Button 
                type="button" 
                onClick={handleNextStep}
              >
                Next
              </Button>
            ) : (
              <Button 
                type="submit"
              >
                Submit Project
              </Button>
            )}
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
