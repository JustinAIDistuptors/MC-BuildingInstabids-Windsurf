-- Complete schema update to add all missing columns needed by the BidCardForm
-- Run this in the Supabase SQL Editor

-- Add service_type column to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS service_type TEXT;

-- Add square_footage column to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS square_footage INTEGER;

-- Add timeline column to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS timeline TEXT;

-- Add timeline-related columns
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS timeline_horizon_id TEXT;

ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS timeline_start DATE;

ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS timeline_end DATE;

ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS bid_deadline DATE;

-- Add special requirements and guidance columns
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS special_requirements TEXT;

ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS guidance_for_bidders TEXT;

-- Add property details columns
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS property_size TEXT;

-- Add marketing and terms columns
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT false;

ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT false;

-- Update existing projects with default values
UPDATE public.projects
SET 
  service_type = COALESCE(service_type, type),
  timeline = COALESCE(timeline, 'Not specified'),
  square_footage = COALESCE(square_footage, 0),
  timeline_horizon_id = COALESCE(timeline_horizon_id, 'not_specified'),
  special_requirements = COALESCE(special_requirements, ''),
  guidance_for_bidders = COALESCE(guidance_for_bidders, ''),
  terms_accepted = COALESCE(terms_accepted, false),
  marketing_consent = COALESCE(marketing_consent, false)
WHERE service_type IS NULL 
   OR timeline IS NULL 
   OR square_footage IS NULL 
   OR timeline_horizon_id IS NULL
   OR special_requirements IS NULL
   OR guidance_for_bidders IS NULL
   OR terms_accepted IS NULL
   OR marketing_consent IS NULL;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_projects_service_type ON public.projects(service_type);
CREATE INDEX IF NOT EXISTS idx_projects_job_category_id ON public.projects(job_category_id);
CREATE INDEX IF NOT EXISTS idx_projects_job_type_id ON public.projects(job_type_id);
CREATE INDEX IF NOT EXISTS idx_projects_timeline_horizon_id ON public.projects(timeline_horizon_id);
