-- SQL to create the project_media table if it doesn't exist

-- First, ensure the UUID extension is installed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop the table if it exists to recreate it with the correct structure
DROP TABLE IF EXISTS project_media;

-- Create the project_media table
CREATE TABLE project_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT,
  file_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS project_media_project_id_idx ON project_media(project_id);

-- Disable RLS on the project_media table
ALTER TABLE project_media DISABLE ROW LEVEL SECURITY;

-- Add a comment explaining the table's purpose
COMMENT ON TABLE project_media IS 'Stores references to media files associated with projects';
