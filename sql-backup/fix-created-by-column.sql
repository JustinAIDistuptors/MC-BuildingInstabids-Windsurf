-- SQL script to fix the created_by column issue

-- Check if created_by column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'projects' 
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE projects ADD COLUMN created_by UUID NULL;
    END IF;
END $$;

-- Update the schema cache to ensure it recognizes the column
NOTIFY pgrst, 'reload schema';

-- Add owner_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'projects' 
        AND column_name = 'owner_id'
    ) THEN
        ALTER TABLE projects ADD COLUMN owner_id UUID NULL;
    END IF;
END $$;
