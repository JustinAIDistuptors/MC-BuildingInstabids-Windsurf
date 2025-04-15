'use client';

import { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/lib/supabase/client';

// Import ALL step components
import ProjectClassification from './steps/ProjectClassification';
import JobCategorySelection from './steps/JobCategorySelection';
import ProjectDetails from './steps/ProjectDetails';
import LocationTimeline from './steps/LocationTimeline';
import BudgetBidding from './steps/BudgetBidding';
import MediaUpload from './steps/MediaUpload';
import ReviewSubmit from './steps/ReviewSubmit';

// Complete schema for the form
const formSchema = z.object({
  job_type_id: z.string().min(1, "Please select a project type").optional(),
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
  bid_deadline: z.string().optional(),
  // Budget fields
  job_size: z.string().optional(),
  group_bidding_enabled: z.boolean().default(false),
  // Property details
  property_size: z.string().optional(),
  square_footage: z.number().optional(),
  // Review fields
  terms_accepted: z.boolean().optional(),
  marketing_consent: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Success screen with finding contractors animation
const SuccessScreen = ({ bidData, onViewBidCard, onBackToDashboard }: { 
  bidData: FormValues, 
  onViewBidCard: () => void,
  onBackToDashboard: () => void
}) => (
  <div className="text-center py-10 space-y-8">
    <div className="mb-8">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold">Your project has been submitted!</h2>
      <p className="text-gray-600 mt-2">We're finding the perfect contractors for your project.</p>
    </div>
    
    <div className="flex justify-center space-x-4 mb-8">
      <div className="animate-bounce delay-100 bg-blue-500 p-2 w-10 h-10 ring-1 ring-slate-200 shadow-lg rounded-full flex items-center justify-center">
        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
      <div className="animate-bounce delay-300 bg-blue-500 p-2 w-10 h-10 ring-1 ring-slate-200 shadow-lg rounded-full flex items-center justify-center">
        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </div>
      <div className="animate-bounce delay-500 bg-blue-500 p-2 w-10 h-10 ring-1 ring-slate-200 shadow-lg rounded-full flex items-center justify-center">
        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </div>
    
    <div className="space-y-4">
      <div className="text-left max-w-md mx-auto">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h3 className="font-medium text-blue-800">What happens next?</h3>
          <ul className="mt-2 space-y-2 text-sm text-blue-700">
            <li className="flex items-center">
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Qualified contractors will be notified about your project</span>
            </li>
            <li className="flex items-center">
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>You'll start receiving bids within 24-48 hours</span>
            </li>
            <li className="flex items-center">
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>We'll send you email notifications as bids come in</span>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button 
          onClick={onViewBidCard} 
          className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-lg font-medium shadow-md"
        >
          View Your Project
        </Button>
        
        <Button 
          onClick={onBackToDashboard} 
          variant="outline"
          className="px-8 py-3 text-lg font-medium shadow-sm"
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  </div>
);

// Bid card view component
const BidCardView = ({ bidData, mediaFiles, onBack, onBackToDashboard }: { 
  bidData: FormValues, 
  mediaFiles: File[], 
  onBack: () => void,
  onBackToDashboard: () => void
}) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-bold">Your Project</h2>
      <Button variant="outline" onClick={onBackToDashboard}>Back to Dashboard</Button>
    </div>
    
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-2">Project Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Project Type</p>
              <p className="font-medium">{bidData.job_type_id || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Project Size</p>
              <p className="font-medium">{bidData.job_size || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Group Bidding</p>
              <p className="font-medium">{bidData.group_bidding_enabled ? 'Enabled' : 'Disabled'}</p>
            </div>
          </div>
          
          {bidData.description && (
            <div className="mt-4">
              <p className="text-sm text-gray-500">Description</p>
              <p className="font-medium">{bidData.description}</p>
            </div>
          )}
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-2">Location & Timeline</h3>
          <div className="grid grid-cols-2 gap-4">
            {bidData.location && (
              <>
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium">
                    {bidData.location.address_line1 || 'Not specified'}
                    {bidData.location.address_line2 && <span>, {bidData.location.address_line2}</span>}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">City, State, ZIP</p>
                  <p className="font-medium">
                    {bidData.location.city || ''}
                    {bidData.location.city && bidData.location.state && ', '}
                    {bidData.location.state || ''}
                    {(bidData.location.city || bidData.location.state) && bidData.location.zip_code && ' '}
                    {bidData.location.zip_code || ''}
                  </p>
                </div>
              </>
            )}
            
            <div>
              <p className="text-sm text-gray-500">Timeline Start</p>
              <p className="font-medium">{bidData.timeline_start || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Timeline End</p>
              <p className="font-medium">{bidData.timeline_end || 'Not specified'}</p>
            </div>
          </div>
        </div>
        
        {mediaFiles.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-2">Project Photos</h3>
            <div className="grid grid-cols-3 gap-4">
              {mediaFiles.map((file, index) => (
                <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100 border">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Project photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div>
          <h3 className="text-lg font-medium mb-2">Bid Status</h3>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-yellow-800">Awaiting Bids</h4>
                <p className="text-sm text-yellow-700">
                  Your project is active and contractors are being notified. You should receive your first bids soon.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="pt-4 border-t">
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700" 
            onClick={onBackToDashboard}
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    </Card>
  </div>
);

export default function BidCardForm() {
  const [currentStep, setCurrentStep] = useState(0); // Start at first step
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showBidCard, setShowBidCard] = useState(false);
  const [submittedData, setSubmittedData] = useState<FormValues | null>(null);
  const [formKey, setFormKey] = useState(Date.now()); // Used to force re-render the form
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  
  // Define form steps
  const FORM_STEPS = [
    { id: 'project-type', title: 'Project Type' },
    { id: 'job-category', title: 'Job Category' },
    { id: 'project-details', title: 'Project Details' },
    { id: 'location', title: 'Location' },
    { id: 'budget', title: 'Budget' },
    { id: 'media', title: 'Media' },
    { id: 'review', title: 'Review' },
  ];
  
  // Setup form with default values
  const methods = useForm<FormValues>({
    defaultValues: {
      group_bidding_enabled: false,
      job_size: 'medium',
    }
  });
  
  // Handle form submission - only triggered by the submit button
  const onSubmit = async (data: FormValues) => {
    console.log('Form submitted:', data);
    console.log('Media files:', mediaFiles);
    
    setIsSubmitting(true);
    
    try {
      // Get the current user session directly instead of using getCurrentUser
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Error getting user session:', sessionError);
        setIsSubmitting(false);
        return;
      }
      
      if (!sessionData.session?.user?.id) {
        console.error('No user ID found - user must be logged in to create a project');
        setIsSubmitting(false);
        return;
      }
      
      const userId = sessionData.session.user.id;
      console.log('Creating project for authenticated user:', userId);
      
      // 1. Create project in Supabase
      console.log('About to create project with data:', {
        title: data.title || 'Untitled Project',
        owner_id: userId,
        // Log other fields for debugging
      });
      
      try {
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .insert([
            {
              title: data.title || 'Untitled Project',
              description: data.description || 'No description provided',
              status: 'published',
              bid_status: 'accepting_bids',
              job_size: data.job_size || 'medium', // Store the actual job size (small, medium, large)
              city: data.location?.city || '',
              state: data.location?.state || '',
              zip_code: data.location?.zip_code || data.zip_code || '',
              
              // Store job type information in dedicated columns
              type: data.job_type_id || 'one_time',
              job_type_id: data.job_type_id || 'one_time',
              job_category_id: data.job_category_id || 'home_services',
              service_type: data.job_category_id || 'home_services',
              
              // Store location as a JSON string in the location column
              location: JSON.stringify({
                address_line1: data.location?.address_line1 || '',
                address_line2: data.location?.address_line2 || '',
                city: data.location?.city || '',
                state: data.location?.state || '',
                zip_code: data.location?.zip_code || data.zip_code || '',
              }),
              
              // Property details
              property_type: 'residential', // Default to residential
              property_size: data.property_size || '',
              square_footage: data.square_footage || 0,
              
              // Timeline information
              timeline: data.timeline_horizon_id || 'Not specified',
              timeline_horizon_id: data.timeline_horizon_id || '',
              timeline_start: data.timeline_start || null,
              timeline_end: data.timeline_end || null,
              bid_deadline: data.bid_deadline || null,
              
              // Additional project details
              special_requirements: data.special_requirements || '',
              guidance_for_bidders: data.guidance_for_bidders || '',
              
              // Group bidding and consent
              group_bidding_enabled: data.group_bidding_enabled || false,
              terms_accepted: data.terms_accepted || false,
              marketing_consent: data.marketing_consent || false,
              
              // Add owner_id from the session user
              owner_id: userId
            }
          ])
          .select();
        
        if (projectError) {
          console.error('Error creating project:', projectError);
          console.error('Error details:', JSON.stringify(projectError, null, 2));
          setIsSubmitting(false);
          return;
        }
        
        if (!projectData || projectData.length === 0) {
          console.error('No project data returned after creation');
          setIsSubmitting(false);
          return;
        }
        
        console.log('Project created successfully:', projectData[0]);
        
        // Store project ID for use in the rest of the function
        const projectId = projectData[0].id;
        
        // 2. Upload media files if any
        const uploadedUrls: string[] = [];
        
        if (mediaFiles.length > 0) {
          console.log(`Uploading ${mediaFiles.length} media files...`);
          
          for (let i = 0; i < mediaFiles.length; i++) {
            const file = mediaFiles[i];
            if (!file) {
              continue;
            }
            
            const fileExt = file.name.split('.').pop();
            const fileName = `${projectId}/${Date.now()}_${i}.${fileExt}`;
            
            console.log(`Uploading file ${i + 1}/${mediaFiles.length} to projectmedia/${fileName}`);
            
            // Upload file to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('projectmedia')
              .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
              });
              
            if (uploadError) {
              console.error(`Error uploading file ${i + 1}:`, uploadError);
              continue;
            }
            
            console.log(`File ${i + 1} uploaded successfully:`, uploadData?.path);
            
            // Get public URL for the uploaded file
            const { data: publicUrlData } = supabase.storage
              .from('projectmedia')
              .getPublicUrl(uploadData?.path || '');
              
            if (publicUrlData?.publicUrl) {
              uploadedUrls.push(publicUrlData.publicUrl);
              
              // Create reference in project_media table
              const { error: mediaRefError } = await supabase
                .from('project_media')
                .insert([{
                  project_id: projectId,
                  media_url: publicUrlData.publicUrl,
                  media_type: file.type,
                  file_name: file.name
                }]);
                
              if (mediaRefError) {
                console.error('Error creating media reference:', mediaRefError);
              }
            }
          }
        }
        
        // Show success screen
        setIsSubmitted(true);
        
        console.log('Project saved to Supabase with ID:', projectId);
      } catch (insertError) {
        console.error('Exception during project creation:', insertError);
        setIsSubmitting(false);
        return;
      }
    } catch (error) {
      console.error('Failed to save project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Navigation functions
  const goToNextStep = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (currentStep < FORM_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const goToPreviousStep = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Function to go to a specific step
  const goToStep = (stepIndex: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (stepIndex >= 0 && stepIndex < FORM_STEPS.length) {
      setCurrentStep(stepIndex);
    }
  };

  // View bid card
  const handleViewBidCard = () => {
    setShowBidCard(true);
  };

  // Go back to success screen
  const handleBackToDashboard = () => {
    // Navigate to the dashboard
    router.push('/dashboard/homeowner/projects');
  };

  // Render the current step - PROPERLY INTEGRATING ALL STEPS
  const renderCurrentStep = () => {
    const { control, register, formState, watch, setValue } = methods;
    const errors = formState.errors;
    
    switch (currentStep) {
      case 0: // Project Type step
        return (
          <ProjectClassification 
            mediaFiles={mediaFiles} 
            setMediaFiles={setMediaFiles} 
          />
        );
      case 1: // Job Category step
        return (
          <JobCategorySelection 
            mediaFiles={mediaFiles} 
            setMediaFiles={setMediaFiles} 
          />
        );
      case 2: // Project Details step
        return (
          <ProjectDetails 
            control={control} 
            register={register} 
            errors={errors} 
          />
        );
      case 3: // Location step
        return (
          <LocationTimeline 
            control={control} 
            register={register} 
            errors={errors} 
          />
        );
      case 4: // Budget step
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <BudgetBidding control={control} />
          </div>
        );
      case 5: // Media step
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <MediaUpload 
              mediaFiles={mediaFiles} 
              setMediaFiles={setMediaFiles} 
              control={control} 
            />
          </div>
        );
      case 6: // Review step
        return (
          <ReviewSubmit 
            mediaFiles={mediaFiles} 
            control={control} 
          />
        );
      default:
        return null;
    }
  };
  
  // If the form has been submitted, show success screen or bid card view
  if (isSubmitted && submittedData) {
    if (showBidCard) {
      return (
        <Card className="max-w-4xl mx-auto p-6">
          <BidCardView 
            bidData={submittedData} 
            mediaFiles={mediaFiles} 
            onBack={() => setShowBidCard(false)} 
            onBackToDashboard={handleBackToDashboard}
          />
        </Card>
      );
    }
    
    return (
      <Card className="max-w-4xl mx-auto p-6">
        <SuccessScreen 
          bidData={submittedData} 
          onViewBidCard={handleViewBidCard} 
          onBackToDashboard={handleBackToDashboard}
        />
      </Card>
    );
  }
  
  // Otherwise show the form
  return (
    <FormProvider {...methods}>
      <Card className="max-w-4xl mx-auto p-6">
        <form 
          key={formKey} 
          onSubmit={(e) => {
            e.stopPropagation();
            methods.handleSubmit(onSubmit)(e);
          }} 
          className="space-y-8"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Progress indicator */}
          <div className="mb-6">
            <div className="flex mb-2">
              {FORM_STEPS.map((formStep, idx) => (
                <div 
                  key={idx} 
                  className="text-xs text-center flex-1 cursor-pointer" 
                  onClick={(e) => goToStep(idx, e)}
                >
                  <div 
                    className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center mb-1 
                      ${idx <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                  >
                    {idx + 1}
                  </div>
                  <span>{formStep.title}</span>
                </div>
              ))}
            </div>
            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-blue-600 h-full transition-all duration-300" 
                style={{ width: `${((currentStep + 1) / FORM_STEPS.length) * 100}%` }}
              />
            </div>
          </div>
          
          {/* Current step content */}
          <div className="min-h-[400px]" onClick={(e) => e.stopPropagation()}>
            {renderCurrentStep()}
          </div>
          
          {/* Navigation buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={goToPreviousStep}
              disabled={currentStep === 0}
              className="px-6 py-2 text-base"
            >
              Previous
            </Button>
            
            {currentStep < FORM_STEPS.length - 1 ? (
              <Button 
                type="button" 
                onClick={goToNextStep}
                className="px-8 py-2 text-base font-medium bg-blue-600 hover:bg-blue-700 shadow-md"
              >
                Next Step
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 ml-2" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </Button>
            ) : (
              <Button 
                type="submit" 
                className="px-8 py-2 text-base font-medium bg-green-600 hover:bg-green-700 shadow-md"
              >
                Submit Project
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 ml-2" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </Button>
            )}
          </div>
        </form>
      </Card>
    </FormProvider>
  );
}
