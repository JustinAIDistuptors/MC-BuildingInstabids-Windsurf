// Script to check Supabase messaging schema
require('dotenv').config({ path: './instabids/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Make sure .env.local file exists with proper values.');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Found' : 'Missing');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? 'Found' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMessagingSchema() {
  console.log('Checking Supabase messaging schema...');
  
  try {
    // 1. Check if messaging-related tables exist in public schema
    console.log('\n1. Checking for messaging tables in public schema...');
    
    // Check messages table
    const { data: messagesTest, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .limit(1);
    
    console.log('Messages table:', messagesError ? 'Does not exist or error' : 'Exists');
    if (messagesError) {
      console.log('Error details:', messagesError.message);
    } else {
      console.log(`Found ${messagesTest.length} messages`);
      if (messagesTest.length > 0) {
        console.log('Sample message structure:');
        console.log(JSON.stringify(messagesTest[0], null, 2));
      }
    }
    
    // Check attachments table
    const { data: attachmentsTest, error: attachmentsError } = await supabase
      .from('attachments')
      .select('*')
      .limit(1);
    
    console.log('\nAttachments table:', attachmentsError ? 'Does not exist or error' : 'Exists');
    if (attachmentsError) {
      console.log('Error details:', attachmentsError.message);
    } else {
      console.log(`Found ${attachmentsTest.length} attachments`);
      if (attachmentsTest.length > 0) {
        console.log('Sample attachment structure:');
        console.log(JSON.stringify(attachmentsTest[0], null, 2));
      }
    }
    
    // 2. Check bids table (for contractor information)
    console.log('\n2. Checking bids table (for contractor information)...');
    
    const { data: bidsTest, error: bidsError } = await supabase
      .from('bids')
      .select('*')
      .limit(1);
    
    console.log('Bids table:', bidsError ? 'Does not exist or error' : 'Exists');
    if (bidsError) {
      console.log('Error details:', bidsError.message);
    } else {
      console.log(`Found ${bidsTest.length} bids`);
      if (bidsTest.length > 0) {
        console.log('Sample bid structure:');
        console.log(JSON.stringify(bidsTest[0], null, 2));
      }
    }
    
    // 3. Check projects table
    console.log('\n3. Checking projects table...');
    
    const { data: projectsTest, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .limit(1);
    
    console.log('Projects table:', projectsError ? 'Does not exist or error' : 'Exists');
    if (projectsError) {
      console.log('Error details:', projectsError.message);
    } else {
      console.log(`Found ${projectsTest.length} projects`);
      if (projectsTest.length > 0) {
        console.log('Sample project structure:');
        console.log(JSON.stringify(projectsTest[0], null, 2));
      }
    }
    
    // 4. Check profiles table
    console.log('\n4. Checking profiles table...');
    
    const { data: profilesTest, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    console.log('Profiles table:', profilesError ? 'Does not exist or error' : 'Exists');
    if (profilesError) {
      console.log('Error details:', profilesError.message);
    } else {
      console.log(`Found ${profilesTest.length} profiles`);
      if (profilesTest.length > 0) {
        console.log('Sample profile structure:');
        console.log(JSON.stringify(profilesTest[0], null, 2));
      }
    }
    
    console.log('\nMessaging schema check complete!');
    
  } catch (error) {
    console.error('Unexpected error during schema check:', error);
  }
}

// Run the function
checkMessagingSchema().catch(console.error);
