// Script to create messaging tables directly using the Supabase client
const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = 'https://heqifyikpitzpwyasvop.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlcWlmeWlrcGl0enB3eWFzdm9wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mzg2Mjc2MywiZXhwIjoyMDU5NDM4NzYzfQ.6bz0K2rUfI9IA3Ty4FCnCJrXZirgZJ3yF2YYzzcskME';

// Create Supabase client with service role key for admin operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Function to execute raw SQL directly
async function executeSQL(sql) {
  try {
    // Using the REST API directly to execute SQL
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'params=single-object'
      },
      body: JSON.stringify({
        query: sql
      })
    });
    
    const result = await response.text();
    return { success: true, result };
  } catch (error) {
    console.error('Error executing SQL:', error);
    return { success: false, error: error.message };
  }
}

// Function to check if a table exists
async function tableExists(tableName) {
  try {
    // Try to query the table
    const { error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    // If there's no error, the table exists
    return !error;
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    return false;
  }
}

// Function to create a table using the Supabase client
async function createTable(tableName, schema) {
  try {
    // For messages table
    if (tableName === 'messages') {
      // Try to create the table by inserting a test record
      const { error } = await supabase
        .from('messages')
        .insert({
          project_id: 'test-project',
          sender_id: '00000000-0000-0000-0000-000000000000',
          recipient_id: '00000000-0000-0000-0000-000000000000',
          content: 'Test message'
        });
      
      if (error) {
        console.error(`Error creating ${tableName} table:`, error);
        return false;
      }
      
      return true;
    }
    
    // For attachments table
    if (tableName === 'attachments') {
      // Try to create the table by inserting a test record
      const { error } = await supabase
        .from('attachments')
        .insert({
          message_id: '00000000-0000-0000-0000-000000000000',
          file_name: 'test.txt',
          file_size: 0,
          file_type: 'text/plain',
          file_url: 'https://example.com/test.txt'
        });
      
      if (error) {
        console.error(`Error creating ${tableName} table:`, error);
        return false;
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error creating ${tableName} table:`, error);
    return false;
  }
}

// Main function to create messaging tables
async function createMessagingTables() {
  try {
    console.log('Checking if messaging tables exist...');
    
    // Check if messages table exists
    const messagesExists = await tableExists('messages');
    console.log('Messages table exists:', messagesExists);
    
    // Check if attachments table exists
    const attachmentsExists = await tableExists('attachments');
    console.log('Attachments table exists:', attachmentsExists);
    
    // If tables already exist, we're done
    if (messagesExists && attachmentsExists) {
      console.log('All messaging tables already exist!');
      return;
    }
    
    // Create tables if they don't exist
    if (!messagesExists) {
      console.log('Creating messages table...');
      
      // Try to use the Supabase REST API to create the table
      const messagesSQL = `
        CREATE TABLE IF NOT EXISTS public.messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id TEXT NOT NULL,
          sender_id UUID NOT NULL REFERENCES auth.users(id),
          recipient_id UUID NOT NULL REFERENCES auth.users(id),
          content TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          read_at TIMESTAMPTZ,
          
          CONSTRAINT sender_not_recipient CHECK (sender_id != recipient_id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_messages_project_id ON public.messages(project_id);
        CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
        CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON public.messages(recipient_id);
        
        ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY messages_select_policy ON public.messages 
          FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
        
        CREATE POLICY messages_insert_policy ON public.messages 
          FOR INSERT WITH CHECK (auth.uid() = sender_id);
      `;
      
      const messagesResult = await executeSQL(messagesSQL);
      console.log('Messages table creation result:', messagesResult);
      
      if (!messagesResult.success) {
        // Try alternative method
        const created = await createTable('messages');
        console.log('Alternative messages table creation result:', created);
      }
    }
    
    if (!attachmentsExists) {
      console.log('Creating attachments table...');
      
      // Try to use the Supabase REST API to create the table
      const attachmentsSQL = `
        CREATE TABLE IF NOT EXISTS public.attachments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
          file_name TEXT NOT NULL,
          file_size INTEGER NOT NULL,
          file_type TEXT NOT NULL,
          file_url TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        
        CREATE INDEX IF NOT EXISTS idx_attachments_message_id ON public.attachments(message_id);
        
        ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY attachments_select_policy ON public.attachments 
          FOR SELECT USING (
            message_id IN (
              SELECT id FROM public.messages 
              WHERE sender_id = auth.uid() OR recipient_id = auth.uid()
            )
          );
        
        CREATE POLICY attachments_insert_policy ON public.attachments 
          FOR INSERT WITH CHECK (
            message_id IN (
              SELECT id FROM public.messages 
              WHERE sender_id = auth.uid()
            )
          );
      `;
      
      const attachmentsResult = await executeSQL(attachmentsSQL);
      console.log('Attachments table creation result:', attachmentsResult);
      
      if (!attachmentsResult.success) {
        // Try alternative method
        const created = await createTable('attachments');
        console.log('Alternative attachments table creation result:', created);
      }
    }
    
    // Check if tables were created successfully
    const messagesExistsNow = await tableExists('messages');
    const attachmentsExistsNow = await tableExists('attachments');
    
    console.log('Messages table exists now:', messagesExistsNow);
    console.log('Attachments table exists now:', attachmentsExistsNow);
    
    if (messagesExistsNow && attachmentsExistsNow) {
      console.log('Successfully created all messaging tables!');
    } else {
      console.log('Failed to create some messaging tables. Please check the logs for details.');
    }
    
  } catch (error) {
    console.error('Error in createMessagingTables:', error);
  }
}

// Run the function
createMessagingTables();
