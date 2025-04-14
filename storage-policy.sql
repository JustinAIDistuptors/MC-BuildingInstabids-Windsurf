-- SQL to create a public access policy for the Project Media bucket
-- This allows anyone to upload, download, and view files

-- First, enable RLS for the storage.objects table (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow anyone to upload files to the Project Media bucket
CREATE POLICY "Allow public uploads to Project Media"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'Project Media');

-- Create a policy to allow anyone to select/view files from the Project Media bucket
CREATE POLICY "Allow public access to Project Media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'Project Media');

-- Create a policy to allow anyone to update files in the Project Media bucket
CREATE POLICY "Allow public updates to Project Media"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'Project Media');

-- Create a policy to allow anyone to delete files from the Project Media bucket
CREATE POLICY "Allow public deletes from Project Media"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'Project Media');
