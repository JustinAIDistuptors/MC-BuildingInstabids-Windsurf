'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, FormProvider, SubmitHandler } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { bidCardSchema, BidCardSchemaType, INITIAL_BID_CARD_VALUES, STEP_VALIDATION_FIELDS } from '@/schemas/bidding.schema';

// Step components
import ProjectClassification from './steps/ProjectClassification';
import JobCategorySelection from './steps/JobCategorySelection';
import ProjectDetails from './steps/ProjectDetails';
import LocationTimeline from './steps/LocationTimeline';
import BudgetBidding from './steps/BudgetBidding';
import MediaUpload from './steps/MediaUpload';
import ReviewSubmit from './steps/ReviewSubmit';

// UI components
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

// Base steps for all project types
const BASE_STEPS = [
  { id: 'classification', title: 'Project Type', component: ProjectClassification },
];

// Type-specific step configurations
const PROJECT_TYPE_PATHS = {
  'one-time': [
    { id: 'category', title: 'Job Selection', component: JobCategorySelection },
    { id: 'details', title: 'Project Details', component: ProjectDetails },
    { id: 'location', title: 'Location & Timeline', component: LocationTimeline },
    { id: 'budget', title: 'Budget & Bidding', component: BudgetBidding },
    { id: 'media', title: 'Media Upload', component: MediaUpload },
    { id: 'review', title: 'Review & Submit', component: ReviewSubmit },
  ],
  'continual': [
    { id: 'category', title: 'Service Selection', component: JobCategorySelection },
    { id: 'details', title: 'Service Details', component: ProjectDetails },
    { id: 'location', title: 'Location & Schedule', component: LocationTimeline },
    { id: 'budget', title: 'Budget & Preferences', component: BudgetBidding },
    { id: 'media', title: 'Media Upload', component: MediaUpload },
    { id: 'review', title: 'Review & Submit', component: ReviewSubmit },
  ],
  'repair': [
    { id: 'category', title: 'Repair Selection', component: JobCategorySelection },
    { id: 'details', title: 'Repair Details', component: ProjectDetails },
    { id: 'location', title: 'Location & Timeline', component: LocationTimeline },
    { id: 'budget', title: 'Budget & Bidding', component: BudgetBidding },
    { id: 'media', title: 'Media Upload', component: MediaUpload },
    { id: 'review', title: 'Review & Submit', component: ReviewSubmit },
  ],
  'labor': [
    { id: 'category', title: 'Labor Selection', component: JobCategorySelection },
    { id: 'details', title: 'Labor Details', component: ProjectDetails },
    { id: 'location', title: 'Location & Schedule', component: LocationTimeline },
    { id: 'budget', title: 'Budget & Terms', component: BudgetBidding },
    { id: 'media', title: 'Media Upload', component: MediaUpload },
    { id: 'review', title: 'Review & Submit', component: ReviewSubmit },
  ],
  'kitchen': [
    { id: 'category', title: 'Kitchen Project Selection', component: JobCategorySelection },
    { id: 'details', title: 'Kitchen Details', component: ProjectDetails },
    { id: 'location', title: 'Location & Timeline', component: LocationTimeline },
    { id: 'budget', title: 'Budget & Bidding', component: BudgetBidding },
    { id: 'media', title: 'Media Upload', component: MediaUpload },
    { id: 'review', title: 'Review & Submit', component: ReviewSubmit },
  ],
  'bathroom': [
    { id: 'category', title: 'Bathroom Project Selection', component: JobCategorySelection },
    { id: 'details', title: 'Bathroom Details', component: ProjectDetails },
    { id: 'location', title: 'Location & Timeline', component: LocationTimeline },
    { id: 'budget', title: 'Budget & Bidding', component: BudgetBidding },
    { id: 'media', title: 'Media Upload', component: MediaUpload },
    { id: 'review', title: 'Review & Submit', component: ReviewSubmit },
  ],
};

export default function BidCardForm() {
  const [step, setStep] = useState(0);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const router = useRouter();
  
  // Initialize form with React Hook Form and Zod validation
  const methods = useForm<BidCardSchemaType>({
    resolver: zodResolver(bidCardSchema) as any,
    defaultValues: INITIAL_BID_CARD_VALUES,
    mode: 'onChange',
  });
  
  const { handleSubmit, trigger, getValues, watch, formState: { errors, isSubmitting } } = methods;
  
  // Watch selected project type
  const selectedProjectType = watch('job_type_id');
  
  // Determine form steps based on selected project type
  const [formSteps, setFormSteps] = useState(BASE_STEPS);
  
  // Update form steps when project type changes
  useEffect(() => {
    if (selectedProjectType && PROJECT_TYPE_PATHS[selectedProjectType as keyof typeof PROJECT_TYPE_PATHS]) {
      setFormSteps([
        ...BASE_STEPS,
        ...PROJECT_TYPE_PATHS[selectedProjectType as keyof typeof PROJECT_TYPE_PATHS]
      ]);
    } else {
      setFormSteps(BASE_STEPS);
    }
  }, [selectedProjectType]);
  
  // Get current step component
  const CurrentStepComponent = formSteps[step]?.component || ProjectClassification;
  
  // Handle next step with validation
  const handleNextStep = async () => {
    // For the first step, only validate job_type_id
    if (step === 0) {
      const isValid = await trigger('job_type_id');
      
      if (isValid) {
        // Wait for form steps to update before proceeding
        if (selectedProjectType) {
          setStep(1);
        } else {
          toast({
            title: 'Please select a project type',
            description: 'You need to select a project type to continue.',
            variant: 'destructive',
          });
        }
      }
      return;
    }
    
    // Skip validation for review step
    if (step === formSteps.length - 1) {
      setStep((prev) => prev + 1);
      return;
    }
    
    // Get fields to validate for the current step
    const fieldsToValidate = STEP_VALIDATION_FIELDS[step as keyof typeof STEP_VALIDATION_FIELDS] || [];
    
    // Validate the fields for the current step
    const isValid = await trigger(fieldsToValidate as any);
    
    if (isValid) {
      setStep((prev) => Math.min(prev + 1, formSteps.length - 1));
    } else {
      console.log('Validation errors:', errors);
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields correctly.',
        variant: 'destructive',
      });
    }
  };
  
  // Handle previous step
  const handlePreviousStep = () => {
    setStep((prev) => Math.max(0, prev - 1));
  };
  
  // Handle save as draft
  const handleSaveDraft = async () => {
    const formData = getValues();
    
    try {
      // Add status as draft
      formData.status = 'draft';
      
      // For now, save to localStorage (can be replaced with Supabase later)
      const savedProject = await saveProjectToStorage(formData, mediaFiles, 'draft');
      
      toast({
        title: 'Draft Saved',
        description: 'Your project has been saved as a draft.',
      });
      
      // Redirect to projects page
      setTimeout(() => {
        router.push('/dashboard/homeowner/projects');
      }, 1500);
    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: 'Error',
        description: 'Failed to save draft. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  // Handle form submission
  const onSubmit: SubmitHandler<any> = async (data: BidCardSchemaType) => {
    try {
      // Set as published
      data.status = 'published';
      
      // Save to localStorage (can be replaced with Supabase later)
      const savedProject = await saveProjectToStorage(data, mediaFiles, 'published');
      
      toast({
        title: 'Success',
        description: 'Your project has been submitted successfully!',
      });
      
      // Redirect to success page or projects list
      setTimeout(() => {
        router.push('/dashboard/homeowner/projects');
      }, 1500);
    } catch (error) {
      console.error('Error submitting project:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit project. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  // Function to save project to storage (localStorage for now)
  const saveProjectToStorage = async (data: BidCardSchemaType, files: File[], status: 'draft' | 'published') => {
    // Create project with required fields for display
    const project = {
      ...data,
      id: `project-${Date.now()}`,
      created_at: new Date().toISOString(),
      bid_status: status === 'published' ? 'accepting_bids' : 'draft',
      creator_id: 'dev-user-id', // Placeholder for now
    };
    
    // Get existing projects
    const existingProjectsString = localStorage.getItem('mock_projects');
    const existingProjects = existingProjectsString ? JSON.parse(existingProjectsString) : [];
    
    // Add new project
    existingProjects.push(project);
    
    // Save back to localStorage
    localStorage.setItem('mock_projects', JSON.stringify(existingProjects));
    
    return project;
  };
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Step Indicator */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">Create New Project</h1>
        
        <div className="mb-6 overflow-hidden">
          <div className="relative">
            {/* Progress Bar */}
            <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -translate-y-1/2"></div>
            <div 
              className="absolute top-1/2 left-0 h-1 bg-blue-600 -translate-y-1/2 transition-all duration-300" 
              style={{ width: `${(step / (formSteps.length - 1)) * 100}%` }}
            ></div>
            
            {/* Step Markers */}
            <div className="relative flex justify-between">
              {formSteps.map((s, index) => (
                <div key={s.id} className="flex flex-col items-center">
                  <div 
                    className={`z-10 flex items-center justify-center w-8 h-8 rounded-full mb-2 ${
                      index <= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className="text-xs text-gray-600 hidden sm:block">{s.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Form */}
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <CurrentStepComponent setMediaFiles={setMediaFiles} mediaFiles={mediaFiles} />
          </div>
          
          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            {step > 0 && (
              <Button 
                type="button" 
                onClick={handlePreviousStep}
                variant="outline"
                className="min-w-[100px]"
              >
                Back
              </Button>
            )}
            
            {step === 0 && (
              <div /> {/* Empty div for flex spacing when back button is not shown */}
            )}
            
            <div className="flex gap-2">
              <Button 
                type="button" 
                onClick={handleSaveDraft}
                variant="outline"
                className="border-2 border-gray-300"
              >
                Save as Draft
              </Button>
              
              {step < formSteps.length - 1 ? (
                <Button 
                  type="button" 
                  onClick={handleNextStep}
                  className="min-w-[100px] font-medium px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white shadow-md border-0"
                  data-component-name="_c"
                >
                  Next
                </Button>
              ) : (
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="min-w-[120px] font-medium px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white shadow-md border-0"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Project'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
