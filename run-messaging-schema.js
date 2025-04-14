// Script to run the contractor messaging schema in Supabase
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, 'instabids/.env.local') });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSchema() {
  try {
    console.log('Reading SQL schema file...');
    const schemaSQL = fs.readFileSync(path.resolve(__dirname, 'contractor-messaging-schema.sql'), 'utf8');
    
    // Split the SQL into individual statements
    const statements = schemaSQL
      .replace(/--.*$/gm, '') // Remove comments
      .split(';')
      .filter(statement => statement.trim().length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute.`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error) throw error;
        console.log(`Statement ${i + 1} executed successfully.`);
      } catch (error) {
        console.error(`Error executing statement ${i + 1}:`, error.message);
        console.error('Statement:', statement);
      }
    }
    
    console.log('Schema update completed.');
    
    // Verify the schema updates
    console.log('\nVerifying schema updates...');
    
    // Check if message_recipients table exists
    const { data: messageRecipientsTable, error: messageRecipientsError } = await supabase
      .from('message_recipients')
      .select('id')
      .limit(1);
    
    if (messageRecipientsError) {
      console.error('message_recipients table check failed:', messageRecipientsError.message);
    } else {
      console.log('✅ message_recipients table exists');
    }
    
    // Check if contractor_aliases table exists
    const { data: contractorAliasesTable, error: contractorAliasesError } = await supabase
      .from('contractor_aliases')
      .select('id')
      .limit(1);
    
    if (contractorAliasesError) {
      console.error('contractor_aliases table check failed:', contractorAliasesError.message);
    } else {
      console.log('✅ contractor_aliases table exists');
    }
    
    // Check if messages table has the new columns
    const { data: messagesColumns, error: messagesColumnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'messages' });
    
    if (messagesColumnsError) {
      console.error('messages table columns check failed:', messagesColumnsError.message);
    } else {
      const columns = messagesColumns.map(col => col.column_name);
      console.log('Messages table columns:', columns);
      
      if (columns.includes('message_type')) {
        console.log('✅ messages table has message_type column');
      } else {
        console.error('❌ messages table is missing message_type column');
      }
      
      if (columns.includes('contractor_alias')) {
        console.log('✅ messages table has contractor_alias column');
      } else {
        console.error('❌ messages table is missing contractor_alias column');
      }
    }
    
  } catch (error) {
    console.error('Error running schema:', error);
  }
}

// Run the schema
runSchema().catch(console.error);
