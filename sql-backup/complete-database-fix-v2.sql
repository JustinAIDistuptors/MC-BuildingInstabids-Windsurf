-- Complete SQL script to fix all database issues at once
-- Run this in the Supabase SQL Editor

-- First, let's identify all columns in the projects table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'projects'
ORDER BY ordinal_position;

-- Now add all potentially missing columns and make required ones nullable
-- User-related columns
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS created_by UUID NULL;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS owner_id UUID NULL;
ALTER TABLE public.projects ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.projects ALTER COLUMN owner_id DROP NOT NULL;

-- Property-related columns
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS property_type TEXT DEFAULT 'residential';
ALTER TABLE public.projects ALTER COLUMN property_type DROP NOT NULL;

-- Location-related columns
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS zip_code TEXT DEFAULT '00000';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Unknown';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS state TEXT DEFAULT 'Unknown';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS location TEXT DEFAULT 'Unknown';
ALTER TABLE public.projects ALTER COLUMN zip_code DROP NOT NULL;
ALTER TABLE public.projects ALTER COLUMN city DROP NOT NULL;
ALTER TABLE public.projects ALTER COLUMN state DROP NOT NULL;
ALTER TABLE public.projects ALTER COLUMN location DROP NOT NULL;

-- Project type columns
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Other';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS job_type_id TEXT DEFAULT 'other';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS job_category_id TEXT DEFAULT 'general';
ALTER TABLE public.projects ALTER COLUMN type DROP NOT NULL;
ALTER TABLE public.projects ALTER COLUMN job_type_id DROP NOT NULL;
ALTER TABLE public.projects ALTER COLUMN job_category_id DROP NOT NULL;

-- Budget columns
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS budget_min NUMERIC DEFAULT 0;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS budget_max NUMERIC DEFAULT 0;
ALTER TABLE public.projects ALTER COLUMN budget_min DROP NOT NULL;
ALTER TABLE public.projects ALTER COLUMN budget_max DROP NOT NULL;

-- Status columns
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS bid_status TEXT DEFAULT 'accepting_bids';
ALTER TABLE public.projects ALTER COLUMN status DROP NOT NULL;
ALTER TABLE public.projects ALTER COLUMN bid_status DROP NOT NULL;

-- Other columns
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS group_bidding_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.projects ALTER COLUMN group_bidding_enabled DROP NOT NULL;

-- Timestamp columns
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.projects ALTER COLUMN created_at DROP NOT NULL;
ALTER TABLE public.projects ALTER COLUMN updated_at DROP NOT NULL;

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
  city,
  state,
  type,
  job_type_id,
  job_category_id,
  group_bidding_enabled,
  owner_id,
  created_by,
  property_type
) VALUES (
  'Complete Test Project',
  'This project was created via SQL to test the complete schema',
  'published',
  'accepting_bids',
  5000,
  15000,
  '12345',
  'Test City, Test State',
  'Test City',
  'Test State',
  'Renovation',
  'renovation',
  'kitchen',
  true,
  NULL,
  NULL,
  'residential'
) RETURNING id;

-- Add a comment to confirm completion
COMMENT ON TABLE public.projects IS 'Project table with all required columns for the form';
