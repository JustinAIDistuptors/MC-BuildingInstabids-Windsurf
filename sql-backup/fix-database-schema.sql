-- SQL script to properly fix the database schema to match our form
-- Run this in the Supabase SQL Editor

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

-- Add type columns
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS type TEXT;

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

-- Create storage bucket for project media if it doesn't exist
-- Note: This needs to be done through the Supabase UI or API, not SQL
-- But we can check if it exists:
SELECT EXISTS (
  SELECT 1 FROM storage.buckets WHERE name = 'Project Media'
);

-- Add a comment to confirm completion
COMMENT ON TABLE public.projects IS 'Project table with all required columns for the form';
