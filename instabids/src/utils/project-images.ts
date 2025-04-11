/**
 * Utility functions for handling project images and placeholders
 */

/**
 * Get a placeholder image based on project type
 * @param type The project type
 * @returns URL to the appropriate placeholder image
 */
export const getProjectTypePlaceholder = (type?: string): string => {
  const placeholders: Record<string, string> = {
    'lawn_care': '/placeholders/lawn-care.svg',
    'landscaping': '/placeholders/lawn-care.svg', // Reuse lawn-care for now
    'renovation': '/placeholders/renovation.svg',
    'new_construction': '/placeholders/construction.svg',
    'repair': '/placeholders/construction.svg', // Reuse construction for now
    'one_time': '/placeholders/default-project.svg',
    'plumbing': '/placeholders/construction.svg', // Reuse construction for now
    'electrical': '/placeholders/construction.svg', // Reuse construction for now
    'roofing': '/placeholders/construction.svg', // Reuse construction for now
    'painting': '/placeholders/renovation.svg', // Reuse renovation for now
    'flooring': '/placeholders/renovation.svg', // Reuse renovation for now
    'carpentry': '/placeholders/construction.svg', // Reuse construction for now
  };
  
  // Default fallback
  const defaultPlaceholder = '/placeholders/default-project.svg';
  
  if (!type) return defaultPlaceholder;
  
  // Normalize type to lowercase and remove spaces
  const normalizedType = type.toLowerCase().replace(/\s+/g, '_');
  
  return placeholders[normalizedType] || defaultPlaceholder;
};

/**
 * Map project type to job category
 * @param type The project type
 * @returns The corresponding job category
 */
export const getJobCategory = (type?: string): string => {
  if (!type) return 'General Services';
  
  // Normalize type to lowercase and remove spaces
  const normalizedType = type.toLowerCase().replace(/\s+/g, '_');
  
  // Map of project types to job categories
  const categoryMap: Record<string, string> = {
    // Project types
    'one-time': 'One-Time Project',
    'one_time': 'One-Time Project',
    'continual': 'Continual Service',
    'repair': 'Repair Service',
    'handyman': 'Handyman Service',
    'labor': 'Labor Service',
    'multi-step': 'Multi-Step Project',
    
    // Job categories
    'lawn_care': 'Outdoor',
    'landscaping': 'Outdoor',
    'gardening': 'Outdoor',
    'renovation': 'Home Improvement',
    'new_construction': 'Construction',
    'plumbing': 'Plumbing',
    'electrical': 'Electrical',
    'roofing': 'Roofing',
    'painting': 'Painting',
    'flooring': 'Flooring',
    'carpentry': 'Carpentry',
    'cleaning': 'Cleaning',
    'hvac': 'HVAC',
    'installation': 'Installation',
    
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
  };
  
  // First try to find an exact match
  if (categoryMap[normalizedType]) {
    return categoryMap[normalizedType];
  }
  
  // If no exact match, try to find a partial match
  for (const [key, value] of Object.entries(categoryMap)) {
    if (normalizedType.includes(key) || key.includes(normalizedType)) {
      return value;
    }
  }
  
  // If we have a job_category_id that's not in our map but has underscores or dashes,
  // convert it to a readable format
  if (normalizedType.includes('_') || normalizedType.includes('-')) {
    return normalizedType
      .replace(/[_-]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  // Last resort, capitalize the first letter
  return normalizedType.charAt(0).toUpperCase() + normalizedType.slice(1);
};

/**
 * Normalize project type for display
 * @param type The project type
 * @returns Formatted project type string
 */
export const formatProjectType = (type?: string): string => {
  if (!type) return 'Not specified';
  
  // Handle special cases
  if (type.toLowerCase() === 'one_time' || type.toLowerCase() === 'one-time') {
    return 'One-Time';
  }
  
  // Convert snake_case or kebab-case to Title Case
  return type
    .replace(/[_-]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Format timeline horizon ID to a human-readable string
 * @param horizonId The timeline horizon ID
 * @returns Formatted timeline string
 */
export const formatTimelineHorizon = (horizonId?: string): string => {
  const horizonMap: Record<string, string> = {
    'asap': 'As Soon As Possible',
    '2-weeks': 'Within 2 Weeks',
    '1-month': 'Within 1 Month',
    '3-months': 'Within 3 Months',
    'custom': 'Custom Timeline',
  };
  return horizonMap[horizonId || ''] || 'Not specified';
};
