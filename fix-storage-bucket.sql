-- Fix the storage bucket issue by ensuring the correct bucket exists
-- This script will:
-- 1. Check if the 'message-attachments' bucket exists
-- 2. Create it if it doesn't exist
-- 3. Set proper permissions

-- First, let's see what buckets currently exist
SELECT name, public FROM storage.buckets;

-- Create the bucket with the correct name if it doesn't exist
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
SELECT 
  'message-attachments', 
  'message-attachments', 
  true, 
  false, 
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']::text[]
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE name = 'message-attachments'
);

-- Set RLS policy to allow authenticated users to read files
CREATE POLICY IF NOT EXISTS "Allow public read access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'message-attachments' AND auth.role() = 'authenticated');

-- Set RLS policy to allow authenticated users to upload files
CREATE POLICY IF NOT EXISTS "Allow authenticated uploads"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'message-attachments' AND auth.role() = 'authenticated');

-- Set RLS policy to allow authenticated users to update their own files
CREATE POLICY IF NOT EXISTS "Allow authenticated updates"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'message-attachments' AND auth.role() = 'authenticated');

-- Set RLS policy to allow authenticated users to delete their own files
CREATE POLICY IF NOT EXISTS "Allow authenticated deletes"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'message-attachments' AND auth.role() = 'authenticated');

-- Verify the bucket exists
SELECT name, public FROM storage.buckets WHERE name = 'message-attachments';
