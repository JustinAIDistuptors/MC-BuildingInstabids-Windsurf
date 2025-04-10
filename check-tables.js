// Script to check if messaging tables exist
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Supabase credentials
const SUPABASE_URL = 'https://heqifyikpitzpwyasvop.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlcWlmeWlrcGl0enB3eWFzdm9wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mzg2Mjc2MywiZXhwIjoyMDU5NDM4NzYzfQ.6bz0K2rUfI9IA3Ty4FCnCJrXZirgZJ3yF2YYzzcskME';

// Create Supabase client with service role key for admin operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkTablesExist() {
  console.log('Checking if messaging tables exist...');
  
  try {
    // Method 1: Using Supabase client
    console.log('\nMethod 1: Using Supabase client');
    
    // Check messages table
    const { data: messagesData, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .limit(1);
    
    console.log('Messages table exists:', !messagesError);
    if (messagesError) {
      console.log('Messages table error:', messagesError.message);
    } else {
      console.log('Messages table data:', messagesData);
    }
    
    // Check attachments table
    const { data: attachmentsData, error: attachmentsError } = await supabase
      .from('attachments')
      .select('*')
      .limit(1);
    
    console.log('Attachments table exists:', !attachmentsError);
    if (attachmentsError) {
      console.log('Attachments table error:', attachmentsError.message);
    } else {
      console.log('Attachments table data:', attachmentsData);
    }
    
    // Method 2: Using REST API
    console.log('\nMethod 2: Using REST API');
    
    // Check messages table
    try {
      const messagesResponse = await fetch(`${SUPABASE_URL}/rest/v1/messages?limit=1`, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
      });
      
      console.log('Messages table status:', messagesResponse.status);
      console.log('Messages table exists:', messagesResponse.status !== 404);
      
      const messagesBody = await messagesResponse.text();
      console.log('Messages response:', messagesBody);
    } catch (error) {
      console.error('Error checking messages table:', error);
    }
    
    // Check attachments table
    try {
      const attachmentsResponse = await fetch(`${SUPABASE_URL}/rest/v1/attachments?limit=1`, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
      });
      
      console.log('Attachments table status:', attachmentsResponse.status);
      console.log('Attachments table exists:', attachmentsResponse.status !== 404);
      
      const attachmentsBody = await attachmentsResponse.text();
      console.log('Attachments response:', attachmentsBody);
    } catch (error) {
      console.error('Error checking attachments table:', error);
    }
    
    // Method 3: Try to insert a test message
    console.log('\nMethod 3: Try to insert a test message');
    
    try {
      const { data: insertData, error: insertError } = await supabase
        .from('messages')
        .insert({
          project_id: 'test-project',
          sender_id: '00000000-0000-0000-0000-000000000000',
          recipient_id: '00000000-0000-0000-0000-000000000000',
          content: 'Test message from check-tables.js'
        })
        .select();
      
      console.log('Insert test message success:', !insertError);
      if (insertError) {
        console.log('Insert error:', insertError.message);
      } else {
        console.log('Inserted message:', insertData);
        
        // Clean up the test message
        if (insertData && insertData[0] && insertData[0].id) {
          await supabase
            .from('messages')
            .delete()
            .eq('id', insertData[0].id);
          
          console.log('Test message cleaned up');
        }
      }
    } catch (error) {
      console.error('Error inserting test message:', error);
    }
    
    console.log('\nTable check complete!');
  } catch (error) {
    console.error('Error checking tables:', error);
  }
}

// Run the check
checkTablesExist();
