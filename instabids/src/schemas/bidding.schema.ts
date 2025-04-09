/**
 * Bid Card Schema Validation
 * Following InstaBids architectural patterns
 */

import { z } from 'zod';
import { JobSize } from '@/types/bidding';

// Address schema
export const addressSchema = z.object({
  address_line1: z.string().min(1, "Street address is required"),
  address_line2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  country: z.string().optional(),
  zip_code: z.string().min(5, "Valid ZIP code is required"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export type AddressSchemaType = z.infer<typeof addressSchema>;

// Bid Card Media schema
export const bidCardMediaSchema = z.object({
  id: z.string().optional(),
  bid_card_id: z.string().optional(),
  media_type: z.enum(['photo', 'video', 'document', 'measurement']),
  url: z.string().url().optional(),
  thumbnail_url: z.string().url().optional(),
  file_name: z.string().optional(),
  file_path: z.string().optional(),
  content_type: z.string().optional(),
  size_bytes: z.number().positive().optional(),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  display_order: z.number().int().optional(),
});

export type BidCardMediaSchemaType = z.infer<typeof bidCardMediaSchema>;

// Main Bid Card schema
export const bidCardSchema = z.object({
  id: z.string().optional(),
  creator_id: z.string().optional(),
  job_type_id: z.string().min(1, "Please select a project type"),
  job_category_id: z.string().optional(),
  intention_type_id: z.string().optional(),
  job_size: z.nativeEnum(JobSize).optional(),
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title cannot exceed 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000, "Description cannot exceed 2000 characters"),
  location: addressSchema,
  zip_code: z.string().min(5, "Valid ZIP code is required"),
  timeline_horizon_id: z.string().min(1, "Please select a timeline"),
  timeline_start: z.string().optional(),
  timeline_end: z.string().optional(),
  bid_deadline: z.string().optional(),
  budget_min: z.number().nonnegative().default(0),
  budget_max: z.number().nonnegative().default(0),
  group_bidding_enabled: z.boolean().default(false),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  visibility: z.enum(['public', 'private', 'group']).default('public'),
  special_requirements: z.string().optional(),
  guidance_for_bidders: z.string().optional(),
  required_certifications: z.array(z.string()).optional(),
  media: z.array(bidCardMediaSchema).optional(),
});

export type BidCardSchemaType = z.infer<typeof bidCardSchema>;

// Form state schema
export const bidCardFormStateSchema = z.object({
  currentStep: z.number().min(0),
  data: bidCardSchema,
  isValid: z.boolean().default(false),
  message: z.string().optional(),
});

export type BidCardFormStateSchemaType = z.infer<typeof bidCardFormStateSchema>;

// Custom validation functions
export function validateBudgetRange(values: { budget_min?: number; budget_max?: number }) {
  const { budget_min, budget_max } = values;
  
  if (budget_min !== undefined && budget_max !== undefined && budget_min > budget_max) {
    return {
      budget_min: 'Minimum budget cannot be greater than maximum budget',
      budget_max: 'Maximum budget cannot be less than minimum budget',
    };
  }
  
  return {};
}

// Step validation fields - used to validate just the fields for the current step
export const STEP_VALIDATION_FIELDS = {
  0: ['job_type_id'], // Project Type selection only
  1: ['job_category_id'], // Job Category selection
  2: ['title', 'description', 'special_requirements'], // Details
  3: ['location.address_line1', 'location.city', 'location.state', 'location.zip_code', 'timeline_horizon_id'], // Location & Timeline
  4: ['budget_min', 'budget_max', 'visibility'], // Budget & Bidding
  5: [], // Media Upload (optional)
  6: [], // Review & Submit (no validation required)
};

// Initial values for the bid card form
export const INITIAL_BID_CARD_VALUES: BidCardSchemaType = {
  status: 'draft',
  job_type_id: '',
  job_category_id: '',
  intention_type_id: '',
  job_size: JobSize.Medium,
  title: '',
  description: '',
  location: {
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    country: 'USA',
    zip_code: '',
  },
  zip_code: '',
  timeline_horizon_id: '',
  timeline_start: '',
  timeline_end: '',
  budget_min: 0,
  budget_max: 0,
  group_bidding_enabled: false,
  visibility: 'public',
  special_requirements: '',
  guidance_for_bidders: '',
  required_certifications: [],
};
