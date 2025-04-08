'use client';

import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BidCardSchemaType, bidCardSchema } from '@/schemas/bidding.schema';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ProjectTypeSelectionSimple from '@/components/forms/bid-card/steps/ProjectTypeSelectionSimple';

// This is a minimal version with no animations or complex components
export default function MinimalBidCardForm() {
  const [currentStep, setCurrentStep] = useState(0);
  
  // Form setup with minimal configuration
  const methods = useForm<BidCardSchemaType>({
    resolver: zodResolver(bidCardSchema) as any,
    defaultValues: {
      title: '',
      description: '',
      job_type_id: '',
      job_category_id: '',
      status: 'draft' as const,
      visibility: 'public' as const,
      group_bidding_enabled: false,
    },
    mode: 'onSubmit'
  });
  
  // Step configurations
  const steps = [
    { title: 'Project Type' },
    { title: 'Project Details' },
    { title: 'Timeline & Budget' },
    { title: 'Location' },
    { title: 'Media Upload' },
    { title: 'Review & Submit' }
  ];
  
  // Navigation methods
  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(current => current + 1);
    }
  };
  
  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(current => current - 1);
    }
  };

  return (
    <FormProvider {...methods}>
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Create New Project (Minimal Version)</h1>
        
        {/* Progress indicator */}
        <div className="mb-6 flex justify-between border-b pb-4">
          {steps.map((step, index) => (
            <button 
              key={index}
              className={`px-3 py-1 font-medium ${index === currentStep ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
              onClick={() => index <= currentStep && setCurrentStep(index)}
            >
              {index + 1}. {step.title}
            </button>
          ))}
        </div>
        
        <Card className="max-w-3xl mx-auto shadow-sm">
          <CardContent className="pt-6">
            <div className="min-h-[300px]">
              {currentStep === 0 && <ProjectTypeSelectionSimple />}
              
              {currentStep === 1 && (
                <div className="p-4">
                  <h2 className="text-xl font-bold mb-4">Project Details</h2>
                  <p>This is a placeholder for the second step.</p>
                </div>
              )}
              
              {currentStep > 1 && (
                <div className="p-4">
                  <h2 className="text-xl font-bold mb-4">{steps[currentStep].title}</h2>
                  <p>This is a placeholder for steps after the first.</p>
                </div>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handlePrevStep}
              disabled={currentStep === 0}
            >
              Back
            </Button>
            
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => console.log('Save draft')}
              >
                Save Draft
              </Button>
              
              <Button 
                onClick={handleNextStep}
                disabled={currentStep === steps.length - 1}
              >
                Continue
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </FormProvider>
  );
}
