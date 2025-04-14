-- Comprehensive fix for InstaBids database and storage issues
-- This script addresses all potential issues with projects, media storage, and permissions

-- 1. Create the projectmedia bucket if it doesn't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Check if bucket exists first
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'projectmedia'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('projectmedia', 'projectmedia', true);
  END IF;
END $$;

-- 2. Set proper RLS policies for the projectmedia bucket
BEGIN;
  -- Drop existing policies if any
  DROP POLICY IF EXISTS "projectmedia_select_policy" ON storage.objects;
  DROP POLICY IF EXISTS "projectmedia_insert_policy" ON storage.objects;
  DROP POLICY IF EXISTS "projectmedia_update_policy" ON storage.objects;
  DROP POLICY IF EXISTS "projectmedia_delete_policy" ON storage.objects;
  
  -- Create new policies with proper permissions
  CREATE POLICY "projectmedia_select_policy" 
    ON storage.objects 
    FOR SELECT 
    USING (bucket_id = 'projectmedia');
    
  CREATE POLICY "projectmedia_insert_policy" 
    ON storage.objects 
    FOR INSERT 
    WITH CHECK (bucket_id = 'projectmedia');
    
  CREATE POLICY "projectmedia_update_policy" 
    ON storage.objects 
    FOR UPDATE 
    USING (bucket_id = 'projectmedia');
    
  CREATE POLICY "projectmedia_delete_policy" 
    ON storage.objects 
    FOR DELETE 
    USING (bucket_id = 'projectmedia');
COMMIT;

-- 3. Ensure projects table has all required columns
BEGIN;
  -- Add columns if they don't exist
  DO $$
  BEGIN
    -- Check and add type column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'type') THEN
      ALTER TABLE projects ADD COLUMN type TEXT;
    END IF;
    
    -- Check and add status column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'status') THEN
      ALTER TABLE projects ADD COLUMN status TEXT DEFAULT 'published';
    END IF;
    
    -- Check and add bid_status column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'bid_status') THEN
      ALTER TABLE projects ADD COLUMN bid_status TEXT DEFAULT 'accepting_bids';
    END IF;
    
    -- Check and add budget columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'budget_min') THEN
      ALTER TABLE projects ADD COLUMN budget_min INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'budget_max') THEN
      ALTER TABLE projects ADD COLUMN budget_max INTEGER;
    END IF;
    
    -- Check and add location columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'city') THEN
      ALTER TABLE projects ADD COLUMN city TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'state') THEN
      ALTER TABLE projects ADD COLUMN state TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'zip_code') THEN
      ALTER TABLE projects ADD COLUMN zip_code TEXT;
    END IF;
    
    -- Check and add job type columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'job_type_id') THEN
      ALTER TABLE projects ADD COLUMN job_type_id TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'job_category_id') THEN
      ALTER TABLE projects ADD COLUMN job_category_id TEXT;
    END IF;
    
    -- Check and add other columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'group_bidding_enabled') THEN
      ALTER TABLE projects ADD COLUMN group_bidding_enabled BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'property_type') THEN
      ALTER TABLE projects ADD COLUMN property_type TEXT;
    END IF;
  END
  $$;
COMMIT;

-- 4. Create project_media table if it doesn't exist
BEGIN;
  CREATE TABLE IF NOT EXISTS project_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type TEXT,
    file_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  -- Add RLS policies for project_media table
  ALTER TABLE project_media ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "project_media_select_policy" ON project_media;
  DROP POLICY IF EXISTS "project_media_insert_policy" ON project_media;
  DROP POLICY IF EXISTS "project_media_update_policy" ON project_media;
  DROP POLICY IF EXISTS "project_media_delete_policy" ON project_media;
  
  CREATE POLICY "project_media_select_policy" 
    ON project_media 
    FOR SELECT 
    TO authenticated
    USING (true);
    
  CREATE POLICY "project_media_insert_policy" 
    ON project_media 
    FOR INSERT 
    TO authenticated
    WITH CHECK (true);
    
  CREATE POLICY "project_media_update_policy" 
    ON project_media 
    FOR UPDATE 
    TO authenticated
    USING (true);
    
  CREATE POLICY "project_media_delete_policy" 
    ON project_media 
    FOR DELETE 
    TO authenticated
    USING (true);
COMMIT;

-- 5. Fix any existing projects with NULL values
UPDATE projects
SET status = 'published' 
WHERE status IS NULL;

UPDATE projects
SET bid_status = 'accepting_bids' 
WHERE bid_status IS NULL;

UPDATE projects
SET type = 'Renovation' 
WHERE type IS NULL;

UPDATE projects
SET job_type_id = 'renovation' 
WHERE job_type_id IS NULL;

UPDATE projects
SET job_category_id = 'general' 
WHERE job_category_id IS NULL;

UPDATE projects
SET property_type = 'residential' 
WHERE property_type IS NULL;
