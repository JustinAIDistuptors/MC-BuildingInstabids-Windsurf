// Script to create messaging tables in the public schema
// This uses the Supabase MCP server to create the tables

const fetch = require('node-fetch');

async function createMessagingTables() {
  const MCP_SERVER_URL = 'http://localhost:4567';
  
  try {
    console.log('Creating messaging tables in public schema...');
    
    // Create messages table
    const messagesTableSchema = {
      columns: {
        id: 'UUID PRIMARY KEY DEFAULT gen_random_uuid()',
        project_id: 'TEXT NOT NULL',
        sender_id: 'UUID NOT NULL REFERENCES auth.users(id)',
        recipient_id: 'UUID NOT NULL REFERENCES auth.users(id)',
        content: 'TEXT NOT NULL',
        created_at: 'TIMESTAMPTZ NOT NULL DEFAULT now()',
        read_at: 'TIMESTAMPTZ'
      },
      indexes: [
        { columns: ['project_id'] },
        { columns: ['sender_id'] },
        { columns: ['recipient_id'] }
      ]
    };
    
    console.log('Creating messages table...');
    const messagesResponse = await fetch(`${MCP_SERVER_URL}/create-table`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: 'messages',
        schema: messagesTableSchema
      })
    });
    
    const messagesResult = await messagesResponse.json();
    console.log('Messages table creation result:', messagesResult);
    
    // Create attachments table
    const attachmentsTableSchema = {
      columns: {
        id: 'UUID PRIMARY KEY DEFAULT gen_random_uuid()',
        message_id: 'UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE',
        file_name: 'TEXT NOT NULL',
        file_size: 'INTEGER NOT NULL',
        file_type: 'TEXT NOT NULL',
        file_url: 'TEXT NOT NULL',
        created_at: 'TIMESTAMPTZ NOT NULL DEFAULT now()'
      },
      indexes: [
        { columns: ['message_id'] }
      ]
    };
    
    console.log('Creating attachments table...');
    const attachmentsResponse = await fetch(`${MCP_SERVER_URL}/create-table`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: 'attachments',
        schema: attachmentsTableSchema
      })
    });
    
    const attachmentsResult = await attachmentsResponse.json();
    console.log('Attachments table creation result:', attachmentsResult);
    
    // Enable RLS and create policies using direct SQL
    // Note: This will use the exec_sql function, which might not be available
    // If it fails, you'll need to create these policies through the Supabase dashboard
    
    const policiesSQL = `
      -- Enable RLS
      ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
      ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
      
      -- Policy for messages: Users can only see messages they sent or received
      CREATE POLICY IF NOT EXISTS messages_select_policy ON messages 
        FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
      
      -- Policy for messages: Users can only insert messages they send
      CREATE POLICY IF NOT EXISTS messages_insert_policy ON messages 
        FOR INSERT WITH CHECK (auth.uid() = sender_id);
      
      -- Policy for attachments: Users can see attachments for messages they can see
      CREATE POLICY IF NOT EXISTS attachments_select_policy ON attachments 
        FOR SELECT USING (
          message_id IN (
            SELECT id FROM messages 
            WHERE sender_id = auth.uid() OR recipient_id = auth.uid()
          )
        );
      
      -- Policy for attachments: Users can insert attachments for messages they sent
      CREATE POLICY IF NOT EXISTS attachments_insert_policy ON attachments 
        FOR INSERT WITH CHECK (
          message_id IN (
            SELECT id FROM messages 
            WHERE sender_id = auth.uid()
          )
        );
    `;
    
    console.log('Attempting to create RLS policies...');
    try {
      const policiesResponse = await fetch(`${MCP_SERVER_URL}/execute-migration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: policiesSQL })
      });
      
      const policiesResult = await policiesResponse.json();
      console.log('RLS policies creation result:', policiesResult);
    } catch (error) {
      console.warn('Failed to create RLS policies. You may need to create them manually:', error.message);
      console.log('Please create the RLS policies through the Supabase dashboard.');
    }
    
    console.log('Messaging tables setup complete!');
  } catch (error) {
    console.error('Error creating messaging tables:', error);
  }
}

// Run the function
createMessagingTables();
