// Script to check and fix storage bucket issues
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

async function fixStorageBucket() {
  console.log('=== CHECKING AND FIXING STORAGE BUCKET ===');
  
  try {
    // 1. List all buckets
    console.log('\n1. Listing all storage buckets...');
    
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }
    
    console.log('Available buckets:');
    buckets.forEach(bucket => {
      console.log(`- ${bucket.name} (ID: ${bucket.id})`);
    });
    
    // 2. Check for Project Media bucket
    const projectMediaBucket = buckets.find(b => b.name === 'Project Media');
    
    if (!projectMediaBucket) {
      console.log('\nProject Media bucket not found. Creating it...');
      
      try {
        const { data: newBucket, error: createError } = await supabase.storage.createBucket('Project Media', {
          public: true
        });
        
        if (createError) {
          console.error('Error creating bucket:', createError);
          
          // Try alternative approach - create with different name
          console.log('\nTrying alternative approach - creating with different name...');
          
          const { data: altBucket, error: altError } = await supabase.storage.createBucket('project_media', {
            public: true
          });
          
          if (altError) {
            console.error('Error creating alternative bucket:', altError);
          } else {
            console.log('✅ Alternative bucket created successfully!');
            console.log('Bucket data:', altBucket);
            
            // Update BidCardForm to use this bucket name
            console.log('\nPlease update BidCardForm.tsx to use "project_media" as the bucket name.');
          }
        } else {
          console.log('✅ Project Media bucket created successfully!');
          console.log('Bucket data:', newBucket);
        }
      } catch (error) {
        console.error('Unexpected error creating bucket:', error);
      }
    } else {
      console.log('\nProject Media bucket exists!');
      
      // 3. Test bucket access
      console.log('\n3. Testing bucket access...');
      
      const testFileName = `test-${Date.now()}.txt`;
      const testContent = 'This is a test file to verify bucket access.';
      
      try {
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('Project Media')
          .upload(testFileName, testContent);
        
        if (uploadError) {
          console.error('Error uploading test file:', uploadError);
          
          // Try alternative approach - check if bucket name case is an issue
          console.log('\nTrying alternative approach - checking bucket name case...');
          
          // Try all possible case variations
          const variations = [
            'project media',
            'Project media',
            'project Media',
            'PROJECT MEDIA',
            'project_media',
            'Project_Media'
          ];
          
          for (const variation of variations) {
            console.log(`Trying bucket name: "${variation}"...`);
            
            const { data: varData, error: varError } = await supabase
              .storage
              .from(variation)
              .upload(`test-${Date.now()}.txt`, testContent);
            
            if (!varError) {
              console.log(`✅ Success with bucket name: "${variation}"!`);
              console.log('Upload data:', varData);
              
              // Update BidCardForm to use this bucket name
              console.log(`\nPlease update BidCardForm.tsx to use "${variation}" as the bucket name.`);
              break;
            }
          }
        } else {
          console.log('✅ Test file uploaded successfully!');
          console.log('Upload data:', uploadData);
          
          // Get the public URL
          const { data: publicUrlData } = supabase
            .storage
            .from('Project Media')
            .getPublicUrl(testFileName);
          
          console.log('Public URL:', publicUrlData.publicUrl);
        }
      } catch (error) {
        console.error('Unexpected error testing bucket:', error);
      }
    }
    
    console.log('\n=== STORAGE BUCKET CHECK COMPLETED ===');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the function
fixStorageBucket();
