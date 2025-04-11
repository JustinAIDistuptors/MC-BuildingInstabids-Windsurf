'use client';

import React from 'react';
import Link from 'next/link';
import { getProjectTypePlaceholder, formatProjectType, getJobCategory, formatTimelineHorizon } from '@/utils/project-images';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Helper function to format location for display
export const formatLocation = (location: any): string => {
  if (!location) return 'Not specified';
  
  if (typeof location === 'object') {
    const city = location.city || '';
    const state = location.state || '';
    const zip = location.zip_code || '';
    
    if (!city && !state && !zip) return 'Not specified';
    
    return [
      city,
      state ? (city ? `, ${state}` : state) : '',
      zip ? ` ${zip}` : ''
    ].join('');
  }
  
  return location;
};

// Status badge component
export const StatusBadge = ({ status }: { status: string }) => {
  const statusMap: Record<string, { color: string, label: string }> = {
    'published': { color: 'bg-blue-100 text-blue-800', label: 'Published' },
    'draft': { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
    'archived': { color: 'bg-yellow-100 text-yellow-800', label: 'Archived' },
    'accepting_bids': { color: 'bg-green-100 text-green-800', label: 'Accepting Bids' },
    'in_progress': { color: 'bg-purple-100 text-purple-800', label: 'In Progress' },
    'completed': { color: 'bg-teal-100 text-teal-800', label: 'Completed' },
    'active': { color: 'bg-blue-100 text-blue-800', label: 'Active' }
  };
  
  const { color, label } = statusMap[status] || { color: 'bg-gray-100 text-gray-800', label: 'Unknown' };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  );
};

// Helper function to get a generic placeholder image based on job category
const getGenericPlaceholder = (project: any): string => {
  // Map job categories to generic placeholder images
  const categoryToImage: Record<string, string> = {
    'Roofing': '/placeholders/construction.svg',
    'Plumbing': '/placeholders/construction.svg',
    'Electrical': '/placeholders/construction.svg',
    'Painting': '/placeholders/renovation.svg',
    'Flooring': '/placeholders/renovation.svg',
    'Landscaping': '/placeholders/lawn-care.svg',
    'Outdoor': '/placeholders/lawn-care.svg',
    'Home Improvement': '/placeholders/renovation.svg',
    'Construction': '/placeholders/construction.svg',
    'Repair Services': '/placeholders/construction.svg',
    'Maintenance Services': '/placeholders/lawn-care.svg',
    'Handyman Services': '/placeholders/construction.svg',
    'Labor Services': '/placeholders/construction.svg',
    'Cleaning': '/placeholders/default-project.svg',
    'HVAC': '/placeholders/construction.svg',
  };
  
  // Get the job category
  const category = getActualJobCategory(project);
  
  // Return the matching placeholder or a default
  return categoryToImage[category] || '/placeholders/default-project.svg';
};

interface ProjectCardProps {
  project: any;
  onViewDetails?: (project: any) => void;
  onDelete?: (id: string) => void;
  onShare?: (project: any) => void;
  showDeleteButton?: boolean;
  showShareButton?: boolean;
  linkToDetails?: boolean;
  className?: string;
  imageUrl?: string;
  usePlaceholder?: boolean;
}

// Helper functions for consistent display
const getActualJobCategory = (project: any): string => {
  // Hard-coded job categories based on job_category_id
  const jobCategoryMap: Record<string, string> = {
    // Specific job categories
    'roof-install': 'Roofing',
    'fence-building': 'Fencing',
    'driveway-paving': 'Paving',
    'deck-construction': 'Decking',
    'painting-exterior': 'Painting',
    'siding-installation': 'Siding',
    'gutter-installation': 'Gutters',
    'landscaping-project': 'Landscaping',
    'patio-installation': 'Outdoor Construction',
    'concrete-work': 'Concrete',
    'insulation-install': 'Insulation',
    'window-installation': 'Windows & Doors',
    'door-installation': 'Windows & Doors',
    'garage-door-install': 'Garage',
    'solar-panel-install': 'Solar',
    'flooring-installation': 'Flooring',
    'tile-installation': 'Tiling',
    'kitchen-countertop': 'Kitchen',
    'bathroom-remodel': 'Bathroom',
    'basement-finishing': 'Basement',
    'outdoor-lighting': 'Outdoor Lighting',
    'sprinkler-system': 'Irrigation',
    'tree-removal': 'Tree Service',
    'wallpaper-hanging': 'Interior Decor',
    'shed-construction': 'Outdoor Construction',
    'generator-install': 'Electrical',
    'chimney-construction': 'Masonry',
    'water-heater-install': 'Plumbing',
    'security-system': 'Security',
    'window-repair': 'Window Repair',
    'plumbing-repair': 'Plumbing',
    'electrical-repair': 'Electrical',
    'roof-repair': 'Roofing',
    'pool-cleaning': 'Pool Services',
    'lawn-maintenance': 'Lawn Care',
    'house-cleaning': 'Cleaning Services',
    
    // Project types should NOT be categories
    'one-time': 'General Contracting',
    'one_time': 'General Contracting',
    'continual': 'Maintenance Services',
    'repair': 'Repair Services',
    'handyman': 'Handyman Services',
    'labor': 'Labor Services',
    'multi-step': 'Construction'
  };
  
  // First check if we have a direct match in our job category map
  const normalizedCategoryId = project.job_category_id ? 
    project.job_category_id.toLowerCase().replace(/[_-]/g, '-') : '';
    
  if (normalizedCategoryId && jobCategoryMap[normalizedCategoryId]) {
    return jobCategoryMap[normalizedCategoryId];
  }
  
  // Check for category in service_type
  const normalizedServiceType = project.service_type ? 
    project.service_type.toLowerCase().replace(/[_-]/g, '-') : '';
    
  if (normalizedServiceType && jobCategoryMap[normalizedServiceType]) {
    return jobCategoryMap[normalizedServiceType];
  }
  
  // If we have a job_category_id but no match in our map, format it for display
  if (project.job_category_id) {
    return project.job_category_id
      .replace(/[-_]/g, ' ')
      .split(' ')
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  // Check if we have a project type that maps to a category
  const normalizedJobTypeId = project.job_type_id ? 
    project.job_type_id.toLowerCase().replace(/[_-]/g, '-') : '';
  
  if (normalizedJobTypeId && jobCategoryMap[normalizedJobTypeId]) {
    return jobCategoryMap[normalizedJobTypeId];
  }
  
  // Check type field
  const normalizedType = project.type ? 
    project.type.toLowerCase().replace(/[_-]/g, '-') : '';
  
  if (normalizedType && jobCategoryMap[normalizedType]) {
    return jobCategoryMap[normalizedType];
  }
  
  // Last resort - use a generic category based on what we have
  return 'Home Improvement';
};

const getProjectType = (project: any): string => {
  // Project type labels
  const projectTypeLabels: Record<string, string> = {
    'one-time': 'One-Time Project',
    'one_time': 'One-Time Project',
    'continual': 'Continual Service',
    'repair': 'Repair Service',
    'handyman': 'Handyman Service',
    'labor': 'Labor Only',
    'multi-step': 'Multi-Step Project'
  };
  
  // First check job_type_id which should contain the project type
  if (project.job_type_id) {
    const normalizedType = project.job_type_id.toLowerCase().replace('_', '-');
    if (projectTypeLabels[normalizedType]) {
      return projectTypeLabels[normalizedType];
    }
  }
  
  // Then check type field
  if (project.type) {
    const normalizedType = project.type.toLowerCase().replace('_', '-');
    if (projectTypeLabels[normalizedType]) {
      return projectTypeLabels[normalizedType];
    }
  }
  
  // If we have service_type, use that
  if (project.service_type) {
    return formatProjectType(project.service_type);
  }
  
  // Default
  return 'General Project';
};

export default function ProjectCard({ 
  project, 
  onViewDetails, 
  onDelete, 
  onShare,
  showDeleteButton = true,
  showShareButton = true,
  linkToDetails = false,
  className = '',
  imageUrl,
  usePlaceholder = true
}: ProjectCardProps) {
  // Determine the effective status for display
  const effectiveStatus = project.bid_status || project.status || 'draft';
  
  // Handle view details click
  const handleViewDetails = (e: React.MouseEvent) => {
    if (onViewDetails) {
      onViewDetails(project);
    }
  };
  
  // Handle delete click
  const handleDelete = async (e: React.MouseEvent) => {
    // Stop event propagation
    e.stopPropagation();
    e.preventDefault();
    
    // Confirm deletion
    if (window.confirm(`Are you sure you want to delete "${project.title}"?`)) {
      console.log('Delete confirmed for project:', project.id);
      
      try {
        // First, delete all media associated with this project
        const { data: mediaData, error: mediaError } = await supabase
          .from('project_media')
          .select('*')
          .eq('project_id', project.id);
        
        if (!mediaError && mediaData && mediaData.length > 0) {
          console.log('Deleting media files from storage:', mediaData.length, 'files');
          
          // Delete each media item from storage
          for (const media of mediaData) {
            const fileName = media.file_name;
            const { error: storageError } = await supabase.storage
              .from('projectmedia')
              .remove([`${project.id}/${fileName}`]);
            
            if (storageError) {
              console.error('Error deleting media from storage:', storageError);
            }
          }
          
          // Delete media records from database
          const { error: mediaDeleteError } = await supabase
            .from('project_media')
            .delete()
            .eq('project_id', project.id);
          
          if (mediaDeleteError) {
            console.error('Error deleting media records:', mediaDeleteError);
          }
        }
        
        // Delete the project from Supabase
        const { error: projectDeleteError } = await supabase
          .from('projects')
          .delete()
          .eq('id', project.id);
        
        if (projectDeleteError) {
          throw projectDeleteError;
        }
        
        console.log('Project deleted successfully from Supabase');
        
        // If onDelete handler exists, call it
        if (onDelete) {
          onDelete(project.id);
        }
        
        // Force a hard refresh of the page
        window.location.href = window.location.href;
      } catch (error) {
        console.error('Error deleting project:', error);
        alert('Failed to delete project. Please try again.');
      }
    }
  };
  
  // Handle share click
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    console.log('Share button clicked for project:', project.id);
    
    if (onShare) {
      onShare(project);
    } else {
      // Default share behavior - navigate to share page
      window.location.href = `/shared-project/${project.id}`;
    }
  };
  
  // Determine the details button/link
  const DetailsButton = () => {
    const buttonContent = (
      <div className="inline-flex items-center px-3 py-2 border border-blue-600 text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        View Details
      </div>
    );
    
    if (linkToDetails) {
      return (
        <Link href={`/dashboard/homeowner/projects/${project.id}`}>
          {buttonContent}
        </Link>
      );
    }
    
    return (
      <button onClick={handleViewDetails}>
        {buttonContent}
      </button>
    );
  };
  
  // Get image URL or use placeholder
  let projectImageUrl = imageUrl || project.imageUrl;
  
  // Use type-based placeholder if requested or if no image URL is available
  if (usePlaceholder || !projectImageUrl) {
    // Always use a placeholder image for now
    projectImageUrl = getGenericPlaceholder(project);
  }
  
  // Handle image error
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.onerror = null;
    target.src = '/placeholders/default-project.svg';
  };
  
  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 ${className}`}>
      {/* Status Badge - Positioned over the image */}
      <div className="relative">
        {/* Project Image */}
        <div className="h-40 bg-gray-200 relative overflow-hidden">
          <div className="relative w-full h-full">
            <img 
              src={projectImageUrl}
              alt={project.title || "Project image"}
              className="w-full h-full object-cover"
              onError={handleImageError}
            />
          </div>
        </div>
        
        {/* Status Badge - Positioned at the top left of the image */}
        <div className="absolute top-2 left-2">
          <StatusBadge status={effectiveStatus} />
        </div>
        
        {/* Indicators for media and bids - Positioned at top right */}
        <div className="absolute top-2 right-2 flex gap-1">
          {project.hasMedia && (
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          {project.bid_count > 0 && (
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-50 text-green-600">
              <span className="text-xs font-medium">{project.bid_count}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Card Content */}
      <div className="p-4">
        {/* Job Category - Top Position */}
        <h3 className="text-xl font-bold text-gray-900 mb-1">
          {getActualJobCategory(project)}
        </h3>
        
        {/* Project Type */}
        <div className="text-md font-medium text-blue-600 mb-3">
          {getProjectType(project)}
        </div>
        
        {/* Project Title */}
        <div className="text-lg font-semibold text-gray-800 mb-1 line-clamp-1">
          {project.title || 'Untitled Project'}
        </div>
        
        {/* Project Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {project.description || 'No description provided'}
        </p>
        
        {/* Timeline and Zip Code */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm mb-4">
          <div>
            <div className="text-gray-500 text-xs mb-1">Timeline</div>
            <div className="font-medium">
              {project.timeline || 
               (project.timeline_horizon_id ? formatTimelineHorizon(project.timeline_horizon_id) : 'Not specified')}
            </div>
          </div>
          <div>
            <div className="text-gray-500 text-xs mb-1">Location</div>
            <div className="font-medium">
              {project.zip_code || 
               (project.location && typeof project.location === 'string' && 
                JSON.parse(project.location).zip_code) || 
               'Not specified'}
            </div>
          </div>
          
          {/* Project Size */}
          <div>
            <div className="text-gray-500 text-xs mb-1">Project Size</div>
            <div className="font-medium capitalize">
              {project.job_size || 'Medium'}
            </div>
          </div>
          
          {/* Property Size (if available) */}
          {(project.square_footage || project.property_size) && (
            <div>
              <div className="text-gray-500 text-xs mb-1">Property Size</div>
              <div className="font-medium">
                {project.square_footage ? `${project.square_footage} sq ft` : project.property_size || 'Not specified'}
              </div>
            </div>
          )}
        </div>
        
        {/* Thumbnail Gallery */}
        {project.media && project.media.length > 0 && (
          <div className="mt-2 mb-3 flex gap-1 overflow-x-auto pb-1">
            {project.media.slice(0, 4).map((item: any, index: number) => (
              <div key={item.id} className="w-14 h-14 flex-shrink-0 rounded overflow-hidden border border-gray-200">
                <img 
                  src={item.media_url} 
                  alt={`Project image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            {project.media.length > 4 && (
              <div className="w-14 h-14 flex-shrink-0 rounded bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-medium border border-gray-200">
                +{project.media.length - 4}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Card Footer */}
      <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
        <DetailsButton />
        
        <div className="flex gap-2">
          {showShareButton && (
            <button 
              onClick={handleShare}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>
          )}
          
          {showDeleteButton && onDelete && (
            <button 
              onClick={handleDelete}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
