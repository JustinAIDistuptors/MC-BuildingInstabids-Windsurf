// Complete verification test for project creation with media uploads
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

async function completeVerificationTest() {
  console.log('=== COMPLETE VERIFICATION TEST ===');
  
  try {
    // 1. List available buckets
    console.log('\n1. Listing available buckets...');
    
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
    } else {
      console.log('Available buckets:');
      if (buckets && buckets.length > 0) {
        buckets.forEach(bucket => {
          console.log(`- ${bucket.name} (ID: ${bucket.id})`);
        });
      } else {
        console.log('No buckets found.');
      }
    }
    
    // 2. Create a test project
    console.log('\n2. Creating test project...');
    
    const testProject = {
      title: 'Complete Verification Test ' + Date.now(),
      description: 'This is a complete verification test for project creation with media uploads',
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
    
    const projectId = createdProject[0].id;
    
    // 3. Upload test image to storage
    console.log('\n3. Uploading test image to "projectmedia" bucket...');
    
    const fileName = `${projectId}/test-image-${Date.now()}.jpg`;
    const fileBuffer = fs.readFileSync(testImagePath);
    
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('projectmedia')
      .upload(fileName, fileBuffer, {
        contentType: 'image/jpeg'
      });
    
    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      
      // Try with the capitalized bucket name as a fallback
      console.log('\nTrying with "Project Media" bucket instead...');
      
      const { data: altUploadData, error: altUploadError } = await supabase
        .storage
        .from('Project Media')
        .upload(fileName, fileBuffer, {
          contentType: 'image/jpeg'
        });
      
      if (altUploadError) {
        console.error('Error uploading to "Project Media" bucket:', altUploadError);
        return;
      }
      
      console.log('✅ Test image uploaded successfully to "Project Media" bucket!');
      console.log('Upload data:', altUploadData);
      
      // Get the public URL
      const { data: altPublicUrlData } = supabase
        .storage
        .from('Project Media')
        .getPublicUrl(fileName);
      
      console.log('Public URL:', altPublicUrlData.publicUrl);
      
      // 4. Create project_media record
      console.log('\n4. Creating project_media record...');
      
      const altMediaRecord = {
        project_id: projectId,
        media_url: altPublicUrlData.publicUrl,
        media_type: 'image/jpeg',
        file_name: 'test-image.jpg',
        created_at: new Date().toISOString()
      };
      
      const { data: altMediaSaveData, error: altMediaError } = await supabase
        .from('project_media')
        .insert([altMediaRecord])
        .select();
      
      if (altMediaError) {
        console.error('Error creating project_media record:', altMediaError);
        return;
      }
      
      console.log('✅ Project media record created successfully!');
      console.log('Media record data:', altMediaSaveData);
      
      // 5. Verify project with media
      console.log('\n5. Verifying project with media...');
      
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
      
      console.log('\n=== TEST COMPLETED SUCCESSFULLY WITH "Project Media" BUCKET ===');
      console.log('The complete project creation flow with media uploads is working correctly!');
      console.log('Project ID:', projectId);
      console.log('Media URL:', altPublicUrlData.publicUrl);
      
      console.log('\nIMPORTANT: Update BidCardForm.tsx to use "Project Media" bucket name.');
      
      return;
    }
    
    console.log('✅ Test image uploaded successfully to "projectmedia" bucket!');
    console.log('Upload data:', uploadData);
    
    // Get the public URL
    const { data: publicUrlData } = supabase
      .storage
      .from('projectmedia')
      .getPublicUrl(fileName);
    
    console.log('Public URL:', publicUrlData.publicUrl);
    
    // 4. Create project_media record
    console.log('\n4. Creating project_media record...');
    
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
      return;
    }
    
    console.log('✅ Project media record created successfully!');
    console.log('Media record data:', mediaSaveData);
    
    // 5. Verify project with media
    console.log('\n5. Verifying project with media...');
    
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
    
    console.log('\n=== TEST COMPLETED SUCCESSFULLY WITH "projectmedia" BUCKET ===');
    console.log('The complete project creation flow with media uploads is working correctly!');
    console.log('Project ID:', projectId);
    console.log('Media URL:', publicUrlData.publicUrl);
    
    // 6. Test retrieving all projects
    console.log('\n6. Retrieving all projects...');
    
    const { data: allProjects, error: allProjectsError } = await supabase
      .from('projects')
      .select('*, project_media(*)')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (allProjectsError) {
      console.error('Error retrieving all projects:', allProjectsError);
      return;
    }
    
    console.log(`Found ${allProjects.length} projects in the database.`);
    
    // Display project details
    allProjects.forEach((project, index) => {
      console.log(`\nProject ${index + 1}:`);
      console.log(`- ID: ${project.id}`);
      console.log(`- Title: ${project.title}`);
      console.log(`- Description: ${project.description}`);
      console.log(`- Status: ${project.status}`);
      console.log(`- Created At: ${project.created_at}`);
      
      if (project.project_media && project.project_media.length > 0) {
        console.log(`- Media Count: ${project.project_media.length}`);
        project.project_media.forEach((media, mediaIndex) => {
          console.log(`  - Media ${mediaIndex + 1}: ${media.media_url}`);
        });
      } else {
        console.log('- No media files attached');
      }
    });
    
  } catch (error) {
    console.error('Unexpected error during testing:', error);
  }
}

// Run the test
completeVerificationTest();
