-- SQL script to copy storage policies from "Project Media" to "projectmedia" bucket

-- First, let's see what policies exist for the "Project Media" bucket
SELECT * FROM storage.policies 
WHERE bucket_id = (SELECT id FROM storage.buckets WHERE name = 'Project Media');

-- Now let's copy those policies to the "projectmedia" bucket
INSERT INTO storage.policies (name, definition, owner, created_at, updated_at, bucket_id)
SELECT 
  'Allow public access to projectmedia',  -- New policy name
  definition,                            -- Same definition as original
  owner,                                 -- Same owner
  now(),                                 -- Current timestamp
  now(),                                 -- Current timestamp
  (SELECT id FROM storage.buckets WHERE name = 'projectmedia')  -- Target bucket ID
FROM storage.policies
WHERE bucket_id = (SELECT id FROM storage.buckets WHERE name = 'Project Media')
LIMIT 1;  -- Just copy one policy as a template

-- Now create specific policies for each operation
-- Policy for SELECT (download)
INSERT INTO storage.policies (name, definition, owner, created_at, updated_at, bucket_id)
SELECT 
  'Allow public download from projectmedia',
  'true',
  auth.uid(),
  now(),
  now(),
  (SELECT id FROM storage.buckets WHERE name = 'projectmedia')
WHERE NOT EXISTS (
  SELECT 1 FROM storage.policies 
  WHERE bucket_id = (SELECT id FROM storage.buckets WHERE name = 'projectmedia')
  AND name = 'Allow public download from projectmedia'
);

-- Policy for INSERT (upload)
INSERT INTO storage.policies (name, definition, owner, created_at, updated_at, bucket_id)
SELECT 
  'Allow public upload to projectmedia',
  'true',
  auth.uid(),
  now(),
  now(),
  (SELECT id FROM storage.buckets WHERE name = 'projectmedia')
WHERE NOT EXISTS (
  SELECT 1 FROM storage.policies 
  WHERE bucket_id = (SELECT id FROM storage.buckets WHERE name = 'projectmedia')
  AND name = 'Allow public upload to projectmedia'
);

-- Policy for UPDATE
INSERT INTO storage.policies (name, definition, owner, created_at, updated_at, bucket_id)
SELECT 
  'Allow public update to projectmedia',
  'true',
  auth.uid(),
  now(),
  now(),
  (SELECT id FROM storage.buckets WHERE name = 'projectmedia')
WHERE NOT EXISTS (
  SELECT 1 FROM storage.policies 
  WHERE bucket_id = (SELECT id FROM storage.buckets WHERE name = 'projectmedia')
  AND name = 'Allow public update to projectmedia'
);

-- Policy for DELETE
INSERT INTO storage.policies (name, definition, owner, created_at, updated_at, bucket_id)
SELECT 
  'Allow public delete from projectmedia',
  'true',
  auth.uid(),
  now(),
  now(),
  (SELECT id FROM storage.buckets WHERE name = 'projectmedia')
WHERE NOT EXISTS (
  SELECT 1 FROM storage.policies 
  WHERE bucket_id = (SELECT id FROM storage.buckets WHERE name = 'projectmedia')
  AND name = 'Allow public delete from projectmedia'
);
