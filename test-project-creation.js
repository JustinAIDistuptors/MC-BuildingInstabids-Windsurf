// Direct test of project creation in Supabase
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

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key available:', !!supabaseKey);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProjectCreation() {
  console.log('Testing project creation in Supabase...');
  
  try {
    // 1. First, check if we can connect to Supabase and access the projects table
    console.log('\n1. Checking connection to Supabase...');
    
    const { data: healthCheck, error: healthError } = await supabase.from('projects').select('count').limit(1);
    
    if (healthError) {
      console.error('Error connecting to Supabase projects table:', healthError);
      console.log('This suggests there might be an issue with your Supabase credentials or table permissions.');
      return;
    }
    
    console.log('Successfully connected to Supabase projects table!');
    
    // 2. Create a test project
    console.log('\n2. Creating a test project...');
    
    const testProject = {
      title: 'Test Project ' + Date.now(),
      description: 'This is a test project created via direct API call',
      status: 'published',
      bid_status: 'accepting_bids',
      budget_min: 1000,
      budget_max: 5000,
      zip_code: '12345',
      location: 'Test Location',
      type: 'Test Type',
      job_type_id: 'test',
      job_category_id: 'test',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('Test project data:', testProject);
    
    const { data: createdProject, error: createError } = await supabase
      .from('projects')
      .insert([testProject])
      .select();
    
    if (createError) {
      console.error('Error creating test project:', createError);
      
      // Check for specific error types
      if (createError.code === '42P01') {
        console.log('The "projects" table does not exist. You need to create it first.');
      } else if (createError.code === '42703') {
        console.log('Column error: One of the columns you\'re trying to insert into doesn\'t exist.');
        console.log('Make sure all columns in your test project match the actual table structure.');
      } else if (createError.code === '23505') {
        console.log('Unique constraint violation: A project with this ID already exists.');
      } else if (createError.code.startsWith('PGRST')) {
        console.log('PostgREST error: This is likely a permission issue with Supabase RLS policies.');
      }
      
      return;
    }
    
    console.log('Test project created successfully!');
    console.log('Created project data:', createdProject);
    
    // 3. Verify the project was created by fetching it
    console.log('\n3. Verifying project creation...');
    
    if (!createdProject || createdProject.length === 0) {
      console.log('No project data returned after creation, but no error occurred.');
      console.log('This might indicate a permission issue with the return value.');
      
      // Try to fetch all projects to see if it's there
      const { data: allProjects, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (fetchError) {
        console.error('Error fetching projects:', fetchError);
        return;
      }
      
      console.log('Latest projects in database:', allProjects);
      
      if (allProjects && allProjects.length > 0) {
        console.log('Projects exist in the database, but there might be an issue with the insert return value.');
      } else {
        console.log('No projects found in the database. The insert may have failed silently.');
      }
    } else {
      console.log('Project verification successful!');
      
      // 4. Test uploading a mock image to storage
      console.log('\n4. Testing storage upload...');
      
      // Create a simple text file as a mock image
      const mockImageContent = 'This is a mock image file for testing purposes';
      const mockImageBuffer = Buffer.from(mockImageContent);
      
      const fileName = `test-project/${Date.now()}_test.txt`;
      
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('Project Media')  // Using the bucket name from your screenshot
        .upload(fileName, mockImageBuffer);
      
      if (uploadError) {
        console.error('Error uploading to storage:', uploadError);
        
        // Check for specific storage error types
        if (uploadError.statusCode === 404) {
          console.log('The storage bucket "Project Media" does not exist.');
        } else if (uploadError.statusCode === 403) {
          console.log('Permission denied: You don\'t have permission to upload to this bucket.');
        }
        
        return;
      }
      
      console.log('Mock image uploaded successfully!');
      console.log('Upload data:', uploadData);
      
      // Get the public URL
      const { data: publicUrlData } = supabase
        .storage
        .from('Project Media')
        .getPublicUrl(fileName);
      
      console.log('Public URL:', publicUrlData);
      
      // 5. Create a project_media record
      if (publicUrlData) {
        console.log('\n5. Creating project_media record...');
        
        const mediaRecord = {
          project_id: createdProject[0].id,
          media_url: publicUrlData.publicUrl,
          media_type: 'text/plain',
          file_name: 'test.txt',
          created_at: new Date().toISOString()
        };
        
        const { data: mediaSaveData, error: mediaError } = await supabase
          .from('project_media')
          .insert([mediaRecord]);
        
        if (mediaError) {
          console.error('Error creating project_media record:', mediaError);
          
          // Check for specific error types
          if (mediaError.code === '42P01') {
            console.log('The "project_media" table does not exist. You need to create it first.');
          } else if (mediaError.code === '42703') {
            console.log('Column error: One of the columns you\'re trying to insert into doesn\'t exist.');
          } else if (mediaError.code.startsWith('PGRST')) {
            console.log('PostgREST error: This is likely a permission issue with Supabase RLS policies.');
          }
          
          return;
        }
        
        console.log('Project media record created successfully!');
      }
    }
    
    console.log('\nAll tests completed!');
    
  } catch (error) {
    console.error('Unexpected error during testing:', error);
  }
}

// Run the test
testProjectCreation();
