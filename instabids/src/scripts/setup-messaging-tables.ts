/**
 * This script sets up the messaging tables in Supabase
 * Run it with: npm run setup-messaging-tables
 */
const { createClient } = require('@supabase/supabase-js');

async function setupMessagingTables() {
  // Create a Supabase client with environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    console.error('❌ Missing Supabase environment variables. Please check your .env file.');
    return;
  }

  // Create a client with the service role key for admin operations
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  
  console.log('=== SETTING UP MESSAGING TABLES ===');
  
  try {
    // 1. Create messaging schema
    console.log('\n=== Creating messaging schema ===');
    const { error: schemaError } = await supabase.rpc('exec_sql', {
      sql_string: 'CREATE SCHEMA IF NOT EXISTS messaging;'
    });
    
    if (schemaError) {
      console.error('❌ Error creating schema:', schemaError);
      console.log('⚠️ Continuing anyway, schema might already exist');
    } else {
      console.log('✅ Created messaging schema');
    }
    
    // 2. Create messages table
    console.log('\n=== Creating messages table ===');
    const { error: messagesError } = await supabase.rpc('exec_sql', {
      sql_string: `
        CREATE TABLE IF NOT EXISTS messaging.messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id TEXT NOT NULL,
          sender_id UUID NOT NULL REFERENCES auth.users(id),
          recipient_id UUID NOT NULL REFERENCES auth.users(id),
          content TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          read_at TIMESTAMPTZ,
          CONSTRAINT sender_not_recipient CHECK (sender_id != recipient_id)
        );
      `
    });
    
    if (messagesError) {
      console.error('❌ Error creating messages table:', messagesError);
    } else {
      console.log('✅ Created messages table');
    }
    
    // 3. Create attachments table
    console.log('\n=== Creating attachments table ===');
    const { error: attachmentsError } = await supabase.rpc('exec_sql', {
      sql_string: `
        CREATE TABLE IF NOT EXISTS messaging.attachments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          message_id UUID NOT NULL REFERENCES messaging.messages(id) ON DELETE CASCADE,
          file_path TEXT NOT NULL,
          file_name TEXT NOT NULL,
          file_type TEXT NOT NULL,
          file_size INTEGER NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `
    });
    
    if (attachmentsError) {
      console.error('❌ Error creating attachments table:', attachmentsError);
    } else {
      console.log('✅ Created attachments table');
    }
    
    // 4. Set up RLS policies
    console.log('\n=== Setting up RLS policies ===');
    
    // Enable RLS on messages table
    const { error: enableRlsError } = await supabase.rpc('exec_sql', {
      sql_string: `
        ALTER TABLE messaging.messages ENABLE ROW LEVEL SECURITY;
      `
    });
    
    if (enableRlsError) {
      console.error('❌ Error enabling RLS on messages table:', enableRlsError);
    } else {
      console.log('✅ Enabled RLS on messages table');
    }
    
    // Create policy for selecting messages
    const { error: selectPolicyError } = await supabase.rpc('exec_sql', {
      sql_string: `
        CREATE POLICY "Users can view messages they sent or received"
        ON messaging.messages
        FOR SELECT
        USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
      `
    });
    
    if (selectPolicyError) {
      console.error('❌ Error creating select policy:', selectPolicyError);
      console.log('⚠️ Policy might already exist, continuing...');
    } else {
      console.log('✅ Created select policy for messages');
    }
    
    // Create policy for inserting messages
    const { error: insertPolicyError } = await supabase.rpc('exec_sql', {
      sql_string: `
        CREATE POLICY "Users can insert messages they send"
        ON messaging.messages
        FOR INSERT
        WITH CHECK (auth.uid() = sender_id);
      `
    });
    
    if (insertPolicyError) {
      console.error('❌ Error creating insert policy:', insertPolicyError);
      console.log('⚠️ Policy might already exist, continuing...');
    } else {
      console.log('✅ Created insert policy for messages');
    }
    
    // Enable RLS on attachments table
    const { error: enableAttachmentsRlsError } = await supabase.rpc('exec_sql', {
      sql_string: `
        ALTER TABLE messaging.attachments ENABLE ROW LEVEL SECURITY;
      `
    });
    
    if (enableAttachmentsRlsError) {
      console.error('❌ Error enabling RLS on attachments table:', enableAttachmentsRlsError);
    } else {
      console.log('✅ Enabled RLS on attachments table');
    }
    
    // Create policy for selecting attachments
    const { error: selectAttachmentsPolicyError } = await supabase.rpc('exec_sql', {
      sql_string: `
        CREATE POLICY "Users can view attachments for messages they sent or received"
        ON messaging.attachments
        FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM messaging.messages
            WHERE messaging.messages.id = messaging.attachments.message_id
            AND (messaging.messages.sender_id = auth.uid() OR messaging.messages.recipient_id = auth.uid())
          )
        );
      `
    });
    
    if (selectAttachmentsPolicyError) {
      console.error('❌ Error creating select policy for attachments:', selectAttachmentsPolicyError);
      console.log('⚠️ Policy might already exist, continuing...');
    } else {
      console.log('✅ Created select policy for attachments');
    }
    
    // Create policy for inserting attachments
    const { error: insertAttachmentsPolicyError } = await supabase.rpc('exec_sql', {
      sql_string: `
        CREATE POLICY "Users can insert attachments for messages they sent"
        ON messaging.attachments
        FOR INSERT
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM messaging.messages
            WHERE messaging.messages.id = messaging.attachments.message_id
            AND messaging.messages.sender_id = auth.uid()
          )
        );
      `
    });
    
    if (insertAttachmentsPolicyError) {
      console.error('❌ Error creating insert policy for attachments:', insertAttachmentsPolicyError);
      console.log('⚠️ Policy might already exist, continuing...');
    } else {
      console.log('✅ Created insert policy for attachments');
    }
    
    console.log('\n✅ MESSAGING TABLES SETUP COMPLETE ✅');
    
  } catch (error) {
    console.error('❌ Error setting up messaging tables:', error);
  }
}

// Run the setup
setupMessagingTables().catch(console.error);
