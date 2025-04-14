-- Simple SQL script to enable storage policies for the "projectmedia" bucket

-- First, let's create a policy for SELECT (download)
BEGIN;

-- Create policy for SELECT (download)
CREATE POLICY "Allow public download from projectmedia"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'projectmedia');

-- Create policy for INSERT (upload)
CREATE POLICY "Allow public upload to projectmedia"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'projectmedia');

-- Create policy for UPDATE
CREATE POLICY "Allow public update to projectmedia"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'projectmedia');

-- Create policy for DELETE
CREATE POLICY "Allow public delete from projectmedia"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'projectmedia');

COMMIT;
