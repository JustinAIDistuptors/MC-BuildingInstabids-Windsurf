'use client';

import React from 'react';
import { BidCard, MOCK_JOB_CATEGORIES, MOCK_JOB_TYPES, MOCK_INTENTION_TYPES, MOCK_TIMELINE_HORIZONS } from '@/types/bidding';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

interface ReviewSubmitStepProps {
  data: BidCard;
  mediaFiles: File[];
}

/**
 * Step 6: Review & Submit
 * 
 * This step shows a summary of all the information entered in the previous steps
 * for final review before submission.
 */
export default function ReviewSubmitStep({
  data,
  mediaFiles
}: ReviewSubmitStepProps) {
  // Find selected job category
  const selectedCategory = MOCK_JOB_CATEGORIES.find(
    category => category.id === data.job_category_id
  );
  
  // Find selected job type
  const selectedJobType = MOCK_JOB_TYPES.find(
    jobType => jobType.id === data.job_type_id
  );
  
  // Find selected intention type
  const selectedIntentionType = MOCK_INTENTION_TYPES.find(
    intentionType => intentionType.id === data.intention_type_id
  );
  
  // Find selected timeline horizon
  const selectedTimelineHorizon = MOCK_TIMELINE_HORIZONS.find(
    horizon => horizon.id === data.timeline_horizon_id
  );
  
  // Format currency
  const formatCurrency = (value?: number): string => {
    if (value === undefined) return 'Not specified';
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };
  
  // Format date
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Determine image and document counts
  const imageFiles = mediaFiles.filter(file => file.type.startsWith('image/'));
  const documentFiles = mediaFiles.filter(file => !file.type.startsWith('image/'));

  return (
    <div className="space-y-6 py-4">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Review & Submit</h2>
        <p className="text-muted-foreground">
          Review all your bid request details before submitting.
        </p>
      </div>

      {/* Summary Overview */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">{data.title || 'Untitled Project'}</h3>
            <Badge variant={data.group_bidding_enabled ? "default" : "outline"}>
              {data.group_bidding_enabled ? 'Group Bidding Enabled' : 'Individual Bids Only'}
            </Badge>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {selectedCategory && (
              <Badge variant="secondary">{selectedCategory.display_name}</Badge>
            )}
            {selectedJobType && (
              <Badge variant="secondary">{selectedJobType.display_name}</Badge>
            )}
            {selectedIntentionType && (
              <Badge variant="secondary">{selectedIntentionType.display_name}</Badge>
            )}
            <Badge variant="secondary">Size: {data.job_size}</Badge>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Budget Range</h4>
              <p>{formatCurrency(data.budget_min)} - {formatCurrency(data.budget_max)}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Timeline</h4>
              <p>{selectedTimelineHorizon?.display_name || 'Not specified'}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Bid Deadline</h4>
              <p>{formatDate(data.bid_deadline)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Classification Section */}
      <SectionCard 
        title="Project Classification"
        items={[
          { label: 'Job Category', value: selectedCategory?.display_name || 'Not selected' },
          { label: 'Job Type', value: selectedJobType?.display_name || 'Not selected' },
          { label: 'Project Type', value: selectedIntentionType?.display_name || 'Not selected' },
          { label: 'Job Size', value: data.job_size }
        ]}
      />

      {/* Project Details Section */}
      <SectionCard 
        title="Project Details"
        items={[
          { 
            label: 'Description',
            value: data.description || 'No description provided',
            isLongText: true
          },
          {
            label: 'Guidance for Bidders',
            value: data.guidance_for_bidders || 'No guidance provided',
            isLongText: true
          }
        ]}
      />

      {/* Location & Timeline Section */}
      <SectionCard 
        title="Location & Timeline"
        items={[
          { 
            label: 'Address',
            value: data.location ? 
              `${data.location.address_line1}${data.location.address_line2 ? ', ' + data.location.address_line2 : ''}, ${data.location.city}, ${data.location.state} ${data.zip_code}` : 
              'No address provided'
          },
          { label: 'Start Date', value: formatDate(data.timeline_start) },
          { label: 'Target Completion', value: formatDate(data.timeline_end) },
          { label: 'Timeline Priority', value: selectedTimelineHorizon?.display_name || 'Not specified' }
        ]}
      />

      {/* Budget & Bidding Section */}
      <SectionCard 
        title="Budget & Bidding"
        items={[
          { label: 'Minimum Budget', value: formatCurrency(data.budget_min) },
          { label: 'Maximum Budget', value: formatCurrency(data.budget_max) },
          { label: 'Bid Deadline', value: formatDate(data.bid_deadline) },
          { label: 'Price Negotiation', value: data.prohibit_negotiation ? 'Not allowed' : 'Allowed' },
          { label: 'Group Bidding', value: data.group_bidding_enabled ? 'Enabled' : 'Disabled' },
          { label: 'Maximum Contractor Messages', value: data.max_contractor_messages?.toString() || '5' },
          { label: 'Project Visibility', value: data.visibility === 'public' ? 'Public' : data.visibility === 'private' ? 'Private' : 'Group' }
        ]}
      />

      {/* Media Section */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Media Attachments</h3>
            <div className="flex gap-3">
              <Badge variant={imageFiles.length > 0 ? "default" : "outline"}>
                {imageFiles.length} Photos
              </Badge>
              <Badge variant={documentFiles.length > 0 ? "default" : "outline"}>
                {documentFiles.length} Documents
              </Badge>
            </div>
          </div>
          
          {imageFiles.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Photos</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {imageFiles.slice(0, 6).map((file, index) => (
                  <div key={index} className="relative aspect-square rounded-md overflow-hidden">
                    <Image
                      src={URL.createObjectURL(file)}
                      alt={`Project photo ${index + 1}`}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                ))}
                {imageFiles.length > 6 && (
                  <div className="relative aspect-square rounded-md bg-muted flex items-center justify-center">
                    <span className="text-muted-foreground">+{imageFiles.length - 6} more</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {documentFiles.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Documents</h4>
              <div className="space-y-2">
                {documentFiles.slice(0, 3).map((file, index) => (
                  <div key={index} className="flex items-center p-2 border rounded-md">
                    <span className="truncate">{file.name}</span>
                  </div>
                ))}
                {documentFiles.length > 3 && (
                  <div className="text-sm text-muted-foreground">
                    +{documentFiles.length - 3} more documents
                  </div>
                )}
              </div>
            </div>
          )}
          
          {mediaFiles.length === 0 && (
            <div className="text-center py-4">
              <p className="text-muted-foreground">No media files uploaded</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Final Checklist */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Final Checklist</h3>
          
          <div className="space-y-3">
            <ChecklistItem 
              checked={!!data.title && data.title.length >= 5} 
              label="Project has a descriptive title"
            />
            <ChecklistItem 
              checked={!!data.description && data.description.length >= 20} 
              label="Project has a detailed description" 
            />
            <ChecklistItem 
              checked={!!data.job_category_id && !!data.job_type_id} 
              label="Project is properly categorized" 
            />
            <ChecklistItem 
              checked={!!data.location?.address_line1 && !!data.location?.city && !!data.location?.state && !!data.zip_code} 
              label="Location information is complete" 
            />
            <ChecklistItem 
              checked={data.budget_min !== undefined && data.budget_max !== undefined} 
              label="Budget range is specified" 
            />
            <ChecklistItem 
              checked={!!data.bid_deadline} 
              label="Bid deadline is set" 
            />
            <ChecklistItem 
              checked={mediaFiles.length > 0} 
              label="Project has media files attached" 
              required={false}
            />
          </div>
          
          <div className="mt-6 text-sm text-muted-foreground">
            <p>
              After submitting, contractors will be able to view your project and submit bids.
              You will be notified when new bids are received.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Section Card Component
 */
interface SectionCardProps {
  title: string;
  items: {
    label: string;
    value: string;
    isLongText?: boolean;
  }[];
}

function SectionCard({ title, items }: SectionCardProps) {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className={item.isLongText ? "space-y-1" : "grid grid-cols-2"}>
              <h4 className="text-sm font-medium text-muted-foreground">{item.label}</h4>
              {item.isLongText ? (
                <p className="text-sm whitespace-pre-line">{item.value}</p>
              ) : (
                <p>{item.value}</p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Checklist Item Component
 */
interface ChecklistItemProps {
  checked: boolean;
  label: string;
  required?: boolean;
}

function ChecklistItem({ checked, label, required = true }: ChecklistItemProps) {
  return (
    <div className="flex items-center gap-2">
      <div className={`flex-shrink-0 rounded-full ${checked ? 'text-green-500' : 'text-muted-foreground'}`}>
        <CheckCircle2 className={`h-5 w-5 ${checked ? 'opacity-100' : 'opacity-50'}`} />
      </div>
      <span className={`${checked ? '' : 'text-muted-foreground'}`}>
        {label} {required && !checked && <span className="text-red-500">*</span>}
      </span>
    </div>
  );
}
