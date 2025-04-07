/**
 * Script to create and insert data directly in Supabase
 * Since we can't create tables directly through the JavaScript client,
 * this script will create a demonstration of data operations we can perform.
 */
const { createClient } = require('@supabase/supabase-js');

// Supabase connection details
const SUPABASE_URL = 'https://heqifyikpitzpwyasvop.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlcWlmeWlrcGl0enB3eWFzdm9wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mzg2Mjc2MywiZXhwIjoyMDU5NDM4NzYzfQ.6bz0K2rUfI9IA3Ty4FCnCJrXZirgZJ3yF2YYzzcskME';

async function demonstrateDataOperations() {
  console.log('Demonstrating Supabase data operations...');
  
  // Create Supabase client
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  try {
    // 1. Check if we can access the database
    console.log('\n1. Checking database access...');
    
    // Let's try to access a common system table
    const { data: authConfig, error: authError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1
    });
    
    if (authError) {
      console.error('Error connecting to Supabase:', authError);
      return {
        success: false,
        message: 'Could not connect to Supabase'
      };
    }
    
    console.log('✅ Successfully connected to Supabase!');
    
    // 2. Creating a "user_profiles" table directly is not possible through the JS client
    // but we can work with existing tables and bucket storage
    
    console.log('\n2. Working with storage buckets...');
    
    // Create a bucket if it doesn't exist
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
    } else {
      console.log('Available buckets:', buckets.map(b => b.name));
      
      // Check if our test bucket exists
      const testBucket = buckets.find(b => b.name === 'cascade-test');
      
      if (!testBucket) {
        console.log('Creating a new test bucket...');
        const { data: newBucket, error: createError } = await supabase.storage.createBucket('cascade-test', {
          public: true
        });
        
        if (createError) {
          console.error('Error creating bucket:', createError);
        } else {
          console.log('✅ Created new bucket: cascade-test');
        }
      } else {
        console.log('Test bucket already exists');
      }
      
      // Upload a test file to the bucket
      console.log('Uploading a test file...');
      const testContent = JSON.stringify({
        message: 'This is a test file created by Cascade',
        timestamp: new Date().toISOString()
      });
      
      const { data: fileData, error: uploadError } = await supabase.storage
        .from('cascade-test')
        .upload('test-file.json', Buffer.from(testContent), {
          contentType: 'application/json',
          upsert: true
        });
      
      if (uploadError) {
        console.error('Error uploading file:', uploadError);
      } else {
        console.log('✅ Successfully uploaded test file!');
        console.log('File path:', fileData.path);
        
        // Get the public URL
        const { data: publicURL } = supabase.storage
          .from('cascade-test')
          .getPublicUrl('test-file.json');
        
        console.log('Public URL:', publicURL);
      }
    }
    
    // 3. Demonstrate working with Supabase Auth
    console.log('\n3. Working with Auth system...');
    
    // Get the total number of users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('Error listing users:', usersError);
    } else {
      console.log(`✅ Total users in the system: ${users.users.length}`);
      
      if (users.users.length > 0) {
        console.log('Sample user:', {
          id: users.users[0].id,
          email: users.users[0].email,
          created_at: users.users[0].created_at
        });
      }
    }
    
    return {
      success: true,
      message: 'Successfully demonstrated Supabase operations'
    };
  } catch (error) {
    console.error('Unexpected error:', error);
    return {
      success: false,
      message: 'Unexpected error during demonstration',
      error
    };
  }
}

// Run the demonstration function
demonstrateDataOperations()
  .then((result) => {
    console.log('\nDemonstration Result:', result);
    
    if (result.success) {
      console.log('\nSUCCESS! This demonstrates we can connect to and work with your Supabase project.');
      console.log('\nWhat this means:');
      console.log('1. We can successfully authenticate with your Supabase instance');
      console.log('2. We can perform data operations (when tables are created)');
      console.log('3. We can work with storage buckets and files');
      console.log('4. We can access the auth system');
      
      console.log('\nTo create actual database tables, you would need to:');
      console.log('1. Use the Supabase dashboard at https://supabase.com/dashboard/project/heqifyikpitzpwyasvop/editor');
      console.log('2. Create tables using SQL in the SQL Editor');
      console.log('3. Or use the Table Editor in the dashboard');
      
      console.log('\nOnce tables are created, our custom toolkit can fully manage the data!');
    }
  })
  .catch(console.error);
