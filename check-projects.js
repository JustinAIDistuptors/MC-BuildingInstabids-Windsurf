// Script to check projects in Supabase
require('dotenv').config({ path: './instabids/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Make sure .env.local file exists with proper values.');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Found' : 'Missing');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? 'Found' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProjects() {
  console.log('Checking projects in Supabase...');
  
  try {
    // Get all projects
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching projects:', error);
      return;
    }
    
    console.log(`Found ${projects.length} projects:`);
    
    if (projects.length === 0) {
      console.log('No projects found in the database.');
      return;
    }
    
    // Display project details
    projects.forEach((project, index) => {
      console.log(`\n--- Project ${index + 1} ---`);
      console.log(`ID: ${project.id}`);
      console.log(`Title: ${project.title}`);
      console.log(`Status: ${project.status}`);
      console.log(`Created At: ${project.created_at}`);
      console.log(`Updated At: ${project.updated_at || 'N/A'}`);
      
      // Check for any fields that might affect visibility
      const visibilityIssues = [];
      
      if (!project.status || project.status === 'draft') {
        visibilityIssues.push('Status is draft or missing');
      }
      
      if (!project.user_id) {
        visibilityIssues.push('No user_id associated');
      }
      
      if (visibilityIssues.length > 0) {
        console.log('Potential visibility issues:');
        visibilityIssues.forEach(issue => console.log(`- ${issue}`));
      }
    });
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Run the function
checkProjects();
