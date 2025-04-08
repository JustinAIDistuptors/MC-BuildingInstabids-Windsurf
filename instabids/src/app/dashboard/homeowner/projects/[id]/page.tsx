'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { BidCard } from '@/types/bidding';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BidCardService } from '@/services/bid-card-service';
import { toast } from '@/components/ui/use-toast';
import { Toaster } from '@/components/ui/toaster';

interface ProjectDetailPageProps {
  params: {
    id: string;
  };
}

interface ExtendedBidCard extends BidCard {
  job_categories?: {
    name: string;
    display_name: string;
  };
  job_types?: {
    name: string;
    display_name: string;
  };
  timeline_horizons?: {
    name: string;
    display_name: string;
  };
  project_intention_types?: {
    name: string;
    display_name: string;
  };
  media?: Array<{
    id?: string;
    media_type: string;
    file_path?: string;
    file_name?: string;
    content_type?: string;
    size_bytes?: number;
    url?: string;
  }>;
  budget?: number;
  start_date?: string;
  requirements?: string;
  special_requirements?: string;
  budget_min?: number;
  budget_max?: number;
  timeline_start?: string;
  city?: string;
  state?: string;
}

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const id = params.id;
  const router = useRouter();
  const [bidCard, setBidCard] = useState<ExtendedBidCard | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [deleting, setDeleting] = useState<boolean>(false);

  useEffect(() => {
    async function fetchBidCard() {
      try {
        setLoading(true);
        const response = await BidCardService.getBidCard(id);
        console.log("Bid card response:", response);
        setBidCard(response.bidCard);
      } catch (error) {
        console.error('Error fetching bid card:', error);
        toast({
          title: 'Error',
          description: 'Failed to load project details. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchBidCard();
    }
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      setDeleting(true);
      await BidCardService.deleteBidCard(id);
      
      toast({
        title: 'Project deleted',
        description: 'Your project has been successfully deleted.',
      });
      
      router.push('/dashboard/homeowner/projects');
    } catch (error) {
      console.error('Error deleting bid card:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete the project. Please try again.',
        variant: 'destructive',
      });
      setDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 flex justify-center items-center h-64">
        <div className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!bidCard) {
    return (
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <Link href="/dashboard/homeowner/projects">
            <Button variant="outline">
              Back to Projects
            </Button>
          </Link>
        </div>
        
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Project not found</h3>
          <p className="text-gray-500 mb-4">
            The project you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Link href="/dashboard/homeowner/projects">
            <Button>Go to My Projects</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex justify-between items-center">
        <Link href="/dashboard/homeowner/projects">
          <Button variant="outline">
            Back to Projects
          </Button>
        </Link>
        
        <div className="flex space-x-2">
          <Link href={`/dashboard/homeowner/projects/${bidCard.id}/edit`}>
            <Button variant="outline">
              Edit Project
            </Button>
          </Link>
          
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <div className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <></>
            )}
            Delete
          </Button>
        </div>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{bidCard.title}</CardTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                {bidCard.job_categories && (
                  <Badge>
                    {bidCard.job_categories.display_name || bidCard.job_categories.name}
                  </Badge>
                )}
                {bidCard.job_types && (
                  <Badge>
                    {bidCard.job_types.display_name || bidCard.job_types.name}
                  </Badge>
                )}
                <Badge className={getStatusColor(bidCard.status || 'draft')}>
                  {bidCard.status ? bidCard.status.charAt(0).toUpperCase() + bidCard.status.slice(1) : 'Draft'}
                </Badge>
              </div>
            </div>
            
            <div className="text-right text-sm text-gray-500">
              <p>Created: {bidCard.created_at ? new Date(bidCard.created_at).toLocaleDateString() : 'Unknown'}</p>
              {bidCard.updated_at && bidCard.updated_at !== bidCard.created_at && (
                <p>Updated: {new Date(bidCard.updated_at).toLocaleDateString()}</p>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-2">
              <h3 className="text-lg font-medium mb-2">Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap mb-6">
                {bidCard.description || 'No description provided.'}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-start">
                  <div>
                    <h4 className="font-medium">Location</h4>
                    <p className="text-gray-700">
                      {bidCard.location && typeof bidCard.location === 'object' && 'address_line1' in bidCard.location 
                        ? `${bidCard.location.address_line1}, ${bidCard.location.city}, ${bidCard.location.state}`
                        : bidCard.location && typeof bidCard.location === 'string'
                          ? bidCard.location
                          : bidCard.city && bidCard.state
                            ? `${bidCard.city}, ${bidCard.state}`
                            : 'Not specified'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div>
                    <h4 className="font-medium">Budget</h4>
                    <p className="text-gray-700">
                      {bidCard.budget_min || bidCard.budget_max 
                        ? `$${bidCard.budget_min?.toLocaleString() || 0} - $${bidCard.budget_max?.toLocaleString() || 0}` 
                        : (bidCard.budget ? `$${bidCard.budget.toLocaleString()}` : 'Not specified')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div>
                    <h4 className="font-medium">Start Date</h4>
                    <p className="text-gray-700">
                      {bidCard.timeline_start 
                        ? new Date(bidCard.timeline_start).toLocaleDateString() 
                        : (bidCard.start_date ? new Date(bidCard.start_date).toLocaleDateString() : 'Not specified')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div>
                    <h4 className="font-medium">Timeline</h4>
                    <p className="text-gray-700">
                      {bidCard.timeline_horizons 
                        ? (bidCard.timeline_horizons.display_name || bidCard.timeline_horizons.name) 
                        : (bidCard.timeline_horizon_id ? bidCard.timeline_horizon_id : 'Not specified')}
                    </p>
                  </div>
                </div>
              </div>
              
              {(bidCard.requirements || bidCard.special_requirements) && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">Special Requirements</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {bidCard.requirements || bidCard.special_requirements}
                  </p>
                </div>
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-3">Project Images & Documents</h3>
              
              {!bidCard.media || bidCard.media.length === 0 ? (
                <p className="text-gray-500 italic">No images or documents attached</p>
              ) : (
                <div className="space-y-4">
                  {bidCard.media
                    .filter(item => item.media_type === 'photo' && item.url)
                    .map((item, index) => (
                      <div key={item.id || index} className="relative h-40 rounded-md overflow-hidden">
                        <Image 
                          src={item.url!}
                          alt={item.file_name || `Project image ${index + 1}`}
                          fill
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                    ))}
                  
                  {bidCard.media
                    .filter(item => item.media_type !== 'photo' && item.url)
                    .map((item, index) => (
                      <div key={item.id || index} className="flex items-center p-3 border rounded-md">
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium">{item.file_name}</p>
                          <p className="text-xs text-gray-500">
                            {(item.size_bytes && item.size_bytes > 1024) 
                              ? `${Math.round(item.size_bytes / 1024)} KB` 
                              : `${item.size_bytes || 0} bytes`}
                          </p>
                        </div>
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="ml-2 text-sm text-blue-600 hover:underline"
                        >
                          View
                        </a>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bids & Contractor Responses</CardTitle>
          <CardDescription>View and manage contractor responses to your project</CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No bids received yet</p>
            {bidCard.status !== 'published' && (
              <Button>Publish Project to Receive Bids</Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Toaster />
    </div>
  );
}
