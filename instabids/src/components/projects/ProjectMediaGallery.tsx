'use client';

import React from 'react';

interface ProjectMedia {
  id: string;
  media_url: string;
  media_type: string;
  file_name: string;
}

interface ProjectMediaGalleryProps {
  media: ProjectMedia[];
  maxThumbnails?: number;
}

/**
 * Component that displays a thumbnail gallery of project media
 * Positioned at the bottom of the project card
 */
export const ProjectMediaGallery: React.FC<ProjectMediaGalleryProps> = ({ 
  media, 
  maxThumbnails = 4 
}) => {
  if (!media || media.length === 0) return null;
  
  const displayedMedia = media.slice(0, maxThumbnails);
  const hasMore = media.length > maxThumbnails;
  
  return (
    <div className="absolute bottom-0 left-0 right-0 flex gap-1 p-1 bg-black/30 backdrop-blur-sm">
      {displayedMedia.map((item, index) => (
        <div key={item.id} className="w-10 h-10 rounded overflow-hidden">
          <img 
            src={item.media_url} 
            alt={`Project image ${index + 1}`}
            className="w-full h-full object-cover"
          />
        </div>
      ))}
      {hasMore && (
        <div className="w-10 h-10 rounded bg-black/50 flex items-center justify-center text-white text-xs font-medium">
          +{media.length - maxThumbnails}
        </div>
      )}
    </div>
  );
};

export default ProjectMediaGallery;
