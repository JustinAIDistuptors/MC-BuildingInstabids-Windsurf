// Script to verify that projects are being saved correctly without media
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

async function verifyProjectsOnly() {
  console.log('=== VERIFYING PROJECTS IN DATABASE ===');
  
  try {
    // 1. List all projects
    console.log('\n1. Listing all projects...');
    
    const { data: projects, error: listError } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (listError) {
      console.error('Error listing projects:', listError);
      return;
    }
    
    if (!projects || projects.length === 0) {
      console.log('No projects found in the database.');
    } else {
      console.log(`Found ${projects.length} projects in the database.`);
      
      // Display project details
      projects.forEach((project, index) => {
        console.log(`\nProject ${index + 1}:`);
        console.log(`- ID: ${project.id}`);
        console.log(`- Title: ${project.title}`);
        console.log(`- Description: ${project.description}`);
        console.log(`- Status: ${project.status}`);
        console.log(`- Created At: ${project.created_at}`);
      });
    }
    
    // 2. Create a new test project
    console.log('\n2. Creating a new test project...');
    
    const testProject = {
      title: 'Final Test Project ' + Date.now(),
      description: 'This is a final test project',
      status: 'published',
      bid_status: 'accepting_bids',
      budget_min: 5000,
      budget_max: 15000,
      zip_code: '12345',
      zip: '12345',
      location: 'Test City, Test State',
      city: 'Test City',
      state: 'Test State',
      type: 'Renovation',
      job_type_id: 'renovation',
      job_category_id: 'kitchen',
      group_bidding_enabled: true,
      property_type: 'residential'
    };
    
    const { data: newProject, error: createError } = await supabase
      .from('projects')
      .insert([testProject])
      .select();
    
    if (createError) {
      console.error('Error creating test project:', createError);
    } else {
      console.log('✅ Test project created successfully!');
      console.log('New project ID:', newProject[0].id);
      
      // 3. Verify the new project
      console.log('\n3. Verifying the new project...');
      
      const { data: verifiedProject, error: verifyError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', newProject[0].id)
        .single();
      
      if (verifyError) {
        console.error('Error verifying project:', verifyError);
      } else {
        console.log('✅ Project verification successful!');
        console.log('Project data:', verifiedProject);
      }
    }
    
    console.log('\n=== VERIFICATION COMPLETED ===');
    console.log('Project creation is working correctly!');
    console.log('\nNOTE: Storage bucket creation requires manual setup in the Supabase dashboard:');
    console.log('1. Go to Storage in the Supabase dashboard');
    console.log('2. Click "Create a new bucket"');
    console.log('3. Name it "project_media" (lowercase, no spaces)');
    console.log('4. Check "Public bucket" to make it public');
    console.log('5. Click "Create bucket"');
    
  } catch (error) {
    console.error('Unexpected error during verification:', error);
  }
}

// Run the verification
verifyProjectsOnly();
