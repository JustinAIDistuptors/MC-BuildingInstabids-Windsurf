-- SQL script to update BidCardForm to use the capitalized "Project Media" bucket

-- First, ensure the project_media table exists
CREATE TABLE IF NOT EXISTS public.project_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT,
  file_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for the project_media table
ALTER TABLE public.project_media ENABLE ROW LEVEL SECURITY;

-- Create policies for the project_media table
DROP POLICY IF EXISTS "Allow public select on project_media" ON public.project_media;
CREATE POLICY "Allow public select on project_media" 
  ON public.project_media 
  FOR SELECT 
  TO public 
  USING (true);

DROP POLICY IF EXISTS "Allow public insert on project_media" ON public.project_media;
CREATE POLICY "Allow public insert on project_media" 
  ON public.project_media 
  FOR INSERT 
  TO public 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on project_media" ON public.project_media;
CREATE POLICY "Allow public update on project_media" 
  ON public.project_media 
  FOR UPDATE 
  TO public 
  USING (true);

DROP POLICY IF EXISTS "Allow public delete on project_media" ON public.project_media;
CREATE POLICY "Allow public delete on project_media" 
  ON public.project_media 
  FOR DELETE 
  TO public 
  USING (true);
