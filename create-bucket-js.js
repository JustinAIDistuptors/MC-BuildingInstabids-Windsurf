// Script to create the storage bucket using the JavaScript client
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

async function createBucket() {
  console.log('=== CREATING STORAGE BUCKET ===');
  
  try {
    // 1. List existing buckets
    console.log('\n1. Listing existing buckets...');
    
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }
    
    console.log('Existing buckets:');
    if (buckets && buckets.length > 0) {
      buckets.forEach(bucket => {
        console.log(`- ${bucket.name} (ID: ${bucket.id})`);
      });
    } else {
      console.log('No buckets found.');
    }
    
    // 2. Check if our bucket already exists
    const bucketName = 'project_media';
    const bucketExists = buckets && buckets.some(b => b.name === bucketName);
    
    if (bucketExists) {
      console.log(`\nBucket '${bucketName}' already exists.`);
    } else {
      // 3. Create the bucket
      console.log(`\n2. Creating bucket '${bucketName}'...`);
      
      const { data: newBucket, error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true
      });
      
      if (createError) {
        console.error('Error creating bucket:', createError);
        
        // Try alternative approaches
        console.log('\nTrying alternative approaches...');
        
        // Try with different bucket names
        const alternativeNames = [
          'projectmedia',
          'project-media',
          'media',
          'uploads',
          'files'
        ];
        
        for (const name of alternativeNames) {
          console.log(`Trying to create bucket '${name}'...`);
          
          const { data: altBucket, error: altError } = await supabase.storage.createBucket(name, {
            public: true
          });
          
          if (!altError) {
            console.log(`✅ Successfully created bucket '${name}'!`);
            console.log('Bucket data:', altBucket);
            
            console.log(`\nPlease update BidCardForm.tsx to use '${name}' as the bucket name.`);
            return;
          }
        }
        
        console.log('\nAll attempts to create a bucket failed.');
        console.log('This might be due to permission issues with your Supabase account.');
        console.log('Please try creating the bucket manually in the Supabase dashboard:');
        console.log('1. Go to Storage in the Supabase dashboard');
        console.log('2. Click "Create a new bucket"');
        console.log('3. Name it "project_media" (lowercase, no spaces)');
        console.log('4. Check "Public bucket" to make it public');
        console.log('5. Click "Create bucket"');
      } else {
        console.log('✅ Bucket created successfully!');
        console.log('Bucket data:', newBucket);
      }
    }
    
    // 4. Update policies
    console.log('\n3. Setting up storage policies...');
    console.log('This needs to be done in the Supabase dashboard or SQL editor.');
    console.log('Please run the SQL from storage-policy.sql in the Supabase SQL Editor.');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the function
createBucket();
