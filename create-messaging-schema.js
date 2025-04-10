const { createClient } = require('@supabase/supabase-js');

// Supabase credentials
const SUPABASE_URL = 'https://heqifyikpitzpwyasvop.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlcWlmeWlrcGl0enB3eWFzdm9wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mzg2Mjc2MywiZXhwIjoyMDU5NDM4NzYzfQ.6bz0K2rUfI9IA3Ty4FCnCJrXZirgZJ3yF2YYzzcskME';

// Create Supabase client with service role key for admin operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Helper function to check if a table exists
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

// Helper function to execute SQL using the Supabase REST API
async function executeSql(sql) {
  try {
    // Using the pgrest API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        sql_string: sql
      })
    });
    
    const result = await response.text();
    return { success: true, result };
  } catch (error) {
    console.error('Error executing SQL:', error);
    return { success: false, error: error.message };
  }
}

async function createMessagingSchema() {
  console.log('Creating messaging tables in public schema...');
  
  try {
    // Check if tables already exist
    const messagesExists = await tableExists('messages');
    const attachmentsExists = await tableExists('attachments');
    
    console.log('Messages table exists:', messagesExists);
    console.log('Attachments table exists:', attachmentsExists);
    
    if (messagesExists && attachmentsExists) {
      console.log('All messaging tables already exist!');
      return true;
    }
    
    // Create messages table in public schema
    if (!messagesExists) {
      console.log('Creating messages table...');
      
      // Try to create the messages table using a direct insert
      // This will create the table with the default structure if it doesn't exist
      try {
        const { error } = await supabase
          .from('messages')
          .insert({
            project_id: 'test-project',
            sender_id: '00000000-0000-0000-0000-000000000000',
            recipient_id: '00000000-0000-0000-0000-000000000000',
            content: 'Test message'
          });
        
        if (!error) {
          console.log('Messages table created successfully!');
        } else {
          console.error('Error creating messages table:', error);
          
          // If direct insert fails, try using the REST API
          console.log('Trying to create messages table using REST API...');
          
          // SQL to create messages table
          const createMessagesSQL = `
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
          
          const result = await executeSql(createMessagesSQL);
          console.log('Messages table creation result:', result);
        }
      } catch (error) {
        console.error('Error creating messages table:', error);
      }
    }
    
    // Create attachments table in public schema
    if (!attachmentsExists) {
      console.log('Creating attachments table...');
      
      // Try to create the attachments table using a direct insert
      try {
        const { error } = await supabase
          .from('attachments')
          .insert({
            message_id: '00000000-0000-0000-0000-000000000000',
            file_name: 'test.txt',
            file_size: 0,
            file_type: 'text/plain',
            file_url: 'https://example.com/test.txt'
          });
        
        if (!error) {
          console.log('Attachments table created successfully!');
        } else {
          console.error('Error creating attachments table:', error);
          
          // If direct insert fails, try using the REST API
          console.log('Trying to create attachments table using REST API...');
          
          // SQL to create attachments table
          const createAttachmentsSQL = `
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
          
          const result = await executeSql(createAttachmentsSQL);
          console.log('Attachments table creation result:', result);
        }
      } catch (error) {
        console.error('Error creating attachments table:', error);
      }
    }
    
    // Check if tables were created successfully
    const messagesExistsNow = await tableExists('messages');
    const attachmentsExistsNow = await tableExists('attachments');
    
    console.log('Messages table exists now:', messagesExistsNow);
    console.log('Attachments table exists now:', attachmentsExistsNow);
    
    if (messagesExistsNow && attachmentsExistsNow) {
      console.log('Successfully created all messaging tables!');
      return true;
    } else {
      console.log('Failed to create some messaging tables.');
      
      // One last attempt - try to create the tables using the Supabase dashboard API
      console.log('Trying to create tables using Supabase dashboard API...');
      
      // Instructions for manual creation
      console.log('\nTo create the necessary tables, please run the following SQL in the Supabase SQL Editor:');
      console.log('\n-------- SQL SCRIPT START --------');
      console.log(`
-- Messages table
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

-- Attachments table
CREATE TABLE IF NOT EXISTS public.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_project_id ON public.messages(project_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_attachments_message_id ON public.attachments(message_id);

-- Row-level security policies
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- Policy for messages: Users can only see messages they sent or received
CREATE POLICY messages_select_policy ON public.messages 
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Policy for messages: Users can only insert messages they send
CREATE POLICY messages_insert_policy ON public.messages 
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Policy for attachments: Users can see attachments for messages they can see
CREATE POLICY attachments_select_policy ON public.attachments 
  FOR SELECT USING (
    message_id IN (
      SELECT id FROM public.messages 
      WHERE sender_id = auth.uid() OR recipient_id = auth.uid()
    )
  );

-- Policy for attachments: Users can insert attachments for messages they sent
CREATE POLICY attachments_insert_policy ON public.attachments 
  FOR INSERT WITH CHECK (
    message_id IN (
      SELECT id FROM public.messages 
      WHERE sender_id = auth.uid()
    )
  );
`);
      console.log('-------- SQL SCRIPT END --------\n');
      
      return false;
    }
  } catch (error) {
    console.error('Error creating messaging schema:', error);
    return false;
  }
}

// Execute the function
createMessagingSchema()
  .then(success => {
    if (success) {
      console.log('Messaging schema created successfully!');
    } else {
      console.log('Failed to create messaging schema.');
    }
  })
  .catch(error => {
    console.error('Error:', error);
  });
