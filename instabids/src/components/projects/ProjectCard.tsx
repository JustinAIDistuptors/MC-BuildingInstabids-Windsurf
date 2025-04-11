'use client';

import React from 'react';
import Link from 'next/link';

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

// Format budget for display
export const formatBudget = (min?: number | string, max?: number | string, fallback?: string) => {
  if (!min && !max) {
    return fallback || 'Not specified';
  }
  
  if (typeof min === 'string') min = parseFloat(min.replace(/[^0-9.-]+/g, ''));
  if (typeof max === 'string') max = parseFloat(max.replace(/[^0-9.-]+/g, ''));
  
  if (min && max) {
    return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
  } else if (min) {
    return `$${min.toLocaleString()}+`;
  } else if (max) {
    return `Up to $${max.toLocaleString()}`;
  }
  
  return fallback || 'Not specified';
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
}

export default function ProjectCard({ 
  project, 
  onViewDetails, 
  onDelete, 
  onShare,
  showDeleteButton = true,
  showShareButton = true,
  linkToDetails = false,
  className = '',
  imageUrl
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
  const handleDelete = (e: React.MouseEvent) => {
    // Stop event propagation
    e.stopPropagation();
    e.preventDefault();
    
    // Confirm deletion
    if (window.confirm(`Are you sure you want to delete "${project.title}"?`)) {
      console.log('Delete confirmed for project:', project.id);
      
      try {
        // DIRECT APPROACH: Manipulate localStorage directly
        console.log('Using direct localStorage manipulation to delete project');
        
        // Get current projects from localStorage
        const localProjectsString = localStorage.getItem('mock_projects');
        const localProjects = localProjectsString ? JSON.parse(localProjectsString) : [];
        
        console.log('Before deletion:', localProjects.length, 'projects');
        
        // Filter out the project to delete
        const updatedProjects = localProjects.filter((p: any) => p.id !== project.id);
        
        console.log('After deletion:', updatedProjects.length, 'projects');
        
        // Save back to localStorage
        localStorage.setItem('mock_projects', JSON.stringify(updatedProjects));
        
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
  const projectImageUrl = imageUrl || project.imageUrl || '/placeholder-project.jpg';
  
  // Handle image error
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.onerror = null;
    target.src = '/placeholder-project.jpg';
  };
  
  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 ${className}`}>
      {/* Status Badge - Positioned over the image */}
      <div className="relative">
        {/* Project Image */}
        <div className="h-40 bg-gray-200 relative overflow-hidden">
          <div className="relative w-full h-full">
            {projectImageUrl.includes('supabase.co') ? (
              // Use regular img tag for Supabase images to avoid Next.js Image configuration issues
              <img 
                src={projectImageUrl}
                alt={project.title || "Project image"}
                className="w-full h-full object-cover"
                onError={handleImageError}
              />
            ) : (
              // Use Next.js Image for other images
              <img 
                src={projectImageUrl}
                alt={project.title || "Project image"}
                className="w-full h-full object-cover"
                onError={handleImageError}
              />
            )}
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
        <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">{project.title}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.description}</p>
        
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm mb-4">
          <div>
            <div className="text-gray-500 text-xs mb-1">Budget</div>
            <div className="font-medium">
              {formatBudget(project.budget_min, project.budget_max, project.budget)}
            </div>
          </div>
          <div>
            <div className="text-gray-500 text-xs mb-1">Timeline</div>
            <div className="font-medium">
              {project.timeline || 'Not specified'}
            </div>
          </div>
          <div>
            <div className="text-gray-500 text-xs mb-1">Location</div>
            <div className="font-medium">
              {formatLocation(project.location)}
            </div>
          </div>
          <div>
            <div className="text-gray-500 text-xs mb-1">Type</div>
            <div className="font-medium capitalize">
              {project.job_type_id || project.type || 'Not specified'}
            </div>
          </div>
        </div>
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
