'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import BidCardForm from '@/components/forms/bid-card/BidCardForm';

// BidCardView component to display a submitted project
const BidCardView = ({ bidData, mediaFiles, onBack }: { 
  bidData: any, 
  mediaFiles: File[], 
  onBack: () => void 
}) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-bold">Your Project</h2>
      <Button variant="outline" onClick={onBack}>Back to Dashboard</Button>
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
              <p className="text-sm text-gray-500">Title</p>
              <p className="font-medium">{bidData.title || 'Not specified'}</p>
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
        
        {mediaFiles && mediaFiles.length > 0 && (
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
          <Button className="w-full" onClick={onBack}>Return to Dashboard</Button>
        </div>
      </div>
    </Card>
  </div>
);

export default function BidCardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [viewMode, setViewMode] = useState(false);
  const [projectData, setProjectData] = useState<any>(null);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  
  useEffect(() => {
    // Check if we're in view mode from query params
    const view = searchParams.get('view');
    if (view === 'true') {
      setViewMode(true);
      
      // Try to get the last submitted project from localStorage
      try {
        const lastSubmittedProjectString = localStorage.getItem('lastSubmittedProject');
        if (lastSubmittedProjectString) {
          const lastSubmittedProject = JSON.parse(lastSubmittedProjectString);
          setProjectData(lastSubmittedProject.data);
          
          // For demo purposes, create a dummy file since we can't store actual File objects in localStorage
          const dummyFile = new File([""], "project-image.jpg", { type: "image/jpeg" });
          setMediaFiles([dummyFile, dummyFile]); // Add a couple dummy files for display
        }
      } catch (error) {
        console.error('Error loading project data:', error);
      }
    }
  }, [searchParams]);
  
  const handleBackToDashboard = () => {
    router.push('/dashboard/homeowner/projects');
  };
  
  // If in view mode and we have project data, show the BidCardView
  if (viewMode && projectData) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-4xl mx-auto p-6">
          <BidCardView 
            bidData={projectData} 
            mediaFiles={mediaFiles} 
            onBack={handleBackToDashboard} 
          />
        </Card>
      </div>
    );
  }
  
  // Otherwise show the regular BidCardForm
  return <BidCardForm />;
}
