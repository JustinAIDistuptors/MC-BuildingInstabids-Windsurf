// Script to create messaging tables directly using the Supabase client
// This avoids using the exec_sql function which doesn't exist

const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = 'https://heqifyikpitzpwyasvop.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlcWlmeWlrcGl0enB3eWFzdm9wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mzg2Mjc2MywiZXhwIjoyMDU5NDM4NzYzfQ.6bz0K2rUfI9IA3Ty4FCnCJrXZirgZJ3yF2YYzzcskME';

// Create Supabase client with service role key for admin operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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
    
    // We need to create the tables using the Supabase SQL editor
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
    
    console.log('Instructions:');
    console.log('1. Go to your Supabase dashboard: https://app.supabase.com/project/heqifyikpitzpwyasvop');
    console.log('2. Click on "SQL Editor" in the left sidebar');
    console.log('3. Create a new query and paste the SQL script above');
    console.log('4. Click "Run" to execute the script');
    console.log('5. Once complete, the messaging functionality should work properly');
    
    // Let's try to insert a test message to see if the tables already exist
    // This will only work if the tables exist but our check failed for some reason
    console.log('\nAttempting to insert a test message to verify if tables exist...');
    
    try {
      const { data: testMessage, error: testError } = await supabase
        .from('messages')
        .insert({
          project_id: 'test-project',
          sender_id: '00000000-0000-0000-0000-000000000000',
          recipient_id: '00000000-0000-0000-0000-000000000000',
          content: 'Test message'
        })
        .select();
      
      if (!testError) {
        console.log('Success! Messages table exists and is working properly.');
        
        // Clean up the test message
        if (testMessage && testMessage[0] && testMessage[0].id) {
          await supabase
            .from('messages')
            .delete()
            .eq('id', testMessage[0].id);
          
          console.log('Test message cleaned up.');
        }
      } else {
        console.log('Test message insertion failed:', testError.message);
        console.log('Please run the SQL script above to create the necessary tables.');
      }
    } catch (error) {
      console.error('Error inserting test message:', error);
      console.log('Please run the SQL script above to create the necessary tables.');
    }
    
  } catch (error) {
    console.error('Error in createMessagingTables:', error);
  }
}

// Run the function
createMessagingTables();
