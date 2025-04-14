-- SQL script to create the bid_cards table

-- Create the bid_cards table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.bid_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  budget_min INTEGER,
  budget_max INTEGER,
  job_type_id TEXT,
  job_category_id TEXT,
  location TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for the bid_cards table
ALTER TABLE public.bid_cards ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow anyone to select from bid_cards
CREATE POLICY "Allow public select on bid_cards" 
  ON public.bid_cards 
  FOR SELECT 
  TO public 
  USING (true);

-- Create a policy to allow anyone to insert into bid_cards
CREATE POLICY "Allow public insert on bid_cards" 
  ON public.bid_cards 
  FOR INSERT 
  TO public 
  WITH CHECK (true);

-- Create a policy to allow anyone to update bid_cards
CREATE POLICY "Allow public update on bid_cards" 
  ON public.bid_cards 
  FOR UPDATE 
  TO public 
  USING (true);

-- Create a policy to allow anyone to delete from bid_cards
CREATE POLICY "Allow public delete on bid_cards" 
  ON public.bid_cards 
  FOR DELETE 
  TO public 
  USING (true);
