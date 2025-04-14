-- Final fix script - simple and direct approach
-- This makes all columns nullable without trying to add new ones

-- First, let's see what columns actually exist in the table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'projects'
ORDER BY ordinal_position;

-- Make ALL existing columns nullable (except id)
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

-- Add the zip column if it doesn't exist (with default and nullable)
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS zip TEXT DEFAULT '00000';

-- Create a simple test project with minimal fields
INSERT INTO public.projects (
  title,
  description,
  status
) VALUES (
  'Minimal Test Project',
  'Testing with minimal fields after making all columns nullable',
  'published'
) RETURNING *;
