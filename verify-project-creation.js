// Script to verify project creation and storage in Supabase
require('dotenv').config({ path: './instabids/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials.');
  process.exit(1);
}

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key available:', !!supabaseKey);

const supabase = createClient(supabaseUrl, supabaseKey);

// Create a test image file
const testImagePath = path.join(__dirname, 'test-image.jpg');
if (!fs.existsSync(testImagePath)) {
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

async function verifyProjectCreation() {
  console.log('=== VERIFYING PROJECT CREATION ===');
  
  try {
    // 1. Create a test project with all required fields
    console.log('\n1. Creating test project...');
    
    const testProject = {
      title: 'Verification Test Project ' + Date.now(),
      description: 'This project tests the complete project creation flow',
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
    
    console.log('Test project data:', testProject);
    
    const { data: createdProject, error: createError } = await supabase
      .from('projects')
      .insert([testProject])
      .select();
    
    if (createError) {
      console.error('Error creating test project:', createError);
      return;
    }
    
    console.log('✅ Test project created successfully!');
    console.log('Project ID:', createdProject[0].id);
    
    // 2. Check if storage bucket exists or create it
    console.log('\n2. Checking for storage bucket...');
    
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      return;
    }
    
    let projectMediaBucket = buckets.find(b => b.name === 'Project Media');
    
    if (!projectMediaBucket) {
      console.log('Creating Project Media bucket...');
      
      const { data: newBucket, error: createBucketError } = await supabase.storage.createBucket('Project Media', {
        public: true
      });
      
      if (createBucketError) {
        console.error('Error creating bucket:', createBucketError);
        return;
      }
      
      console.log('✅ Project Media bucket created successfully!');
    } else {
      console.log('✅ Project Media bucket already exists');
    }
    
    // 3. Upload test image to storage
    console.log('\n3. Uploading test image...');
    
    const projectId = createdProject[0].id;
    const fileName = `${projectId}/test-image-${Date.now()}.jpg`;
    
    const fileBuffer = fs.readFileSync(testImagePath);
    
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('Project Media')
      .upload(fileName, fileBuffer, {
        contentType: 'image/jpeg'
      });
    
    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      return;
    }
    
    console.log('✅ Test image uploaded successfully!');
    
    // Get the public URL
    const { data: publicUrlData } = supabase
      .storage
      .from('Project Media')
      .getPublicUrl(fileName);
    
    console.log('Public URL:', publicUrlData.publicUrl);
    
    // 4. Create project_media record
    console.log('\n4. Creating project_media record...');
    
    // Check if project_media table exists
    const { data: mediaCheck, error: mediaCheckError } = await supabase
      .from('project_media')
      .select('count')
      .limit(1);
    
    if (mediaCheckError && mediaCheckError.code === '42P01') {
      console.log('Creating project_media table...');
      
      // We can't create tables directly through the JS client
      console.log('Please run this SQL in the Supabase SQL Editor:');
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
      `);
    } else {
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
      } else {
        console.log('✅ Project media record created successfully!');
      }
    }
    
    // 5. Verify project is in the database
    console.log('\n5. Verifying project in database...');
    
    const { data: retrievedProject, error: retrieveError } = await supabase
      .from('projects')
      .select('*, project_media(*)')
      .eq('id', projectId)
      .single();
    
    if (retrieveError) {
      console.error('Error retrieving project:', retrieveError);
      return;
    }
    
    console.log('✅ Project retrieved successfully!');
    console.log('Project data:', retrievedProject);
    
    if (retrievedProject.project_media && retrievedProject.project_media.length > 0) {
      console.log('✅ Project media also retrieved successfully!');
      console.log('Media records:', retrievedProject.project_media);
    }
    
    // 6. List all projects to verify it appears in the list
    console.log('\n6. Listing all projects...');
    
    const { data: allProjects, error: listError } = await supabase
      .from('projects')
      .select('id, title, description, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (listError) {
      console.error('Error listing projects:', listError);
      return;
    }
    
    console.log('Recent projects in database:');
    allProjects.forEach(p => {
      console.log(`- ${p.id}: ${p.title} (${p.status}) - Created: ${p.created_at}`);
    });
    
    console.log('\n=== VERIFICATION COMPLETED SUCCESSFULLY ===');
    console.log('The project creation flow is working correctly!');
    console.log('You can now view your projects in the Supabase dashboard or in the app.');
    
  } catch (error) {
    console.error('Unexpected error during verification:', error);
  }
}

// Run the verification
verifyProjectCreation();
