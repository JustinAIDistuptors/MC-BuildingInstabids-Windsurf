-- Storage permissions fix for InstaBids
-- This script addresses the Row Level Security (RLS) policy issues preventing bucket creation and media uploads

-- 1. Enable storage admin privileges for authenticated users (temporary fix)
BEGIN;
  -- First, enable RLS on the buckets table if not already enabled
  ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
  
  -- Drop existing policies if any
  DROP POLICY IF EXISTS "Allow authenticated users to create buckets" ON storage.buckets;
  DROP POLICY IF EXISTS "Allow authenticated users full access to buckets" ON storage.buckets;
  
  -- Create a policy that allows authenticated users to create buckets
  CREATE POLICY "Allow authenticated users to create buckets"
    ON storage.buckets
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
    
  -- Create a policy that allows authenticated users to manage buckets
  CREATE POLICY "Allow authenticated users full access to buckets"
    ON storage.buckets
    FOR ALL
    TO authenticated
    USING (true);
COMMIT;

-- 2. Create the projectmedia bucket if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'projectmedia'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('projectmedia', 'projectmedia', true);
  END IF;
END $$;

-- 3. Set proper RLS policies for the projectmedia bucket objects
BEGIN;
  -- Enable RLS on the objects table if not already enabled
  ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
  
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
