// Test script focused only on storage bucket access
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

async function testStorageBuckets() {
  console.log('=== TESTING STORAGE BUCKETS ===');
  
  try {
    // 1. List all buckets
    console.log('\n1. Listing all buckets...');
    
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      return;
    }
    
    console.log('Available buckets:');
    if (buckets && buckets.length > 0) {
      buckets.forEach(bucket => {
        console.log(`- ${bucket.name} (ID: ${bucket.id})`);
      });
    } else {
      console.log('No buckets found.');
    }
    
    // 2. Try all bucket names from the screenshot
    const bucketNames = ['Project Media', 'projectmedia', 'project_media', 'project-media'];
    
    for (const bucketName of bucketNames) {
      console.log(`\n2. Testing upload to "${bucketName}" bucket...`);
      
      const fileName = `test-${Date.now()}.jpg`;
      const fileBuffer = fs.readFileSync(testImagePath);
      
      try {
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from(bucketName)
          .upload(fileName, fileBuffer, {
            contentType: 'image/jpeg'
          });
        
        if (uploadError) {
          console.error(`Error uploading to "${bucketName}":`, uploadError);
        } else {
          console.log(`✅ Successfully uploaded to "${bucketName}" bucket!`);
          console.log('Upload data:', uploadData);
          
          // Get the public URL
          const { data: publicUrlData } = supabase
            .storage
            .from(bucketName)
            .getPublicUrl(fileName);
          
          console.log('Public URL:', publicUrlData.publicUrl);
          
          // This bucket works! Update the instructions
          console.log(`\n=== SUCCESS! ===`);
          console.log(`The "${bucketName}" bucket is working correctly!`);
          console.log(`Please update the BidCardForm.tsx file to use this bucket name.`);
          
          return;
        }
      } catch (error) {
        console.error(`Unexpected error with "${bucketName}":`, error);
      }
    }
    
    console.log('\n=== STORAGE BUCKET CONFIGURATION NEEDED ===');
    console.log('None of the tested bucket names worked.');
    console.log('Please follow these steps to configure your storage bucket:');
    console.log('1. Go to Storage in the Supabase dashboard');
    console.log('2. Click on the bucket you want to use (e.g., "projectmedia")');
    console.log('3. Go to the "Policies" tab');
    console.log('4. Create the following policies:');
    console.log('   - SELECT (download): Allow public access - Policy: true');
    console.log('   - INSERT (upload): Allow public access - Policy: true');
    console.log('   - UPDATE: Allow public access - Policy: true');
    console.log('   - DELETE: Allow public access - Policy: true');
    
  } catch (error) {
    console.error('Unexpected error during testing:', error);
  }
}

// Run the test
testStorageBuckets();
