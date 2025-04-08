'use client';

import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { Button } from '@/components/ui/button';

// Simplified test form to identify performance issues
export default function TestForm() {
  const [step, setStep] = useState(0);
  
  const methods = useForm({
    defaultValues: {
      test: ''
    }
  });
  
  const nextStep = () => {
    console.log('Next step clicked');
    setStep(prev => prev + 1);
  };
  
  return (
    <FormProvider {...methods}>
      <div className="max-w-3xl mx-auto p-8 bg-white rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold mb-6">Test Form (Step {step + 1})</h1>
        
        <div className="mb-10">
          {step === 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Step 1</h2>
              <p className="mb-4">This is a minimal test form to identify performance issues.</p>
            </div>
          )}
          
          {step === 1 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Step 2</h2>
              <p className="mb-4">If you can see this, navigation is working correctly.</p>
            </div>
          )}
        </div>
        
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => step > 0 && setStep(prev => prev - 1)}
            disabled={step === 0}
          >
            Back
          </Button>
          
          <Button onClick={nextStep}>
            Continue
          </Button>
        </div>
      </div>
    </FormProvider>
  );
}
