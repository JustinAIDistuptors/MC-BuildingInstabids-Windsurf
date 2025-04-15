"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ContractorService } from "@/services/ContractorService";
import React from "react";

interface ProjectDetailPageProps {
  params: {
    id: string;
  };
}

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState<string>('');
  const [bidMessage, setBidMessage] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [existingBid, setExistingBid] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  
  // Safely unwrap params using React.use() if it's a Promise
  const safeParams = params instanceof Promise ? React.use(params) : params;
  const projectId = safeParams.id;

  useEffect(() => {
    async function fetchProjectDetails() {
      setLoading(true);
      setError(null);
      
      try {
        // Check authentication first
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          setError("Authentication error. Please sign in again.");
          setLoading(false);
          return;
        }
        
        if (!sessionData.session) {
          setError("Please sign in to view project details.");
          setLoading(false);
          return;
        }
        
        setUserId(sessionData.session.user.id);
        
        // Fetch project details using the service layer
        try {
          const projectData = await ContractorService.getProjectById(projectId);
          setProject(projectData);
          
          // Check if contractor already has a bid on this project
          const contractorBids = await ContractorService.getContractorBidsForProject(
            sessionData.session.user.id,
            projectId
          );
          
          if (contractorBids && contractorBids.length > 0) {
            setExistingBid(contractorBids[0]);
            setBidAmount(contractorBids[0].amount.toString());
            setBidMessage(contractorBids[0].message || '');
          }
        } catch (err: any) {
          console.error('Error fetching project details:', err);
          setError(err.message || 'Failed to load project details');
        }
      } catch (err: any) {
        console.error('Error in fetchProjectDetails:', err);
        setError(err.message || 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    }
    
    fetchProjectDetails();
  }, [projectId]);

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      toast.error('Please enter a valid bid amount');
      return;
    }
    
    if (!userId) {
      toast.error('You must be signed in to submit a bid');
      return;
    }
    
    setSubmitting(true);
    
    try {
      await ContractorService.submitBidForProject({
        contractor_id: userId,
        project_id: projectId,
        amount: parseFloat(bidAmount),
        message: bidMessage
      });
      
      toast.success(existingBid ? 'Your bid has been updated successfully!' : 'Your bid has been submitted successfully!');
      
      // Refresh the page to show updated bid status
      router.refresh();
      
      // Update the existing bid state
      setExistingBid({
        contractor_id: userId,
        project_id: projectId,
        amount: parseFloat(bidAmount),
        message: bidMessage,
        status: existingBid ? existingBid.status : 'pending'
      });
      
    } catch (error: any) {
      console.error('Error submitting bid:', error);
      toast.error(error.message || 'Failed to submit bid');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNavigateBack = () => {
    router.push('/dashboard/contractor/jobs');
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-gray-500">Loading project details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-red-50 p-6 rounded-lg text-center">
          <div className="bg-red-100 rounded-full p-4 w-16 h-16 mx-auto flex items-center justify-center mb-4">
            <span className="text-2xl text-red-500">⚠️</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">Error Loading Project</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex justify-center gap-4">
            <Button 
              variant="outline" 
              onClick={handleNavigateBack}
            >
              Back to Jobs
            </Button>
            <Button 
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-yellow-50 p-6 rounded-lg text-center">
          <div className="bg-yellow-100 rounded-full p-4 w-16 h-16 mx-auto flex items-center justify-center mb-4">
            <span className="text-2xl text-yellow-500">🔍</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">Project Not Found</h3>
          <p className="text-gray-600 mb-6">The project you're looking for doesn't exist or has been removed.</p>
          <Button 
            onClick={handleNavigateBack}
          >
            Back to Jobs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={handleNavigateBack}
          className="mb-4"
        >
          ← Back to Jobs
        </Button>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">{project.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="text-sm">
                {project.job_category_id || 'General'}
              </Badge>
              <span className="text-sm text-gray-500">
                {project.location?.city}, {project.location?.state}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge className={
              project.bid_status === 'accepting_bids' ? 'bg-green-100 text-green-800' : 
              project.bid_status === 'reviewing_bids' ? 'bg-yellow-100 text-yellow-800' : 
              'bg-gray-100 text-gray-800'
            }>
              {project.bid_status === 'accepting_bids' ? 'Accepting Bids' : 
               project.bid_status === 'reviewing_bids' ? 'Reviewing Bids' : 
               'Closed'}
            </Badge>
            
            <div className="text-sm font-medium">
              Budget: ${project.budget_min} - ${project.budget_max}
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="photos">Photos</TabsTrigger>
              {project.timeline_horizon && (
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="details" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Project Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Description</h3>
                      <p className="text-gray-700 whitespace-pre-line">{project.description}</p>
                    </div>
                    
                    <Separator />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {project.property_size && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Property Size</h4>
                          <p>{project.property_size}</p>
                        </div>
                      )}
                      
                      {project.square_footage && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Square Footage</h4>
                          <p>{project.square_footage} sq ft</p>
                        </div>
                      )}
                      
                      {project.job_type_id && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Job Type</h4>
                          <p>{project.job_type_id}</p>
                        </div>
                      )}
                      
                      {project.job_category_id && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Category</h4>
                          <p>{project.job_category_id}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="photos" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Project Photos</CardTitle>
                </CardHeader>
                <CardContent>
                  {project.media && project.media.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {project.media.map((item: any, index: number) => (
                        <div key={index} className="relative aspect-square rounded-md overflow-hidden border">
                          <Image
                            src={item.url || '/placeholder-image.jpg'}
                            alt={`Project image ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No photos available for this project</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {project.timeline_horizon && (
              <TabsContent value="timeline" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Project Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium mb-2">Timeline Horizon</h3>
                        <p className="text-gray-700">{project.timeline_horizon}</p>
                      </div>
                      
                      {project.created_at && (
                        <div>
                          <h3 className="font-medium mb-2">Posted On</h3>
                          <p className="text-gray-700">{new Date(project.created_at).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>{existingBid ? 'Your Bid' : 'Submit Your Bid'}</CardTitle>
            </CardHeader>
            <CardContent>
              {existingBid && (
                <div className="mb-4 p-3 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-700 font-medium">
                    Bid Status: {existingBid.status === 'pending' ? 'Pending Review' : 
                                existingBid.status === 'accepted' ? 'Accepted' : 
                                existingBid.status === 'rejected' ? 'Rejected' : 
                                existingBid.status}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {existingBid.status === 'pending' ? 'Your bid is being reviewed by the project owner.' : 
                     existingBid.status === 'accepted' ? 'Congratulations! Your bid has been accepted.' : 
                     existingBid.status === 'rejected' ? 'Your bid was not selected for this project.' : 
                     'Bid status is being processed.'}
                  </p>
                </div>
              )}
              
              <form onSubmit={handleSubmitBid}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="bidAmount">Bid Amount ($)</Label>
                    <Input
                      id="bidAmount"
                      type="number"
                      min="1"
                      step="0.01"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder="Enter your bid amount"
                      disabled={existingBid?.status === 'accepted' || existingBid?.status === 'rejected'}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Project budget: ${project.budget_min} - ${project.budget_max}
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="bidMessage">Message (Optional)</Label>
                    <Textarea
                      id="bidMessage"
                      value={bidMessage}
                      onChange={(e) => setBidMessage(e.target.value)}
                      placeholder="Explain why you're the right contractor for this job"
                      rows={4}
                      disabled={existingBid?.status === 'accepted' || existingBid?.status === 'rejected'}
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={
                      submitting || 
                      project.bid_status !== 'accepting_bids' || 
                      existingBid?.status === 'accepted' || 
                      existingBid?.status === 'rejected'
                    }
                  >
                    {submitting ? 'Submitting...' : 
                     existingBid ? 'Update Bid' : 'Submit Bid'}
                  </Button>
                  
                  {project.bid_status !== 'accepting_bids' && (
                    <p className="text-xs text-yellow-600 text-center mt-2">
                      This project is no longer accepting bids.
                    </p>
                  )}
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col items-start">
              <p className="text-sm text-gray-500">
                By submitting a bid, you agree to the terms and conditions of InstaBids.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}