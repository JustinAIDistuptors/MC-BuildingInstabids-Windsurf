-- SQL to create the storage bucket and set up proper permissions
-- Run this in the Supabase SQL Editor

-- First, check if the bucket exists
SELECT EXISTS (
  SELECT 1 FROM storage.buckets WHERE name = 'project_media'
);

-- Create the bucket if it doesn't exist (using lowercase, no spaces)
INSERT INTO storage.buckets (id, name, public)
VALUES ('project_media', 'project_media', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS for the storage.objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow anyone to upload files to the project_media bucket
CREATE POLICY "Allow public uploads to project_media"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'project_media');

-- Create a policy to allow anyone to select/view files from the project_media bucket
CREATE POLICY "Allow public access to project_media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'project_media');

-- Create a policy to allow anyone to update files in the project_media bucket
CREATE POLICY "Allow public updates to project_media"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'project_media');

-- Create a policy to allow anyone to delete files from the project_media bucket
CREATE POLICY "Allow public deletes from project_media"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'project_media');
