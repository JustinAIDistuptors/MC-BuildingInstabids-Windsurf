// Script to check projects and project media in Supabase
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
    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];
      console.log(`\n--- Project ${i + 1} ---`);
      console.log(`ID: ${project.id}`);
      console.log(`Title: ${project.title}`);
      console.log(`Description: ${project.description}`);
      console.log(`Status: ${project.status}`);
      console.log(`Bid Status: ${project.bid_status}`);
      console.log(`Created At: ${project.created_at}`);
      
      // Check for media files associated with this project
      const { data: media, error: mediaError } = await supabase
        .from('project_media')
        .select('*')
        .eq('project_id', project.id);
      
      if (mediaError) {
        console.error(`Error fetching media for project ${project.id}:`, mediaError);
      } else if (media && media.length > 0) {
        console.log(`\nFound ${media.length} media files for this project:`);
        media.forEach((item, idx) => {
          console.log(`  Media ${idx + 1}: ${item.file_name} (${item.media_type})`);
          console.log(`  URL: ${item.media_url}`);
        });
      } else {
        console.log('\nNo media files found for this project.');
      }
      
      // Check for any fields that might affect visibility
      const visibilityIssues = [];
      
      if (!project.status || project.status === 'draft') {
        visibilityIssues.push('Status is draft or missing');
      }
      
      if (visibilityIssues.length > 0) {
        console.log('\nPotential visibility issues:');
        visibilityIssues.forEach(issue => console.log(`- ${issue}`));
      }
      
      console.log('\n' + '-'.repeat(50));
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Also check if the project_media table exists
async function checkTables() {
  try {
    const { data, error } = await supabase
      .rpc('list_tables');
    
    if (error) {
      console.error('Error listing tables:', error);
      return;
    }
    
    console.log('Available tables in Supabase:');
    console.log(data);
    
  } catch (err) {
    console.error('Error checking tables:', err);
    console.log('Note: The list_tables RPC function might not be available. You may need to create it first.');
  }
}

// Run the functions
async function main() {
  await checkTables();
  await checkProjects();
}

main();
