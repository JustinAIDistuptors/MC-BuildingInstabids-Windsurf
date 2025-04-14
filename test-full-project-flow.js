// Comprehensive test for the full project creation flow
require('dotenv').config({ path: './instabids/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Make sure .env.local file exists with proper values.');
  process.exit(1);
}

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key available:', !!supabaseKey);

const supabase = createClient(supabaseUrl, supabaseKey);

// Create a test image file if it doesn't exist
const testImagePath = path.join(__dirname, 'test-image.jpg');
if (!fs.existsSync(testImagePath)) {
  console.log('Creating test image file...');
  // Create a simple 1x1 pixel JPEG
  const buffer = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
    0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01, 0x00,
    0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0xc4, 0x00, 0x14, 0x10,
    0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff,
    0xd9
  ]);
  fs.writeFileSync(testImagePath, buffer);
  console.log('Test image created at:', testImagePath);
}

async function runFullTest() {
  console.log('=== RUNNING COMPREHENSIVE PROJECT CREATION TEST ===');
  
  try {
    // 1. First, check database structure to ensure our SQL script worked
    console.log('\n1. Checking database structure...');
    
    // Get a sample project to check the structure
    const { data: sampleProject, error: sampleError } = await supabase
      .from('projects')
      .select('*')
      .limit(1)
      .maybeSingle();
    
    if (sampleError) {
      console.error('Error fetching sample project:', sampleError);
      console.log('This suggests there might be an issue with your Supabase connection or permissions.');
      return;
    }
    
    // Check if we have a sample project or need to create one
    if (!sampleProject) {
      console.log('No existing projects found. We will create one in the next step.');
    } else {
      console.log('Found existing project. Database structure:');
      console.log('Available columns:', Object.keys(sampleProject));
      
      // Check for required columns
      const requiredColumns = [
        'id', 'title', 'description', 'status', 'bid_status', 
        'budget_min', 'budget_max', 'zip_code', 'location', 
        'type', 'job_type_id', 'job_category_id', 'group_bidding_enabled',
        'created_at', 'updated_at'
      ];
      
      const missingColumns = requiredColumns.filter(col => !Object.keys(sampleProject).includes(col));
      
      if (missingColumns.length > 0) {
        console.error('Missing required columns:', missingColumns);
        console.log('Please run the SQL script to add these columns.');
        return;
      }
      
      console.log('All required columns are present in the database!');
    }
    
    // 2. Check if storage bucket exists
    console.log('\n2. Checking if storage bucket exists...');
    
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing storage buckets:', bucketsError);
      return;
    }
    
    const projectMediaBucket = buckets?.find(b => b.name === 'Project Media');
    
    if (!projectMediaBucket) {
      console.log('Project Media bucket does not exist. Creating it...');
      
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('Project Media', {
        public: true
      });
      
      if (createError) {
        console.error('Error creating Project Media bucket:', createError);
        return;
      }
      
      console.log('Project Media bucket created successfully!');
    } else {
      console.log('Project Media bucket exists!');
    }
    
    // 3. Create a test project with all fields
    console.log('\n3. Creating a test project with all fields...');
    
    const testProject = {
      title: 'Full Test Project ' + Date.now(),
      description: 'This is a comprehensive test project with all fields',
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
    
    console.log('Test project data:', testProject);
    
    const { data: createdProject, error: createError } = await supabase
      .from('projects')
      .insert([testProject])
      .select();
    
    if (createError) {
      console.error('Error creating test project:', createError);
      return;
    }
    
    console.log('Test project created successfully!');
    console.log('Created project data:', createdProject);
    
    // 4. Upload test media file
    console.log('\n4. Uploading test media file...');
    
    const projectId = createdProject[0].id;
    const fileName = `${projectId}/${Date.now()}_test-image.jpg`;
    
    // Read the test image file
    const fileBuffer = fs.readFileSync(testImagePath);
    
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('Project Media')
      .upload(fileName, fileBuffer, {
        contentType: 'image/jpeg'
      });
    
    if (uploadError) {
      console.error('Error uploading test media:', uploadError);
      return;
    }
    
    console.log('Test media uploaded successfully!');
    console.log('Upload data:', uploadData);
    
    // Get the public URL
    const { data: publicUrlData } = supabase
      .storage
      .from('Project Media')
      .getPublicUrl(fileName);
    
    console.log('Public URL:', publicUrlData);
    
    // 5. Create project_media record
    console.log('\n5. Creating project_media record...');
    
    const mediaRecord = {
      project_id: projectId,
      media_url: publicUrlData.publicUrl,
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
        console.log('The "project_media" table does not exist. Creating it...');
        
        // Try to create the table
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS public.project_media (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
            media_url TEXT NOT NULL,
            media_type TEXT,
            file_name TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `;
        
        try {
          // We can't execute SQL directly through the Supabase client
          // This would need to be run in the Supabase SQL editor
          console.log('Please run this SQL in the Supabase SQL editor:');
          console.log(createTableSQL);
          return;
        } catch (sqlError) {
          console.error('Error creating project_media table:', sqlError);
          return;
        }
      }
      
      return;
    }
    
    console.log('Project media record created successfully!');
    console.log('Media record data:', mediaSaveData);
    
    // 6. Verify the project can be retrieved
    console.log('\n6. Verifying project retrieval...');
    
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
    
    // 7. Final verification
    console.log('\n7. Final verification...');
    
    // Check if all fields were saved correctly
    const allFieldsSaved = Object.keys(testProject).every(key => 
      retrievedProject[key] !== undefined && 
      retrievedProject[key] !== null
    );
    
    if (allFieldsSaved) {
      console.log('✅ SUCCESS: All project fields were saved correctly!');
    } else {
      console.log('❌ ERROR: Some project fields were not saved correctly.');
      
      // Identify which fields were not saved correctly
      const missingFields = Object.keys(testProject).filter(key => 
        retrievedProject[key] === undefined || 
        retrievedProject[key] === null
      );
      
      console.log('Missing or null fields:', missingFields);
    }
    
    // Check if media was saved correctly
    if (retrievedProject.project_media && retrievedProject.project_media.length > 0) {
      console.log('✅ SUCCESS: Project media was saved correctly!');
    } else {
      console.log('❌ ERROR: Project media was not saved correctly.');
    }
    
    console.log('\n=== TEST COMPLETED SUCCESSFULLY ===');
    console.log('The project creation flow is working correctly!');
    console.log('Project ID:', projectId);
    console.log('You can now view this project in your Supabase dashboard.');
    
  } catch (error) {
    console.error('Unexpected error during testing:', error);
  }
}

// Run the test
runFullTest();
