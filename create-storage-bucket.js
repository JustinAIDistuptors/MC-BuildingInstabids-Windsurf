// Script to create the project-media storage bucket in Supabase
require('dotenv').config({ path: './instabids/.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function createBucket() {
  try {
    console.log('Creating project-media bucket...');
    
    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError.message);
      return;
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === 'project-media');
    
    if (bucketExists) {
      console.log('Bucket already exists, updating permissions...');
      
      // Update bucket to be public
      const { error: updateError } = await supabase.storage.updateBucket('project-media', {
        public: true
      });
      
      if (updateError) {
        console.error('Error updating bucket:', updateError.message);
      } else {
        console.log('Bucket permissions updated successfully');
      }
    } else {
      // Create new bucket
      const { data, error: createError } = await supabase.storage.createBucket('project-media', {
        public: true
      });
      
      if (createError) {
        console.error('Error creating bucket:', createError.message);
      } else {
        console.log('Bucket created successfully');
      }
    }
    
    // Set bucket policy to allow public access
    const { error: policyError } = await supabase.storage.from('project-media').createSignedUrl('dummy.txt', 60);
    
    if (policyError && policyError.message !== 'The resource was not found') {
      console.error('Error setting bucket policy:', policyError.message);
    } else {
      console.log('Storage setup complete');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
}

createBucket();
