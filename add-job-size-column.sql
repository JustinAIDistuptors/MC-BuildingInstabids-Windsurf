-- Add job_size column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS job_size TEXT;
