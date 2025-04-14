// Script to diagnose database issues
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

async function diagnoseDatabase() {
  console.log('=== DIAGNOSING DATABASE ISSUES ===');
  
  try {
    // 1. Check if we can connect to Supabase
    console.log('\n1. Testing Supabase connection...');
    
    const { data: connectionTest, error: connectionError } = await supabase.auth.getSession();
    
    if (connectionError) {
      console.error('Connection error:', connectionError);
      return;
    }
    
    console.log('✅ Successfully connected to Supabase!');
    
    // 2. Check if the projects table exists
    console.log('\n2. Checking if projects table exists...');
    
    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select('count')
      .limit(1);
    
    if (projectsError) {
      console.error('Error accessing projects table:', projectsError);
      
      if (projectsError.code === '42P01') {
        console.log('❌ The projects table does not exist.');
        return;
      }
      
      return;
    }
    
    console.log('✅ Projects table exists!');
    
    // 3. Get the exact structure of the projects table
    console.log('\n3. Retrieving projects table structure...');
    
    // Try to get a single project to see the structure
    const { data: sampleProject, error: sampleError } = await supabase
      .from('projects')
      .select('*')
      .limit(1)
      .maybeSingle();
    
    if (sampleError) {
      console.error('Error retrieving sample project:', sampleError);
      return;
    }
    
    if (sampleProject) {
      console.log('Found a sample project with the following structure:');
      console.log(Object.keys(sampleProject));
    } else {
      console.log('No existing projects found. Let\'s try to create a minimal one.');
      
      // 4. Try to create a minimal project
      console.log('\n4. Testing minimal project creation...');
      
      const minimalProject = {
        title: 'Minimal Test Project',
        description: 'A minimal test project',
        status: 'published'
      };
      
      const { data: minData, error: minError } = await supabase
        .from('projects')
        .insert([minimalProject])
        .select();
      
      if (minError) {
        console.error('Error creating minimal project:', minError);
        
        if (minError.code === '23502') {
          console.log('❌ NOT NULL constraint violation. Some required fields are missing.');
          console.log('Details:', minError.details);
          
          // Try to extract the column name from the error message
          const match = minError.details?.match(/column "(.*?)" of relation/);
          if (match && match[1]) {
            console.log(`Missing required column: ${match[1]}`);
          }
          
          // Try with more fields based on the error
          console.log('\nTrying with additional fields...');
          
          const extendedProject = {
            ...minimalProject,
            user_id: '00000000-0000-0000-0000-000000000000', // Placeholder UUID
            created_by: '00000000-0000-0000-0000-000000000000', // Placeholder UUID
            owner_id: '00000000-0000-0000-0000-000000000000', // Placeholder UUID
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          const { data: extData, error: extError } = await supabase
            .from('projects')
            .insert([extendedProject])
            .select();
          
          if (extError) {
            console.error('Error creating extended project:', extError);
          } else {
            console.log('✅ Extended project created successfully!');
            console.log('Project structure:', Object.keys(extData[0]));
          }
        }
      } else {
        console.log('✅ Minimal project created successfully!');
        console.log('Project structure:', Object.keys(minData[0]));
      }
    }
    
    // 5. Check for project_media table
    console.log('\n5. Checking for project_media table...');
    
    const { data: mediaData, error: mediaError } = await supabase
      .from('project_media')
      .select('count')
      .limit(1);
    
    if (mediaError) {
      console.error('Error accessing project_media table:', mediaError);
      
      if (mediaError.code === '42P01') {
        console.log('❌ The project_media table does not exist.');
      }
    } else {
      console.log('✅ project_media table exists!');
    }
    
    // 6. Check for storage buckets
    console.log('\n6. Checking storage buckets...');
    
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing storage buckets:', bucketsError);
    } else {
      console.log('Available storage buckets:');
      buckets.forEach(bucket => {
        console.log(`- ${bucket.name}`);
      });
      
      const projectMediaBucket = buckets.find(b => b.name === 'Project Media');
      
      if (projectMediaBucket) {
        console.log('✅ Project Media bucket exists!');
      } else {
        console.log('❌ Project Media bucket does not exist.');
      }
    }
    
    console.log('\n=== DIAGNOSIS COMPLETED ===');
    console.log('Please review the results above to understand the current state of your database.');
    
  } catch (error) {
    console.error('Unexpected error during diagnosis:', error);
  }
}

// Run the diagnosis
diagnoseDatabase();
