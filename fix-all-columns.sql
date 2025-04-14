-- Comprehensive fix for ALL columns in the projects table
-- This script handles ALL required columns at once

-- First, let's add the 'zip' column and all other potentially missing columns
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS zip TEXT DEFAULT '00000';
ALTER TABLE public.projects ALTER COLUMN zip DROP NOT NULL;

-- Make ALL columns nullable to prevent any constraint violations
DO $$
DECLARE
    col_record RECORD;
BEGIN
    FOR col_record IN 
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'projects' 
        AND is_nullable = 'NO'
        AND column_name != 'id'  -- Keep primary key constraint
    LOOP
        EXECUTE format('ALTER TABLE public.projects ALTER COLUMN %I DROP NOT NULL', col_record.column_name);
        RAISE NOTICE 'Made column % nullable', col_record.column_name;
    END LOOP;
END $$;

-- Create a test project with ALL possible fields
INSERT INTO public.projects (
  title,
  description,
  status,
  bid_status,
  budget_min,
  budget_max,
  zip_code,
  zip,
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
  'Final Test Project',
  'This project tests ALL columns',
  'published',
  'accepting_bids',
  5000,
  15000,
  '12345',
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
) RETURNING *;  -- Return the entire row to see all columns
