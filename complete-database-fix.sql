-- Complete SQL script to fix all database issues
-- Run this in the Supabase SQL Editor

-- First, add the missing required columns to the projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS created_by UUID NULL;

-- Add owner_id column if it doesn't exist and make it nullable
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS owner_id UUID NULL;

-- Make created_by column nullable (if it's not already)
ALTER TABLE public.projects 
ALTER COLUMN created_by DROP NOT NULL;

-- Make owner_id column nullable (if it's not already)
ALTER TABLE public.projects 
ALTER COLUMN owner_id DROP NOT NULL;

-- Add bid_status column
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS bid_status TEXT DEFAULT 'accepting_bids';

-- Add budget columns
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS budget_min INTEGER;

ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS budget_max INTEGER;

-- Add location columns
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS zip_code TEXT;

ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS location TEXT;

-- Add city column if it doesn't exist and make it nullable
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Unknown';

-- Make city column nullable (if it's not already)
ALTER TABLE public.projects 
ALTER COLUMN city DROP NOT NULL;

-- Add type columns
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS type TEXT;

-- Add property_type column if it doesn't exist and make it nullable
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS property_type TEXT DEFAULT 'residential';

-- Make property_type column nullable (if it's not already)
ALTER TABLE public.projects 
ALTER COLUMN property_type DROP NOT NULL;

ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS job_type_id TEXT;

ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS job_category_id TEXT;

-- Add group bidding flag
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS group_bidding_enabled BOOLEAN DEFAULT false;

-- Add timestamp columns if they don't exist
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create project_media table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.project_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT,
  file_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a test project to verify everything works
INSERT INTO public.projects (
  title, 
  description, 
  status, 
  bid_status,
  budget_min,
  budget_max,
  zip_code,
  location,
  type,
  job_type_id,
  job_category_id,
  group_bidding_enabled,
  owner_id,
  created_by,
  property_type,
  city
) VALUES (
  'SQL Test Project',
  'This project was created via SQL to test the schema',
  'published',
  'accepting_bids',
  5000,
  15000,
  '12345',
  'Test City, Test State',
  'Renovation',
  'renovation',
  'kitchen',
  true,
  NULL,
  NULL,
  'residential',
  'Test City'
) RETURNING id;

-- Add a comment to confirm completion
COMMENT ON TABLE public.projects IS 'Project table with all required columns for the form';
