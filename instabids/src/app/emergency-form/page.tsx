'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

// Emergency barebones version to restore basic functionality
export default function EmergencyForm() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const steps = [
    "Project Type",
    "Project Details",
    "Timeline & Budget",
    "Location",
    "Media Upload",
    "Review & Submit"
  ];
  
  const handleNext = () => {
    console.log('Next clicked');
    if (step < steps.length - 1) {
      setStep(prev => prev + 1);
    }
  };
  
  const handleBack = () => {
    if (step > 0) {
      setStep(prev => prev - 1);
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">Emergency Form (All Animations Disabled)</h1>
      
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex justify-between">
          {steps.map((stepName, index) => (
            <button 
              key={index}
              className={`px-3 py-1 rounded ${index === step ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => index <= step && setStep(index)}
            >
              {index + 1}. {stepName}
            </button>
          ))}
        </div>
      </div>
      
      <Card className="max-w-3xl mx-auto">
        <CardContent className="pt-6">
          <h2 className="text-xl font-bold mb-4">{steps[step]}</h2>
          
          {/* Step content - minimal version */}
          <div className="min-h-[300px] border p-4 rounded-md">
            <p>This is a barebones emergency version of step {step + 1}: {steps[step]}</p>
            <p className="mt-4">All animations and complex effects are disabled to troubleshoot the freezing issue.</p>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 0}
          >
            Back
          </Button>
          
          <Button 
            onClick={handleNext}
            disabled={step === steps.length - 1}
          >
            Continue
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
