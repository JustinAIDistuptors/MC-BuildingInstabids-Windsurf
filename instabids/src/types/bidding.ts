/**
 * Bidding system types
 * Based on the database schema structure
 */

/**
 * Job Categories
 */
export interface JobCategory {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  icon?: string;
  display_order: number;
  parent_category_id?: string;
}

/**
 * Job Types
 */
export interface JobType {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  icon?: string;
  display_order: number;
}

/**
 * Project Intention Types
 * Categorizes whether a job is one-time, ongoing, repair, or labor assistance
 */
export interface ProjectIntentionType {
  id: string;
  name: string;
  display_name: string;
  description?: string;
}

/**
 * Timeline Horizons
 * Represents different time expectation categories
 */
export interface TimelineHorizon {
  id: string;
  name: string;
  display_name: string;
  min_days?: number;
  max_days?: number | undefined;
}

/**
 * Job size options
 */
export enum JobSize {
  Small = 'small',
  Medium = 'medium',
  Large = 'large',
  ExtraLarge = 'extra_large'
}

/**
 * Bid Card Media
 */
export interface BidCardMedia {
  id?: string;
  bid_card_id?: string;
  media_type: 'photo' | 'video' | 'document' | 'measurement';
  url?: string;
  thumbnail_url?: string;
  file_name?: string;
  file_path?: string;
  content_type?: string;
  size_bytes?: number;
  description?: string;
  metadata?: Record<string, any>;
  display_order?: number;
  file?: File;
}

/**
 * Address type
 */
export interface Address {
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  country?: string;
  zip_code: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Main Bid Card type matching database schema
 */
export interface BidCard {
  id?: string;
  creator_id?: string;
  job_category_id: string;
  job_type_id: string;
  intention_type_id: string;
  title: string;
  description: string;
  location: Address;
  zip_code: string;
  budget_min?: number;
  budget_max?: number;
  timeline_start?: string;
  timeline_end?: string;
  timeline_horizon_id?: string;
  bid_deadline?: string;
  group_bidding_enabled: boolean;
  status?: 'draft' | 'published' | 'archived';
  visibility: 'public' | 'private' | 'group';
  max_contractor_messages?: number;
  prohibit_negotiation?: boolean;
  guidance_for_bidders?: string;
  job_size: JobSize;
  job_start_window_start?: string;
  job_start_window_end?: string;
  required_certifications?: string[];
  special_requirements?: string;
  created_at?: string;
  updated_at?: string;
  media?: BidCardMedia[];
}

/**
 * Form state for the bid card creation process
 */
export interface BidCardFormState {
  currentStep: number;
  data: BidCard;
  errors: Record<string, string>;
  mediaFiles: File[];
}

/**
 * Enum for bid card form steps
 */
export enum BidCardFormStep {
  ProjectClassification = 0,
  ProjectDetails = 1,
  LocationTimeline = 2,
  BudgetBidding = 3,
  MediaUpload = 4,
  ReviewSubmit = 5
}

/**
 * Bid card with extended information
 * Typically used when joined with other tables like categories, types, etc.
 */
export interface ExtendedBidCard extends BidCard {
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
}

// Project type constants instead of enums as per best practices
export const PROJECT_TYPES = {
  OneTime: 'one-time',
  Continual: 'continual',
  Repair: 'repair',
  Labor: 'labor'
} as const;

export type ProjectType = keyof typeof PROJECT_TYPES;

// Job size constants for UI reference
export const JOB_SIZES: Record<string, { label: string, description: string }> = {
  [JobSize.Small]: { 
    label: 'Small', 
    description: 'Quick work, typically under $2,000' 
  },
  [JobSize.Medium]: { 
    label: 'Medium', 
    description: 'Standard project, $2,000-$10,000' 
  },
  [JobSize.Large]: { 
    label: 'Large', 
    description: 'Major project, $10,000-$50,000' 
  },
  [JobSize.ExtraLarge]: { 
    label: 'Extra Large', 
    description: 'Extensive project, $50,000+' 
  },
};

// Mock data for UI development and testing
export const MOCK_JOB_CATEGORIES: JobCategory[] = [
  {
    id: 'cat1',
    name: 'kitchen',
    display_name: 'Kitchen Remodel',
    description: 'Full or partial kitchen remodeling',
    icon: 'kitchen',
    display_order: 1
  },
  {
    id: 'cat2',
    name: 'bathroom',
    display_name: 'Bathroom Remodel',
    description: 'Full or partial bathroom remodeling',
    icon: 'bathroom',
    display_order: 2
  },
  {
    id: 'cat3',
    name: 'addition',
    display_name: 'Home Addition',
    description: 'Adding new rooms or expanding existing ones',
    icon: 'addition',
    display_order: 3
  },
  {
    id: 'cat4',
    name: 'plumbing',
    display_name: 'Plumbing Repair',
    description: 'Fixing leaks, replacing pipes, etc.',
    icon: 'plumbing',
    display_order: 4
  }
];

export const MOCK_JOB_TYPES: JobType[] = [
  {
    id: 'type1',
    name: 'renovation',
    display_name: 'Renovation',
    description: 'Major changes to existing structures',
    icon: 'renovation',
    display_order: 1
  },
  {
    id: 'type2',
    name: 'repair',
    display_name: 'Repair',
    description: 'Fixing broken or damaged items',
    icon: 'repair',
    display_order: 2
  },
  {
    id: 'type3',
    name: 'new_construction',
    display_name: 'New Construction',
    description: 'Building new structures',
    icon: 'construction',
    display_order: 3
  }
];

export const MOCK_INTENTION_TYPES: ProjectIntentionType[] = [
  {
    id: 'intent1',
    name: 'one_time',
    display_name: 'One-time Project',
    description: 'A single project with defined start and end'
  },
  {
    id: 'intent2',
    name: 'ongoing',
    display_name: 'Ongoing Work',
    description: 'Regular, continuing work without a defined end'
  },
  {
    id: 'intent3',
    name: 'emergency',
    display_name: 'Emergency Repair',
    description: 'Urgent repair needed as soon as possible'
  }
];

export const MOCK_TIMELINE_HORIZONS: TimelineHorizon[] = [
  {
    id: 'time1',
    name: 'asap',
    display_name: 'As Soon As Possible',
    max_days: 7
  },
  {
    id: 'time2',
    name: 'within_month',
    display_name: 'Within a Month',
    min_days: 7,
    max_days: 30
  },
  {
    id: 'time3',
    name: 'within_quarter',
    display_name: 'Within 3 Months',
    min_days: 30,
    max_days: 90
  },
  {
    id: 'time4',
    name: 'flexible',
    display_name: 'Flexible Timing',
    min_days: 90
  }
];
