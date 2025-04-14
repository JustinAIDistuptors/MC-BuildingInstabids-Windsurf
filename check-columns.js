// Script to check each column individually
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

async function checkColumns() {
  console.log('=== CHECKING DATABASE COLUMNS ===');
  
  try {
    // First, get all existing projects to see what columns are available
    console.log('\nFetching existing projects to check columns...');
    
    const { data: projects, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .limit(5);
    
    if (fetchError) {
      console.error('Error fetching projects:', fetchError);
      return;
    }
    
    if (!projects || projects.length === 0) {
      console.log('No existing projects found. Creating a minimal project...');
      
      // Create a minimal project
      const { data: minProject, error: minError } = await supabase
        .from('projects')
        .insert([{
          title: 'Minimal Test Project',
          description: 'Test project for column check',
          status: 'published'
        }])
        .select();
      
      if (minError) {
        console.error('Error creating minimal project:', minError);
        return;
      }
      
      console.log('Minimal project created:', minProject);
      
      // Use this project for column checking
      projects = minProject;
    }
    
    // Check what columns are available
    if (projects && projects.length > 0) {
      const sampleProject = projects[0];
      console.log('\nAvailable columns in projects table:');
      console.log(Object.keys(sampleProject));
      
      // Check for required columns
      const requiredColumns = [
        'id', 'title', 'description', 'status', 'bid_status', 
        'budget_min', 'budget_max', 'zip_code', 'location', 
        'type', 'job_type_id', 'job_category_id', 'group_bidding_enabled',
        'created_at', 'updated_at'
      ];
      
      console.log('\nChecking for required columns:');
      
      for (const column of requiredColumns) {
        if (Object.keys(sampleProject).includes(column)) {
          console.log(`✅ ${column}: Present`);
        } else {
          console.log(`❌ ${column}: Missing`);
        }
      }
    }
    
    // Try to create a project with one field at a time
    console.log('\nTesting each field individually:');
    
    const testFields = {
      title: 'Test Title',
      description: 'Test Description',
      status: 'published',
      bid_status: 'accepting_bids',
      budget_min: 5000,
      budget_max: 15000,
      zip_code: '12345',
      location: 'Test Location',
      type: 'Test Type',
      job_type_id: 'test',
      job_category_id: 'test',
      group_bidding_enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Start with a minimal project
    const baseProject = {
      title: 'Base Test Project',
      description: 'Base project for field testing',
      status: 'published'
    };
    
    // Test each field individually
    for (const [field, value] of Object.entries(testFields)) {
      if (field === 'title' || field === 'description' || field === 'status') {
        // Skip fields that are already in the base project
        continue;
      }
      
      const testProject = { ...baseProject };
      testProject[field] = value;
      
      console.log(`Testing field: ${field} = ${value}`);
      
      const { data, error } = await supabase
        .from('projects')
        .insert([testProject])
        .select();
      
      if (error) {
        console.log(`❌ Field "${field}" failed: ${error.message}`);
        if (error.details) {
          console.log(`   Details: ${error.details}`);
        }
      } else {
        console.log(`✅ Field "${field}" works!`);
      }
    }
    
    // Check project_media table
    console.log('\nChecking project_media table...');
    
    const { data: mediaCheck, error: mediaCheckError } = await supabase
      .from('project_media')
      .select('*')
      .limit(1);
    
    if (mediaCheckError) {
      if (mediaCheckError.code === '42P01') {
        console.log('❌ project_media table does not exist');
      } else {
        console.log(`❌ Error checking project_media table: ${mediaCheckError.message}`);
      }
    } else {
      console.log('✅ project_media table exists');
      
      if (mediaCheck && mediaCheck.length > 0) {
        console.log('Available columns in project_media table:');
        console.log(Object.keys(mediaCheck[0]));
      }
    }
    
    // Check storage bucket
    console.log('\nChecking storage bucket...');
    
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.log(`❌ Error checking storage buckets: ${bucketsError.message}`);
    } else {
      const projectMediaBucket = buckets?.find(b => b.name === 'Project Media');
      
      if (projectMediaBucket) {
        console.log('✅ Project Media bucket exists');
      } else {
        console.log('❌ Project Media bucket does not exist');
      }
    }
    
    console.log('\n=== COLUMN CHECK COMPLETED ===');
    
  } catch (error) {
    console.error('Unexpected error during column check:', error);
  }
}

// Run the check
checkColumns();
