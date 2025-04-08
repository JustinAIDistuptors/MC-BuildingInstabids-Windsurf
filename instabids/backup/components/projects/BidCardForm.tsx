'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BidCard, BidCardFormState } from '@/types/bidding';
import ProjectClassificationStep from '@/components/projects/form-steps/ProjectClassificationStep';
import ProjectDetailsStep from '@/components/projects/form-steps/ProjectDetailsStep';
import LocationTimelineStep from '@/components/projects/form-steps/LocationTimelineStep';
import BudgetBiddingStep from '@/components/projects/form-steps/BudgetBiddingStep';
import MediaUploadStep from '@/components/projects/form-steps/MediaUploadStep';
import ReviewSubmitStep from '@/components/projects/form-steps/ReviewSubmitStep';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Save, Check, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BidCardService } from '@/services/bid-card-service';

/**
 * Form steps
 */
const FORM_STEPS = [
  'Project Classification',
  'Project Details',
  'Location & Timeline',
  'Budget & Bidding',
  'Media Upload',
  'Review & Submit'
];

/**
 * Initial form state
 */
const initialFormState: BidCardFormState = {
  currentStep: 0,
  data: {
    title: '',
    description: '',
    job_category_id: '',
    job_type_id: '',
    intention_type_id: '',
    location: {
      address_line1: '',
      city: '',
      state: '',
    },
    zip_code: '',
    job_size: 'medium',
    group_bidding_enabled: false,
    visibility: 'public',
    prohibit_negotiation: true,
    max_contractor_messages: 5,
  },
  errors: {},
  mediaFiles: []
};

/**
 * Multi-step Bid Card creation form
 */
function BidCardForm() {
  const router = useRouter();
  const [formState, setFormState] = useState<BidCardFormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Handler for moving to the next step
   */
  const handleNext = () => {
    // Validate current step before moving on
    if (validateCurrentStep()) {
      setFormState(prev => ({
        ...prev,
        currentStep: Math.min(prev.currentStep + 1, FORM_STEPS.length - 1)
      }));
      // Scroll to top when advancing steps
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  /**
   * Handler for moving to the previous step
   */
  const handlePrevious = () => {
    setFormState(prev => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 0)
    }));
    // Scroll to top when going back
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Handler for jumping to a specific step
   */
  const handleJumpToStep = (step: number) => {
    // Only allow jumping to previous steps or the next step
    if (step <= formState.currentStep || step === formState.currentStep + 1) {
      // Validate current step before allowing jump to next step
      if (step > formState.currentStep && !validateCurrentStep()) {
        return;
      }
      setFormState(prev => ({
        ...prev,
        currentStep: Math.max(0, Math.min(step, FORM_STEPS.length - 1))
      }));
      // Scroll to top when changing steps
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  /**
   * Handler for updating form data
   */
  const handleFormChange = (fieldName: string, value: any) => {
    setFormState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [fieldName]: value
      },
      errors: {
        ...prev.errors,
        [fieldName]: '' // Clear the error when the field changes
      }
    }));
  };

  /**
   * Validate the current form step
   */
  const validateCurrentStep = (): boolean => {
    const { currentStep, data } = formState;
    let errors: Record<string, string> = {};
    let isValid = true;

    // Validation for Step 1: Project Classification
    if (currentStep === 0) {
      if (!data.job_category_id) {
        errors.job_category_id = 'Please select a job category';
        isValid = false;
      }
      
      if (!data.job_type_id) {
        errors.job_type_id = 'Please select a job type';
        isValid = false;
      }
      
      if (!data.intention_type_id) {
        errors.intention_type_id = 'Please select a project intention type';
        isValid = false;
      }
      
      if (!data.job_size) {
        errors.job_size = 'Please select a job size';
        isValid = false;
      }
    }
    
    // Validation for Step 2: Project Details
    else if (currentStep === 1) {
      if (!data.title || data.title.trim().length < 5) {
        errors.title = 'Please enter a title with at least 5 characters';
        isValid = false;
      }
      
      if (!data.description || data.description.trim().length < 20) {
        errors.description = 'Please enter a description with at least 20 characters';
        isValid = false;
      }
    }
    
    // Validation for Step 3: Location & Timeline
    else if (currentStep === 2) {
      if (!data.location.address_line1) {
        errors['location.address_line1'] = 'Please enter an address';
        isValid = false;
      }
      
      if (!data.location.city) {
        errors['location.city'] = 'Please enter a city';
        isValid = false;
      }
      
      if (!data.location.state) {
        errors['location.state'] = 'Please enter a state';
        isValid = false;
      }
      
      if (!data.zip_code) {
        errors.zip_code = 'Please enter a ZIP code';
        isValid = false;
      }
    }
    
    // Validation for Step 4: Budget & Bidding
    else if (currentStep === 3) {
      if (data.budget_min !== undefined && data.budget_max !== undefined) {
        if (data.budget_min > data.budget_max) {
          errors.budget_min = 'Minimum budget cannot be greater than maximum budget';
          isValid = false;
        }
      } else {
        if (data.budget_min === undefined) {
          errors.budget_min = 'Please enter a minimum budget';
          isValid = false;
        }
        if (data.budget_max === undefined) {
          errors.budget_max = 'Please enter a maximum budget';
          isValid = false;
        }
      }
      
      if (!data.bid_deadline) {
        errors.bid_deadline = 'Please select a bid deadline';
        isValid = false;
      } else {
        const deadlineDate = new Date(data.bid_deadline);
        if (deadlineDate < new Date()) {
          errors.bid_deadline = 'Bid deadline cannot be in the past';
          isValid = false;
        }
      }
    }

    // Update form state with validation errors
    setFormState(prev => ({
      ...prev,
      errors
    }));

    return isValid;
  };

  /**
   * Handler for saving bid card as draft
   */
  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      const result = await BidCardService.saveDraft(
        formState.data,
        formState.mediaFiles
      );
      
      toast({
        title: "Draft Saved",
        description: "Your project has been saved as a draft.",
      });
      
      // Optionally, redirect to the draft view or continue editing
      if (result && result.id) {
        // Store the ID for later reference if needed
        setFormState(prev => ({
          ...prev,
          data: {
            ...prev.data,
            id: result.id
          }
        }));
      }
    } catch (error) {
      console.error("Error saving draft:", error);
      toast({
        title: "Error Saving Draft",
        description: "There was an error saving your draft. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handler for submitting the form
   */
  const handleSubmit = async () => {
    // Validate all steps before submission
    if (!validateCurrentStep()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await BidCardService.submitBidCard(
        formState.data,
        formState.mediaFiles
      );
      
      toast({
        title: "Project Submitted",
        description: "Your project has been submitted successfully and is now open for bids.",
      });
      
      // Redirect to dashboard or project view
      router.push('/dashboard/homeowner/projects');
    } catch (error) {
      console.error("Error submitting bid card:", error);
      toast({
        title: "Submission Error",
        description: "There was an error submitting your project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handler for media file uploads
   */
  const handleMediaUpload = (files: File[]) => {
    setFormState(prev => ({
      ...prev,
      mediaFiles: [...prev.mediaFiles, ...files]
    }));
  };

  /**
   * Handler for removing media files
   */
  const handleRemoveMedia = (index: number) => {
    setFormState(prev => ({
      ...prev,
      mediaFiles: prev.mediaFiles.filter((_, i) => i !== index)
    }));
  };

  /**
   * Calculate progress percentage
   */
  const progressPercentage = Math.round(((formState.currentStep + 1) / FORM_STEPS.length) * 100);

  /**
   * Get completed steps (for navigation)
   * A step is considered completed if:
   * 1. It's not the current step AND
   * 2. It's either a previous step OR the form has advanced past it
   */
  const getCompletedSteps = () => {
    return FORM_STEPS.map((_, index) => 
      index < formState.currentStep || 
      (index === formState.currentStep && index === FORM_STEPS.length - 1 && validateCurrentStep())
    );
  };

  /**
   * Render the current step content
   */
  const renderStepContent = () => {
    const { currentStep, data, errors, mediaFiles } = formState;

    switch (currentStep) {
      case 0:
        return (
          <ProjectClassificationStep
            data={data}
            errors={errors}
            onChange={handleFormChange}
          />
        );
      case 1:
        return (
          <ProjectDetailsStep
            data={data}
            errors={errors}
            onChange={handleFormChange}
          />
        );
      case 2:
        return (
          <LocationTimelineStep
            data={data}
            errors={errors}
            onChange={handleFormChange}
          />
        );
      case 3:
        return (
          <BudgetBiddingStep
            data={data}
            errors={errors}
            onChange={handleFormChange}
          />
        );
      case 4:
        return (
          <MediaUploadStep
            data={data}
            errors={errors}
            mediaFiles={mediaFiles}
            onUpload={handleMediaUpload}
            onRemove={handleRemoveMedia}
          />
        );
      case 5:
        return (
          <ReviewSubmitStep
            data={data}
            mediaFiles={mediaFiles}
          />
        );
      default:
        return null;
    }
  };

  /**
   * Render the step navigation
   */
  const renderStepNavigation = () => {
    const completed = getCompletedSteps();
    
    return (
      <div className="mb-8">
        <div className="hidden md:block">
          <div className="mb-2">
            <Progress value={progressPercentage} className="h-2" />
          </div>
          <div className="flex justify-between">
            {FORM_STEPS.map((step, index) => (
              <div 
                key={index}
                className={`text-xs cursor-pointer w-1/6 text-center px-1 
                  ${formState.currentStep === index ? 'font-bold text-primary' : 
                    index < formState.currentStep ? 'text-muted-foreground' : 'text-muted-foreground'}
                `}
                onClick={() => handleJumpToStep(index)}
              >
                {step}
              </div>
            ))}
          </div>
        </div>
        
        <div className="md:hidden">
          <Tabs 
            defaultValue={formState.currentStep.toString()} 
            value={formState.currentStep.toString()}
            onValueChange={(value: string) => handleJumpToStep(parseInt(value))}
            className="w-full"
          >
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="0">Step 1</TabsTrigger>
              <TabsTrigger value="2">Step 3</TabsTrigger>
              <TabsTrigger value="4">Step 5</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="text-center font-medium text-sm mb-2">
            {FORM_STEPS[formState.currentStep]}
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </div>
    );
  };

  /**
   * Render the step footer with navigation buttons
   */
  const renderFooter = () => {
    const { currentStep } = formState;
    const isLastStep = currentStep === FORM_STEPS.length - 1;
    
    return (
      <CardFooter className="flex justify-between pt-6 pb-2">
        <div>
          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={isSubmitting || isSaving}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
          )}
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isSubmitting || isSaving}
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Draft
          </Button>
          
          {isLastStep ? (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || isSaving}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Submit Project
            </Button>
          ) : (
            <Button 
              onClick={handleNext}
              disabled={isSubmitting || isSaving}
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </CardFooter>
    );
  };

  return (
    <Card className="border shadow-sm">
      <CardContent className="pt-6 pb-2">
        {renderStepNavigation()}
        {renderStepContent()}
      </CardContent>
      {renderFooter()}
    </Card>
  );
}

// Export both as default and named export to maintain compatibility
export { BidCardForm };
export default BidCardForm;
