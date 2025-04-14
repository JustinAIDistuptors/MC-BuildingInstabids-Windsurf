// Test script to check if the project_media table exists
require('dotenv').config({ path: './instabids/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials.');
  process.exit(1);
}

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key available:', !!supabaseKey);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProjectMediaTable() {
  console.log('=== TESTING PROJECT_MEDIA TABLE ===');
  
  try {
    // Try to select from the project_media table
    console.log('\nAttempting to select from project_media table...');
    
    const { data, error } = await supabase
      .from('project_media')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error accessing project_media table:', error);
      
      if (error.code === '42P01') {
        console.log('\nThe project_media table does not exist.');
        console.log('Please run the SQL script to create it:');
        console.log(`
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

-- Create a policy to allow anyone to select from project_media
CREATE POLICY "Allow public select on project_media" 
  ON public.project_media 
  FOR SELECT 
  TO public 
  USING (true);

-- Create a policy to allow anyone to insert into project_media
CREATE POLICY "Allow public insert on project_media" 
  ON public.project_media 
  FOR INSERT 
  TO public 
  WITH CHECK (true);
        `);
      }
    } else {
      console.log('✅ The project_media table exists!');
      console.log('Sample data:', data);
    }
    
    // Check storage bucket policies
    console.log('\nFor storage bucket policies, you need to:');
    console.log('1. Go to Storage in the Supabase dashboard');
    console.log('2. Click on the "projectmedia" bucket');
    console.log('3. Go to the "Policies" tab');
    console.log('4. Create the following policies:');
    console.log('   - SELECT (download): Allow public access - Policy: true');
    console.log('   - INSERT (upload): Allow public access - Policy: true');
    console.log('   - UPDATE: Allow public access - Policy: true');
    console.log('   - DELETE: Allow public access - Policy: true');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the test
testProjectMediaTable();
