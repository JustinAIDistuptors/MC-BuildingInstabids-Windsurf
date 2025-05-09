'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BidCardService } from '@/services/bid-card-service';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import EnhancedMessaging from '@/components/messaging/EnhancedMessaging';

interface ProjectDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

interface ExtendedBidCard {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'published' | 'archived' | 'active' | 'completed' | string;
  creator_id: string;
  created_at: string;
  updated_at?: string;
  job_type_id: string;
  job_category_id: string;
  job_size: string;
  intention_type_id: string;
  timeline_horizon_id?: string;
  timeline_start?: string;
  timeline_end?: string;
  budget_min?: number;
  budget_max?: number;
  budget?: number;
  zip_code: string;
  city?: string;
  state?: string;
  location: {
    address_line1: string;
    city: string;
    state: string;
    country?: string;
    zip_code: string;
  };
  special_requirements?: string;
  guidance_for_bidders?: string;
  group_bidding_enabled: boolean;
  visibility: 'public' | 'private' | 'group';
  max_contractor_messages?: number;
  prohibit_negotiation?: boolean;
  required_certifications?: string[];
  bid_deadline?: string;
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
  type?: string;
  service_type?: string;
  square_footage?: number;
  timeline?: string;
}

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  // Unwrap params using React.use()
  const unwrappedParams = React.use(params);
  const id = unwrappedParams.id;
  
  const router = useRouter();
  const [bidCard, setBidCard] = useState<ExtendedBidCard | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('details');

  useEffect(() => {
    async function fetchBidCard() {
      try {
        setLoading(true);
        const response = await BidCardService.getBidCard(id);
        console.log("Bid card response:", response);
        
        if (response && response.bidCard) {
          // Cast the response to ExtendedBidCard to ensure type compatibility
          setBidCard(response.bidCard as ExtendedBidCard);
        } else {
          toast({
            title: "Error",
            description: "Could not load project details. Please try again.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching bid card:", error);
        toast({
          title: "Error",
          description: "Could not load project details. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchBidCard();
  }, [id]);

  const handleDelete = async () => {
    if (!bidCard) return;
    
    if (!confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      return;
    }
    
    try {
      setDeleting(true);
      await BidCardService.deleteBidCard(id);
      
      toast({
        title: "Success",
        description: "Project deleted successfully.",
      });
      
      router.push('/dashboard/homeowner/projects');
    } catch (error) {
      console.error('Error deleting bid card:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete project. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = () => {
    if (!bidCard) return;
    router.push(`/dashboard/homeowner/projects/${bidCard.id}/edit`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-200 text-gray-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'archived':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatProjectType = (type?: string): string => {
    if (!type) return '';
    
    const typeMap: Record<string, string> = {
      'one-time': 'One-Time Project',
      'one_time': 'One-Time Project',
      'continual': 'Continual Service',
      'repair': 'Repair Service',
      'handyman': 'Handyman Service',
      'labor': 'Labor Only',
      'multi-step': 'Multi-Step Project'
    };
    
    const normalizedType = type.toLowerCase().replace(/[_-]/g, '-');
    return typeMap[normalizedType] || type.replace(/[_-]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getActualJobCategory = (options: {
    job_category_id?: string;
    service_type?: string;
    job_type_id?: string;
    type?: string;
  }): string => {
    const { job_category_id, service_type, job_type_id, type } = options;
    
    // Hard-coded job categories based on job_category_id
    const jobCategoryMap: Record<string, string> = {
      // Specific job categories
      'roof-install': 'Roofing',
      'fence-building': 'Fencing',
      'driveway-paving': 'Paving',
      'deck-construction': 'Decking',
      'painting-exterior': 'Painting',
      'plumbing-repair': 'Plumbing',
      'electrical-repair': 'Electrical',
      'roof-repair': 'Roofing',
      'bathroom-remodel': 'Bathroom',
      
      // Project types mapped to categories
      'one-time': 'General Contracting',
      'one_time': 'General Contracting',
      'continual': 'Maintenance Services',
      'repair': 'Repair Services',
      'handyman': 'Handyman Services',
      'labor': 'Labor Services',
      'multi-step': 'Construction'
    };
    
    // Check each field in order of priority
    if (job_category_id) {
      const normalizedCategoryId = job_category_id.toLowerCase().replace(/[_-]/g, '-');
      if (jobCategoryMap[normalizedCategoryId]) {
        return jobCategoryMap[normalizedCategoryId];
      }
      
      // Format the job_category_id if not in our map
      return job_category_id.replace(/[_-]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    
    if (service_type) {
      const normalizedServiceType = service_type.toLowerCase().replace(/[_-]/g, '-');
      if (jobCategoryMap[normalizedServiceType]) {
        return jobCategoryMap[normalizedServiceType];
      }
    }
    
    if (job_type_id) {
      const normalizedJobTypeId = job_type_id.toLowerCase().replace(/[_-]/g, '-');
      if (jobCategoryMap[normalizedJobTypeId]) {
        return jobCategoryMap[normalizedJobTypeId];
      }
    }
    
    if (type) {
      const normalizedType = type.toLowerCase().replace(/[_-]/g, '-');
      if (jobCategoryMap[normalizedType]) {
        return jobCategoryMap[normalizedType];
      }
    }
    
    return 'Home Improvement';
  };

  const formatTimelineHorizon = (timeline_horizon_id?: string): string => {
    if (!timeline_horizon_id) return '';
    
    const horizonMap: Record<string, string> = {
      'asap': 'As Soon As Possible',
      '2-weeks': 'Within 2 Weeks',
      '1-month': 'Within 1 Month',
      '3-months': 'Within 3 Months',
      'custom': 'Custom Timeline',
    };
    
    const normalizedHorizonId = timeline_horizon_id.toLowerCase().replace(/[_-]/g, '-');
    return horizonMap[normalizedHorizonId] || timeline_horizon_id.replace(/[_-]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!bidCard) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Project Not Found</h2>
        <p className="text-gray-500 mb-6">The project you're looking for doesn't exist or you don't have permission to view it.</p>
        <Button onClick={() => router.push('/dashboard/homeowner/projects')}>
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">{bidCard.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={getStatusColor(bidCard.status)}>
              {bidCard.status === 'active' ? 'Active' : bidCard.status}
            </Badge>
            <span className="text-sm text-gray-500">
              Created {formatDate(bidCard.created_at)}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleEdit}>
            Edit Project
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Delete
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="details">Project Details</TabsTrigger>
          <TabsTrigger value="messaging">Messaging</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Project Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Project Type</h3>
                    <p>{bidCard.job_types?.display_name || 
                       formatProjectType(bidCard.job_type_id) || 
                       formatProjectType(bidCard.type) || 
                       'Not specified'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Category</h3>
                    <p>{bidCard.job_categories?.display_name || 
                       getActualJobCategory({
                         job_category_id: bidCard.job_category_id || undefined,
                         service_type: bidCard.service_type,
                         job_type_id: bidCard.job_type_id || undefined,
                         type: bidCard.type
                       }) || 
                       'Not specified'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Size</h3>
                    <p className="capitalize">
                      {bidCard.job_size || 'Medium'}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Timeline</h3>
                    <p>{bidCard.timeline_horizons?.display_name || 
                       formatTimelineHorizon(bidCard.timeline_horizon_id) ||
                       bidCard.timeline || 
                       'Not specified'}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
                  <p className="whitespace-pre-line">{bidCard.description || 'No description provided.'}</p>
                </div>
                
                {bidCard.special_requirements && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Special Requirements</h3>
                    <p className="whitespace-pre-line">{bidCard.special_requirements}</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Timeframe</h3>
                    <p>{bidCard.timeline_horizons?.display_name || 'Not specified'}</p>
                  </div>
                  {bidCard.timeline_start && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Start Date</h3>
                      <p>{formatDate(bidCard.timeline_start)}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Location</CardTitle>
                </CardHeader>
                <CardContent>
                  {bidCard.city && bidCard.state ? (
                    <p>{bidCard.city}, {bidCard.state}</p>
                  ) : (
                    <p>Location not specified</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
          
          {bidCard.media && bidCard.media.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Project Media</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {bidCard.media.map((item, index) => (
                    <div key={item.id || index} className="relative aspect-square rounded-md overflow-hidden border">
                      {item.url ? (
                        <img
                          src={item.url}
                          alt={`Project image ${index + 1}`}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full bg-gray-100 text-gray-400">
                          No preview
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="messaging">
          <Card>
            <CardHeader>
              <CardTitle>Project Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <EnhancedMessaging projectId={bidCard.id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
