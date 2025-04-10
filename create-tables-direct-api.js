// Script to create messaging tables directly using the Supabase API
const fetch = require('node-fetch');

// Configuration
const SUPABASE_URL = 'https://heqifyikpitzpwyasvop.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlcWlmeWlrcGl0enB3eWFzdm9wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mzg2Mjc2MywiZXhwIjoyMDU5NDM4NzYzfQ.6bz0K2rUfI9IA3Ty4FCnCJrXZirgZJ3yF2YYzzcskME';

async function createMessagesTable() {
  try {
    console.log('Creating messages table using direct API call...');
    
    // Create messages table using the REST API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        project_id: 'test-project',
        sender_id: '00000000-0000-0000-0000-000000000000',
        recipient_id: '00000000-0000-0000-0000-000000000000',
        content: 'Test message'
      })
    });
    
    const result = await response.text();
    console.log('Messages table creation result:', result);
    
    return true;
  } catch (error) {
    console.error('Error creating messages table:', error);
    return false;
  }
}

async function createAttachmentsTable() {
  try {
    console.log('Creating attachments table using direct API call...');
    
    // Create attachments table using the REST API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/attachments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        message_id: '00000000-0000-0000-0000-000000000000',
        file_name: 'test.txt',
        file_size: 0,
        file_type: 'text/plain',
        file_url: 'https://example.com/test.txt'
      })
    });
    
    const result = await response.text();
    console.log('Attachments table creation result:', result);
    
    return true;
  } catch (error) {
    console.error('Error creating attachments table:', error);
    return false;
  }
}

async function checkTablesExist() {
  try {
    console.log('Checking if tables exist...');
    
    // Check if messages table exists
    const messagesResponse = await fetch(`${SUPABASE_URL}/rest/v1/messages?limit=1`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    });
    
    const messagesExists = messagesResponse.status !== 404;
    console.log('Messages table exists:', messagesExists);
    
    // Check if attachments table exists
    const attachmentsResponse = await fetch(`${SUPABASE_URL}/rest/v1/attachments?limit=1`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    });
    
    const attachmentsExists = attachmentsResponse.status !== 404;
    console.log('Attachments table exists:', attachmentsExists);
    
    return { messagesExists, attachmentsExists };
  } catch (error) {
    console.error('Error checking if tables exist:', error);
    return { messagesExists: false, attachmentsExists: false };
  }
}

async function createTables() {
  try {
    // Check if tables already exist
    const { messagesExists, attachmentsExists } = await checkTablesExist();
    
    if (messagesExists && attachmentsExists) {
      console.log('All tables already exist!');
      return true;
    }
    
    // Create messages table if it doesn't exist
    if (!messagesExists) {
      await createMessagesTable();
    }
    
    // Create attachments table if it doesn't exist
    if (!attachmentsExists) {
      await createAttachmentsTable();
    }
    
    // Check if tables were created successfully
    const { messagesExists: messagesExistsNow, attachmentsExists: attachmentsExistsNow } = await checkTablesExist();
    
    if (messagesExistsNow && attachmentsExistsNow) {
      console.log('Successfully created all tables!');
      return true;
    } else {
      console.log('Failed to create some tables.');
      return false;
    }
  } catch (error) {
    console.error('Error creating tables:', error);
    return false;
  }
}

// Execute the function
createTables()
  .then(success => {
    if (success) {
      console.log('Tables created successfully!');
    } else {
      console.log('Failed to create tables.');
    }
  })
  .catch(error => {
    console.error('Error:', error);
  });
