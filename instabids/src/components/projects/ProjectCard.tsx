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
  
  const minFormatted = typeof min === 'number' 
    ? `$${min.toLocaleString()}` 
    : min?.toString().replace(/^\$/, '') ? `$${min?.toString().replace(/^\$/, '')}` : 'Not specified';
    
  const maxFormatted = typeof max === 'number' 
    ? `$${max.toLocaleString()}` 
    : max?.toString().replace(/^\$/, '') ? `$${max?.toString().replace(/^\$/, '')}` : '';
  
  return maxFormatted ? `${minFormatted} - ${maxFormatted}` : minFormatted;
};

interface ProjectCardProps {
  project: any;
  onViewDetails?: (project: any) => void;
  onDelete?: (id: string) => void;
  showDeleteButton?: boolean;
  linkToDetails?: boolean;
  className?: string;
}

export default function ProjectCard({ 
  project, 
  onViewDetails, 
  onDelete, 
  showDeleteButton = true,
  linkToDetails = false,
  className = ''
}: ProjectCardProps) {
  // Determine the effective status for display
  const effectiveStatus = project.bid_status || project.status || 'draft';
  
  // Handle view details click
  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(project);
    }
  };
  
  // Handle delete click
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(project.id);
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
  
  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 ${className}`}>
      {/* Card Header */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">{project.title}</h3>
            <div className="flex items-center gap-2">
              <StatusBadge status={effectiveStatus} />
              <span className="text-sm text-gray-500">
                {new Date(project.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex gap-1">
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
      </div>
      
      {/* Card Body */}
      <div className="p-5">
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
  );
}
