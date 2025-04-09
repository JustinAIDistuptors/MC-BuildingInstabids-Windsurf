'use client';

import { useFormContext } from 'react-hook-form';
import { BidCardSchemaType } from '@/schemas/bidding.schema';
import { format } from 'date-fns';
import { JOB_SIZES } from '@/types/bidding';

// UI Components
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

// Sample job types and categories - this would come from your database in production
const JOB_TYPES: Record<string, string> = {
  'renovation': 'Renovation',
  'new-construction': 'New Construction',
  'repair': 'Repair',
  'maintenance': 'Maintenance',
};

const JOB_CATEGORIES: Record<string, string> = {
  'kitchen': 'Kitchen Renovation',
  'bathroom': 'Bathroom Renovation',
  'roof': 'Roof Repair',
  'plumbing': 'Plumbing Repair',
  'electrical': 'Electrical Repair',
  'single-family': 'Single Family Home',
  'hvac': 'HVAC Maintenance',
  // Add other categories here
};

const INTENTION_TYPES: Record<string, string> = {
  'diy-assistance': 'DIY with Professional Assistance',
  'full-service': 'Full Professional Service',
  'consultation': 'Professional Consultation Only',
};

const TIMELINE_HORIZONS: Record<string, string> = {
  'asap': 'As Soon As Possible',
  '2-weeks': 'Within 2 Weeks',
  '1-month': 'Within 1 Month',
  '3-months': 'Within 3 Months',
  'custom': 'Custom Timeline',
};

const VISIBILITY_OPTIONS: Record<string, string> = {
  'public': 'Public',
  'private': 'Private',
  'group': 'Specific Groups',
};

type ReviewSubmitProps = {
  mediaFiles: File[];
  setMediaFiles: (files: File[]) => void;
};

export default function ReviewSubmit({ mediaFiles, setMediaFiles }: ReviewSubmitProps) {
  const { getValues, watch } = useFormContext<BidCardSchemaType>();
  const formValues = getValues();
  
  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not specified';
    return format(new Date(dateString), 'PPP');
  };
  
  // Get job size display
  const getJobSizeDisplay = (size: string) => {
    const jobSize = JOB_SIZES[size as keyof typeof JOB_SIZES];
    return jobSize || size;
  };
  
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-4">Review & Submit</h2>
        <p className="text-gray-600 mb-6">
          Please review your project details before submitting.
        </p>
      </div>
      
      {/* Project Overview */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium mb-4">Project Summary</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900">{formValues.title}</h4>
            <div className="flex flex-wrap gap-3 mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {JOB_TYPES[formValues.job_type_id] || formValues.job_type_id}
              </span>
              
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {JOB_CATEGORIES[formValues.job_category_id] || formValues.job_category_id}
              </span>
              
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {JOB_SIZES[formValues.job_size]?.label || formValues.job_size}
              </span>
              
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                {INTENTION_TYPES[formValues.intention_type_id] || formValues.intention_type_id}
              </span>
            </div>
          </div>
          
          <div className="text-sm">{formValues.description}</div>
        </div>
      </div>
      
      {/* Section Summaries */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Location */}
        <div className="border rounded-lg p-5">
          <div className="flex items-start">
            <div className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full mr-2">
              <span className="text-sm">📍</span>
            </div>
            <div>
              <h4 className="font-medium">Location</h4>
              <div className="mt-2 space-y-1 text-sm">
                <p>{formValues.location.address_line1}</p>
                {formValues.location.address_line2 && <p>{formValues.location.address_line2}</p>}
                <p>{formValues.location.city}, {formValues.location.state} {formValues.location.zip_code}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Timeline */}
        <div className="border rounded-lg p-5">
          <div className="flex items-start">
            <div className="w-8 h-8 flex items-center justify-center bg-green-100 text-green-600 rounded-full mr-2">
              <span className="text-sm">📅</span>
            </div>
            <div>
              <h4 className="font-medium">Timeline</h4>
              <div className="mt-2 space-y-1 text-sm">
                <p><span className="text-gray-600">Timeframe:</span> {TIMELINE_HORIZONS[formValues.timeline_horizon_id] || formValues.timeline_horizon_id}</p>
                
                {formValues.timeline_horizon_id === 'custom' && (
                  <>
                    <p><span className="text-gray-600">Start:</span> {formatDate(formValues.timeline_start)}</p>
                    <p><span className="text-gray-600">End:</span> {formatDate(formValues.timeline_end)}</p>
                  </>
                )}
                
                <p><span className="text-gray-600">Bid Deadline:</span> {formatDate(formValues.bid_deadline)}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Budget */}
        <div className="border rounded-lg p-5">
          <div className="flex items-start">
            <div className="w-8 h-8 flex items-center justify-center bg-yellow-100 text-yellow-600 rounded-full mr-2">
              <span className="text-sm">💲</span>
            </div>
            <div>
              <h4 className="font-medium">Budget</h4>
              <div className="mt-2 space-y-1 text-sm">
                {formValues.budget_min && <p><span className="text-gray-600">Minimum:</span> ${formValues.budget_min.toLocaleString()}</p>}
                {formValues.budget_max && <p><span className="text-gray-600">Maximum:</span> ${formValues.budget_max.toLocaleString()}</p>}
                <p><span className="text-gray-600">Visibility:</span> {VISIBILITY_OPTIONS[formValues.visibility]}</p>
                <p><span className="text-gray-600">Group Bidding:</span> {formValues.group_bidding_enabled ? 'Enabled' : 'Disabled'}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Media */}
        <div className="border rounded-lg p-5">
          <div className="flex items-start">
            <div className="w-8 h-8 flex items-center justify-center bg-purple-100 text-purple-600 rounded-full mr-2">
              <span className="text-sm">📄</span>
            </div>
            <div>
              <h4 className="font-medium">Media & Documents</h4>
              <div className="mt-2 space-y-1 text-sm">
                <p>{mediaFiles.length} file(s) attached</p>
                {mediaFiles.length > 0 && (
                  <ul className="list-disc list-inside text-gray-600">
                    {mediaFiles.slice(0, 3).map((file, index) => (
                      <li key={index}>{file.name}</li>
                    ))}
                    {mediaFiles.length > 3 && <li>...and {mediaFiles.length - 3} more</li>}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Additional Requirements */}
      {(formValues.special_requirements || formValues.guidance_for_bidders) && (
        <div className="border rounded-lg p-5">
          <h4 className="font-medium mb-3">Additional Information</h4>
          
          {formValues.special_requirements && (
            <div className="mb-4">
              <h5 className="text-sm font-medium text-gray-600">Special Requirements</h5>
              <p className="text-sm mt-1">{formValues.special_requirements}</p>
            </div>
          )}
          
          {formValues.guidance_for_bidders && (
            <div>
              <h5 className="text-sm font-medium text-gray-600">Guidance for Bidders</h5>
              <p className="text-sm mt-1">{formValues.guidance_for_bidders}</p>
            </div>
          )}
        </div>
      )}
      
      {/* Terms and Conditions */}
      <div className="border-t pt-6 mt-6">
        <div className="flex items-start space-x-3">
          <Checkbox id="terms" className="mt-1" />
          <div>
            <Label htmlFor="terms" className="text-base">I agree to the Terms and Conditions</Label>
            <p className="text-gray-500 text-sm mt-1">
              By submitting this project, you agree to our terms of service and privacy policy. You confirm that all information provided is accurate.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
