// Script to check the actual structure of the projects table
require('dotenv').config({ path: './instabids/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProjectsStructure() {
  console.log('Checking projects table structure...');
  
  try {
    // Try to insert a minimal project to see what fields are required
    const minimalProject = {
      title: 'Test Project ' + Date.now(),
      description: 'Minimal test project',
      status: 'published'
    };
    
    console.log('Attempting to insert minimal project:', minimalProject);
    
    const { data, error } = await supabase
      .from('projects')
      .insert([minimalProject])
      .select();
    
    if (error) {
      console.error('Error inserting minimal project:', error);
    } else {
      console.log('Minimal project inserted successfully!');
      console.log('Returned data:', data);
      
      // If successful, try to get all columns by selecting a project
      const { data: projectData, error: selectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', data[0].id)
        .single();
      
      if (selectError) {
        console.error('Error fetching project details:', selectError);
      } else {
        console.log('Project structure:');
        console.log(projectData);
        console.log('Available columns:', Object.keys(projectData));
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the check
checkProjectsStructure();
