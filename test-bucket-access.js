// Direct bucket testing script
// This will test different bucket names to find which one works
const { createClient } = require('@supabase/supabase-js');

// Supabase credentials from your memory
const supabaseUrl = 'https://heqifyikpitzpwyasvop.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlcWlmeWlrcGl0enB3eWFzdm9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NjI3NjMsImV4cCI6MjA1OTQzODc2M30.5Ew9RyW6umw_xB-mubmcp30Qo9eWOQ8J4fuk8li7yzo';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlcWlmeWlrcGl0enB3eWFzdm9wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mzg2Mjc2MywiZXhwIjoyMDU5NDM4NzYzfQ.6bz0K2rUfI9IA3Ty4FCnCJrXZirgZJ3yF2YYzzcskME';

// Create both regular and admin clients
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Bucket names to test
const bucketVariations = [
  'message-attachments',
  'Message Attachments',
  'message_attachments',
  'messageattachments'
];

// Create a test file
const createTestContent = () => {
  return new Uint8Array(Buffer.from(`Test file created at ${new Date().toISOString()}`));
};

// Function to list all buckets
async function listAllBuckets() {
  console.log('=== LISTING ALL BUCKETS ===');
  
  try {
    // Try with regular client
    console.log('Using regular client:');
    const { data: regularData, error: regularError } = await supabase.storage.listBuckets();
    
    if (regularError) {
      console.error('Error listing buckets with regular client:', regularError);
    } else {
      console.log('Found buckets:', regularData.map(b => `${b.name} (public: ${b.public})`).join(', '));
    }
    
    // Try with admin client
    console.log('\nUsing admin client:');
    const { data: adminData, error: adminError } = await supabaseAdmin.storage.listBuckets();
    
    if (adminError) {
      console.error('Error listing buckets with admin client:', adminError);
    } else {
      console.log('Found buckets:', adminData.map(b => `${b.name} (public: ${b.public})`).join(', '));
    }
  } catch (err) {
    console.error('Exception listing buckets:', err);
  }
}

// Function to test file upload to a specific bucket
async function testBucketUpload(bucketName, useAdmin = false) {
  console.log(`\n=== TESTING UPLOAD TO BUCKET: "${bucketName}" (${useAdmin ? 'admin' : 'regular'} client) ===`);
  
  const client = useAdmin ? supabaseAdmin : supabase;
  const testContent = createTestContent();
  const filePath = `test-uploads/test-${Date.now()}.txt`;
  
  try {
    console.log(`Attempting to upload to ${bucketName}/${filePath}`);
    
    const { data, error } = await client.storage
      .from(bucketName)
      .upload(filePath, testContent, {
        contentType: 'text/plain',
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      console.error(`Error uploading to ${bucketName}:`, error);
      return false;
    }
    
    console.log(`SUCCESS! File uploaded to ${bucketName}/${filePath}`);
    
    // Get public URL
    const { data: urlData } = client.storage
      .from(bucketName)
      .getPublicUrl(filePath);
    
    console.log(`Public URL: ${urlData?.publicUrl}`);
    return true;
  } catch (err) {
    console.error(`Exception uploading to ${bucketName}:`, err);
    return false;
  }
}

// Main test function
async function runTests() {
  // First, list all buckets
  await listAllBuckets();
  
  // Test each bucket variation with both clients
  for (const bucket of bucketVariations) {
    // Test with regular client
    const regularSuccess = await testBucketUpload(bucket, false);
    
    // Test with admin client
    const adminSuccess = await testBucketUpload(bucket, true);
    
    console.log(`\nResults for "${bucket}":`);
    console.log(`- Regular client: ${regularSuccess ? 'SUCCESS' : 'FAILED'}`);
    console.log(`- Admin client: ${adminSuccess ? 'SUCCESS' : 'FAILED'}`);
  }
  
  console.log('\n=== TESTS COMPLETED ===');
}

// Run the tests
console.log('Starting bucket tests...');
runTests()
  .catch(err => {
    console.error('Test failed with error:', err);
  });
