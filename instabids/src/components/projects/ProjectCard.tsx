'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { getProjectTypePlaceholder, formatProjectType, getJobCategory, formatTimelineHorizon } from '@/utils/project-images';
import { createClient } from '@supabase/supabase-js';
import ProjectMediaGallery from './ProjectMediaGallery';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Helper function to format location for display
export const formatLocation = (location: any): string => {
  // Check if location is a string that looks like JSON
  if (typeof location === 'string' && (location.startsWith('{') || location.includes('address_line1'))) {
    try {
      // Try to parse it as JSON
      const parsedLocation = JSON.parse(location);
      
      // Extract city and state if available
      if (parsedLocation.city && parsedLocation.state) {
        return `${parsedLocation.city}, ${parsedLocation.state}`;
      }
      
      // If we have zip code
      if (parsedLocation.zip_code) {
        return parsedLocation.zip_code;
      }
      
      // If we have address lines
      if (parsedLocation.address_line1) {
        return parsedLocation.address_line1;
      }
    } catch (e) {
      // If parsing fails, just return the original string or a fallback
      return location || 'Location not specified';
    }
  }
  
  // If location is an object with city and state
  if (location && typeof location === 'object') {
    if (location.city && location.state) {
      return `${location.city}, ${location.state}`;
    }
    
    if (location.zip_code) {
      return location.zip_code;
    }
    
    if (location.address_line1) {
      return location.address_line1;
    }
  }
  
  // If it's just a string (not JSON), return it directly
  if (typeof location === 'string') {
    return location;
  }
  
  // Default fallback
  return 'Location not specified';
};

// Status badge component
export const StatusBadge = ({ status }: { status: string }) => {
  const statusMap: Record<string, { color: string, label: string, icon: React.ReactNode }> = {
    'published': { 
      color: 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-200', 
      label: 'Published',
      icon: (
        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    'draft': { 
      color: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-200', 
      label: 'Draft',
      icon: (
        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      )
    },
    'archived': { 
      color: 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-200', 
      label: 'Archived',
      icon: (
        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      )
    },
    'in_progress': { 
      color: 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border border-purple-200', 
      label: 'In Progress',
      icon: (
        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    'completed': { 
      color: 'bg-gradient-to-r from-teal-100 to-teal-200 text-teal-800 border border-teal-200', 
      label: 'Completed',
      icon: (
        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )
    },
    'accepting_bids': { 
      color: 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-200', 
      label: 'Accepting Bids',
      icon: (
        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    'active': { 
      color: 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-200', 
      label: 'Active',
      icon: (
        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    }
  };
  
  const { color, label, icon } = statusMap[status] || { 
    color: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-200', 
    label: 'Unknown',
    icon: (
      <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium shadow-sm backdrop-blur-sm ${color} transition-all duration-300 hover:scale-105`}>
      {icon}
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
  onShare?: (project: any, shareableLink: string) => void;
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
    // Stop event propagation
    e.stopPropagation();
    e.preventDefault();
    
    // Generate a shareable link
    const shareableLink = `${window.location.origin}/projects/share/${project.id}`;
    
    // Try to use the native share API if available
    if (navigator.share) {
      navigator.share({
        title: project.title || 'InstaBids Project',
        text: `Check out this project: ${project.title || 'InstaBids Project'}`,
        url: shareableLink,
      })
      .catch((error) => {
        console.error('Error sharing:', error);
        // Fallback to clipboard
        copyToClipboard(shareableLink);
      });
    } else {
      // Fallback to clipboard
      copyToClipboard(shareableLink);
    }
    
    // If onShare callback is provided, call it
    if (onShare) {
      onShare(project, shareableLink);
    }
  };
  
  // Helper to copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        alert('Link copied to clipboard!');
      })
      .catch((err) => {
        console.error('Failed to copy text: ', err);
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('Link copied to clipboard!');
      });
  };
  
  // Determine the details button/link
  const DetailsButton = () => {
    const buttonContent = (
      <div className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-sm transition-all duration-200 transform hover:translate-y-[-1px] hover:shadow-md">
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
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 ${className} group`}>
      <div className="relative">
        {/* Project Image */}
        <div className="h-48 bg-gradient-to-r from-blue-50 to-indigo-50 relative overflow-hidden">
          <div className="relative w-full h-full transition-transform duration-500 group-hover:scale-105">
            <img 
              src={projectImageUrl}
              alt={project.title || "Project image"}
              className="w-full h-full object-cover"
              onError={handleImageError}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-80"></div>
          </div>
        </div>
        
        {/* Status Badge - Positioned at the top left of the image */}
        <div className="absolute top-3 left-3 transform transition-transform duration-300 group-hover:scale-105 group-hover:translate-y-1">
          <StatusBadge status={effectiveStatus} />
        </div>
        
        {/* Indicators for media and bids - Positioned at top right */}
        <div className="absolute top-3 right-3 flex gap-2">
          {project.hasMedia && (
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/90 text-blue-600 shadow-sm backdrop-blur-sm transform transition-transform duration-300 hover:scale-110">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          {project.bid_count > 0 && (
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/90 text-green-600 shadow-sm backdrop-blur-sm transform transition-transform duration-300 hover:scale-110">
              <span className="text-xs font-medium">{project.bid_count}</span>
            </div>
          )}
        </div>
        
        {/* Project Type - Positioned at the bottom of the image */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
          <div className="text-white font-medium text-shadow">
            {getProjectType(project)}
          </div>
        </div>
      </div>
      
      {/* Card Content */}
      <div className="p-5">
        {/* Job Category - Top Position */}
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors duration-300">
            {getActualJobCategory(project)}
          </h3>
          
          {/* Location */}
          <div className="flex items-center text-sm text-gray-500 hover:text-blue-600 transition-colors duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="group-hover:underline">
              {formatLocation(project.location || project.zip_code || '')}
            </span>
          </div>
        </div>
        
        {/* Project Title */}
        <div className="text-lg font-semibold text-gray-800 mb-3 line-clamp-1 group-hover:text-blue-600 transition-colors duration-300">
          {project.title || "Untitled Project"}
        </div>
        
        {/* Project Details */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center text-sm text-gray-600 bg-gray-50 p-2 rounded-md hover:bg-blue-50 transition-colors duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>
              {project.timeline_horizons?.display_name || 
               formatTimelineHorizon(project.timeline_horizon_id) || 
               project.timeline || 
               "Timeline not specified"}
            </span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600 bg-gray-50 p-2 rounded-md hover:bg-blue-50 transition-colors duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <span>
              {project.budget_min && project.budget_max
                ? `$${project.budget_min} - $${project.budget_max}`
                : project.budget
                ? `$${project.budget}`
                : "Budget not specified"}
            </span>
          </div>
        </div>
        
        {/* Media Thumbnails - Positioned above action buttons */}
        {project.media && project.media.length > 0 && (
          <div className="flex gap-1 mb-4 overflow-x-auto">
            {project.media.slice(0, 4).map((item: any, index: number) => (
              <div key={item.id} className="w-12 h-12 rounded overflow-hidden flex-shrink-0 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 transform">
                <img 
                  src={item.media_url} 
                  alt={`Project image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            {project.media.length > 4 && (
              <div className="w-12 h-12 rounded bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-600 text-xs font-medium flex-shrink-0 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 transform">
                +{project.media.length - 4}
              </div>
            )}
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={handleViewDetails}
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-sm transition-all duration-200 transform hover:translate-y-[-1px] hover:shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View Details
          </button>
          
          <div className="flex gap-2">
            {showShareButton && (
              <button 
                onClick={handleShare}
                className="inline-flex items-center p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-all duration-200 transform hover:scale-110"
                title="Share project"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
            )}
            
            {showDeleteButton && (
              <button 
                onClick={handleDelete}
                className="inline-flex items-center p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-all duration-200 transform hover:scale-110"
                title="Delete project"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
