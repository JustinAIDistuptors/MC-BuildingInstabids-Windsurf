// Complete Supabase Storage Reset Script
// This script will delete all existing buckets and create a fresh one
const { createClient } = require('@supabase/supabase-js');

// Supabase credentials
const supabaseUrl = 'https://heqifyikpitzpwyasvop.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlcWlmeWlrcGl0enB3eWFzdm9wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mzg2Mjc2MywiZXhwIjoyMDU5NDM4NzYzfQ.6bz0K2rUfI9IA3Ty4FCnCJrXZirgZJ3yF2YYzzcskME';

// Create admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// The bucket name we want to standardize on
const STANDARD_BUCKET_NAME = 'message-attachments';

// Function to delete all buckets
async function deleteAllBuckets() {
  console.log('=== DELETING ALL EXISTING BUCKETS ===');
  
  try {
    // List all buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return false;
    }
    
    console.log(`Found ${buckets.length} buckets to delete:`);
    console.log(buckets.map(b => `- ${b.name}`).join('\n'));
    
    // Delete each bucket
    for (const bucket of buckets) {
      console.log(`Deleting bucket: ${bucket.name}...`);
      
      try {
        // First, empty the bucket by deleting all files
        const { data: files, error: listFilesError } = await supabase.storage.from(bucket.name).list();
        
        if (!listFilesError && files && files.length > 0) {
          console.log(`  Deleting ${files.length} files from bucket...`);
          
          for (const file of files) {
            await supabase.storage.from(bucket.name).remove([file.name]);
          }
        }
        
        // Now delete the bucket
        const { error: deleteError } = await supabase.storage.deleteBucket(bucket.name);
        
        if (deleteError) {
          console.error(`  Error deleting bucket ${bucket.name}:`, deleteError);
        } else {
          console.log(`  Successfully deleted bucket: ${bucket.name}`);
        }
      } catch (err) {
        console.error(`  Exception deleting bucket ${bucket.name}:`, err);
      }
    }
    
    console.log('All buckets deleted successfully');
    return true;
  } catch (err) {
    console.error('Exception deleting buckets:', err);
    return false;
  }
}

// Function to create our standard bucket
async function createStandardBucket() {
  console.log(`\n=== CREATING STANDARD BUCKET: ${STANDARD_BUCKET_NAME} ===`);
  
  try {
    const { data, error } = await supabase.storage.createBucket(STANDARD_BUCKET_NAME, {
      public: true,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'application/zip'
      ]
    });
    
    if (error) {
      console.error(`Error creating bucket ${STANDARD_BUCKET_NAME}:`, error);
      return false;
    }
    
    console.log(`Successfully created bucket: ${STANDARD_BUCKET_NAME}`);
    return true;
  } catch (err) {
    console.error(`Exception creating bucket ${STANDARD_BUCKET_NAME}:`, err);
    return false;
  }
}

// Function to verify bucket works
async function verifyBucket() {
  console.log(`\n=== VERIFYING BUCKET: ${STANDARD_BUCKET_NAME} ===`);
  
  try {
    // Create a test file
    const testContent = new Uint8Array(Buffer.from(`Test file created at ${new Date().toISOString()}`));
    const filePath = `verification/test-${Date.now()}.txt`;
    
    console.log(`Uploading test file to ${STANDARD_BUCKET_NAME}/${filePath}...`);
    
    const { data, error } = await supabase.storage
      .from(STANDARD_BUCKET_NAME)
      .upload(filePath, testContent, {
        contentType: 'text/plain',
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      console.error(`Error uploading test file:`, error);
      return false;
    }
    
    console.log(`Test file uploaded successfully`);
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STANDARD_BUCKET_NAME)
      .getPublicUrl(filePath);
    
    console.log(`Public URL: ${urlData?.publicUrl}`);
    
    // Try to access the file
    console.log('Verifying file is publicly accessible...');
    
    try {
      const response = await fetch(urlData.publicUrl);
      if (response.ok) {
        console.log('File is publicly accessible!');
      } else {
        console.error(`Error accessing file: ${response.status} ${response.statusText}`);
      }
    } catch (fetchErr) {
      console.error('Error fetching file:', fetchErr);
    }
    
    return true;
  } catch (err) {
    console.error('Exception verifying bucket:', err);
    return false;
  }
}

// Main function
async function resetStorage() {
  console.log('Starting complete storage reset...');
  
  // Step 1: Delete all existing buckets
  const deletionSuccess = await deleteAllBuckets();
  if (!deletionSuccess) {
    console.error('Failed to delete all buckets. Continuing anyway...');
  }
  
  // Step 2: Create our standard bucket
  const creationSuccess = await createStandardBucket();
  if (!creationSuccess) {
    console.error('Failed to create standard bucket. Aborting.');
    return;
  }
  
  // Step 3: Verify the bucket works
  const verificationSuccess = await verifyBucket();
  if (!verificationSuccess) {
    console.error('Failed to verify bucket. Something is still wrong.');
    return;
  }
  
  console.log('\n=== STORAGE RESET COMPLETED SUCCESSFULLY ===');
  console.log(`Your standardized bucket "${STANDARD_BUCKET_NAME}" is ready to use.`);
  console.log('Make sure all your code uses this exact bucket name.');
}

// Run the reset
resetStorage().catch(err => {
  console.error('Reset failed with error:', err);
});
