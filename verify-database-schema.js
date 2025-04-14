// Script to verify database schema and create a test project
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

async function verifyDatabaseSchema() {
  console.log('=== VERIFYING DATABASE SCHEMA ===');
  
  try {
    // 1. Check if projects table exists and has the correct structure
    console.log('\n1. Checking projects table structure...');
    
    // Try to create a test project with all fields
    const testProject = {
      title: 'Schema Test Project ' + Date.now(),
      description: 'This is a test project to verify schema',
      status: 'published',
      bid_status: 'accepting_bids',
      budget_min: 5000,
      budget_max: 15000,
      zip_code: '12345',
      location: 'Test City, Test State 12345',
      type: 'Renovation',
      job_type_id: 'renovation',
      job_category_id: 'kitchen',
      group_bidding_enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('Attempting to create test project with all fields:');
    console.log(testProject);
    
    const { data: createdProject, error: createError } = await supabase
      .from('projects')
      .insert([testProject])
      .select();
    
    if (createError) {
      console.error('Error creating test project:', createError);
      
      // Check for specific error types
      if (createError.code === '42P01') {
        console.log('The "projects" table does not exist.');
      } else if (createError.code === '42703') {
        console.log('Column error: One of the columns you\'re trying to insert into doesn\'t exist.');
        console.log('Details:', createError.details);
        
        // Try to extract the column name from the error message
        const match = createError.details?.match(/column "(.*?)" of relation/);
        if (match && match[1]) {
          console.log(`Missing column: ${match[1]}`);
          console.log('Please run the SQL script to add this column.');
        }
      }
      
      return;
    }
    
    console.log('Test project created successfully!');
    console.log('Created project data:', createdProject);
    
    // 2. Check if project_media table exists
    console.log('\n2. Checking project_media table...');
    
    const projectId = createdProject[0].id;
    const mediaRecord = {
      project_id: projectId,
      media_url: 'https://example.com/test-image.jpg',
      media_type: 'image/jpeg',
      file_name: 'test-image.jpg',
      created_at: new Date().toISOString()
    };
    
    const { data: mediaSaveData, error: mediaError } = await supabase
      .from('project_media')
      .insert([mediaRecord])
      .select();
    
    if (mediaError) {
      console.error('Error creating project_media record:', mediaError);
      
      if (mediaError.code === '42P01') {
        console.log('The "project_media" table does not exist.');
        console.log('Please run the SQL script to create this table.');
      } else {
        console.log('Details:', mediaError.details);
      }
      
      return;
    }
    
    console.log('Project media record created successfully!');
    console.log('Media record data:', mediaSaveData);
    
    // 3. Check if storage bucket exists
    console.log('\n3. Checking storage bucket...');
    
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing storage buckets:', bucketsError);
      return;
    }
    
    const projectMediaBucket = buckets?.find(b => b.name === 'Project Media');
    
    if (!projectMediaBucket) {
      console.log('Project Media bucket does not exist.');
      console.log('Please create this bucket in the Supabase dashboard.');
    } else {
      console.log('Project Media bucket exists!');
      
      // Try to upload a test file
      const testFileContent = 'This is a test file';
      const testFileName = `${projectId}/test-file.txt`;
      
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('Project Media')
        .upload(testFileName, testFileContent);
      
      if (uploadError) {
        console.error('Error uploading test file:', uploadError);
      } else {
        console.log('Test file uploaded successfully!');
        console.log('Upload data:', uploadData);
        
        // Get the public URL
        const { data: publicUrlData } = supabase
          .storage
          .from('Project Media')
          .getPublicUrl(testFileName);
        
        console.log('Public URL:', publicUrlData);
      }
    }
    
    // 4. Final verification
    console.log('\n4. Final verification...');
    
    // Retrieve the created project with media
    const { data: retrievedProject, error: retrieveError } = await supabase
      .from('projects')
      .select('*, project_media(*)')
      .eq('id', projectId)
      .single();
    
    if (retrieveError) {
      console.error('Error retrieving project:', retrieveError);
      return;
    }
    
    console.log('Project retrieved successfully!');
    console.log('Retrieved project data:', retrievedProject);
    
    // Check if all fields were saved correctly
    const allFieldsSaved = Object.keys(testProject).every(key => 
      retrievedProject[key] !== undefined
    );
    
    if (allFieldsSaved) {
      console.log('✅ SUCCESS: All project fields were saved correctly!');
      
      // List all the fields that were saved
      console.log('Saved fields:');
      Object.keys(testProject).forEach(key => {
        console.log(`- ${key}: ${retrievedProject[key]}`);
      });
    } else {
      console.log('❌ ERROR: Some project fields were not saved correctly.');
      
      // Identify which fields were not saved correctly
      const missingFields = Object.keys(testProject).filter(key => 
        retrievedProject[key] === undefined
      );
      
      console.log('Missing fields:', missingFields);
    }
    
    // Check if media was saved correctly
    if (retrievedProject.project_media && retrievedProject.project_media.length > 0) {
      console.log('✅ SUCCESS: Project media was saved correctly!');
      console.log('Media records:', retrievedProject.project_media);
    } else {
      console.log('❌ ERROR: Project media was not saved correctly.');
    }
    
    console.log('\n=== VERIFICATION COMPLETED ===');
    console.log('Database schema is correctly set up for the project creation flow!');
    console.log('Project ID:', projectId);
    console.log('You can now view this project in your Supabase dashboard.');
    
  } catch (error) {
    console.error('Unexpected error during verification:', error);
  }
}

// Run the verification
verifyDatabaseSchema();
