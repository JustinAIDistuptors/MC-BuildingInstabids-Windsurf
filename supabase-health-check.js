// Supabase Health Check Script
// Run this regularly to check database connectivity and table structure

const { createClient } = require('@supabase/supabase-js');

// Supabase credentials
const SUPABASE_URL = 'https://heqifyikpitzpwyasvop.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlcWlmeWlrcGl0enB3eWFzdm9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NjI3NjMsImV4cCI6MjA1OTQzODc2M30.5Ew9RyW6umw_xB-mubmcp30Qo9eWOQ8J4fuk8li7yzo';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Tables to check
const REQUIRED_TABLES = [
  'messages',
  'attachments',
  // Add other critical tables here
];

// Expected table structures
const TABLE_STRUCTURES = {
  messages: [
    'id', 'project_id', 'sender_id', 'recipient_id', 
    'content', 'created_at', 'read_at'
  ],
  attachments: [
    'id', 'message_id', 'file_name', 'file_size', 
    'file_type', 'file_url', 'created_at'
  ],
  // Add other table structures here
};

async function checkDatabaseConnection() {
  console.log('Checking database connection...');
  
  try {
    const { data, error } = await supabase.from('messages').select('count(*)', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Database connection error:', error.message);
      return false;
    }
    
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    return false;
  }
}

async function checkTableExists(tableName) {
  console.log(`Checking if table '${tableName}' exists...`);
  
  try {
    const { error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      console.error(`❌ Table '${tableName}' does not exist or is not accessible:`, error.message);
      return false;
    }
    
    console.log(`✅ Table '${tableName}' exists`);
    return true;
  } catch (error) {
    console.error(`❌ Error checking table '${tableName}':`, error.message);
    return false;
  }
}

async function checkTableStructure(tableName) {
  console.log(`Checking structure of table '${tableName}'...`);
  
  if (!TABLE_STRUCTURES[tableName]) {
    console.log(`ℹ️ No structure defined for table '${tableName}'`);
    return true;
  }
  
  try {
    // Get a sample row to check columns
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      console.error(`❌ Error checking structure of table '${tableName}':`, error.message);
      return false;
    }
    
    // If no data, try to get column info from an empty result
    if (!data || data.length === 0) {
      const { data: emptyData, error: emptyError } = await supabase
        .from(tableName)
        .select(TABLE_STRUCTURES[tableName].join(', '))
        .limit(0);
      
      if (emptyError) {
        console.error(`❌ Error checking structure of table '${tableName}':`, emptyError.message);
        // Check which columns are missing
        for (const column of TABLE_STRUCTURES[tableName]) {
          const { error: columnError } = await supabase
            .from(tableName)
            .select(column)
            .limit(0);
          
          if (columnError) {
            console.error(`  ❌ Column '${column}' is missing or has wrong type`);
          }
        }
        return false;
      }
      
      console.log(`✅ Table '${tableName}' structure is correct (empty table)`);
      return true;
    }
    
    // Check if all expected columns exist
    const row = data[0];
    const missingColumns = [];
    
    for (const column of TABLE_STRUCTURES[tableName]) {
      if (!(column in row)) {
        missingColumns.push(column);
      }
    }
    
    if (missingColumns.length > 0) {
      console.error(`❌ Table '${tableName}' is missing columns:`, missingColumns.join(', '));
      return false;
    }
    
    console.log(`✅ Table '${tableName}' structure is correct`);
    return true;
  } catch (error) {
    console.error(`❌ Error checking structure of table '${tableName}':`, error.message);
    return false;
  }
}

async function checkStorageBuckets() {
  console.log('Checking storage buckets...');
  
  try {
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Error checking storage buckets:', error.message);
      return false;
    }
    
    const bucketNames = data.map(bucket => bucket.name);
    console.log('📦 Available buckets:', bucketNames.join(', '));
    
    // Check if attachments bucket exists
    if (!bucketNames.includes('attachments')) {
      console.warn('⚠️ Attachments bucket does not exist');
    } else {
      console.log('✅ Attachments bucket exists');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error checking storage buckets:', error.message);
    return false;
  }
}

async function testMessageInsertion() {
  console.log('Testing message insertion...');
  
  try {
    // Insert a test message
    const { data: insertData, error: insertError } = await supabase
      .from('messages')
      .insert({
        project_id: 'test-project',
        sender_id: '00000000-0000-0000-0000-000000000000',
        recipient_id: '11111111-1111-1111-1111-111111111111',
        content: 'Test message from health check'
      })
      .select();
    
    if (insertError) {
      console.error('❌ Error inserting test message:', insertError.message);
      return false;
    }
    
    console.log('✅ Test message inserted successfully');
    
    // Clean up the test message
    if (insertData && insertData[0] && insertData[0].id) {
      const { error: deleteError } = await supabase
        .from('messages')
        .delete()
        .eq('id', insertData[0].id);
      
      if (deleteError) {
        console.error('⚠️ Error deleting test message:', deleteError.message);
      } else {
        console.log('✅ Test message cleaned up');
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error testing message insertion:', error.message);
    return false;
  }
}

async function runHealthCheck() {
  console.log('=== Supabase Health Check ===');
  console.log('Supabase URL:', SUPABASE_URL);
  console.log('Time:', new Date().toISOString());
  console.log('===========================');
  
  // Check database connection
  const connectionOk = await checkDatabaseConnection();
  if (!connectionOk) {
    console.error('❌ Database connection failed. Aborting health check.');
    return;
  }
  
  // Check required tables
  let tablesOk = true;
  for (const table of REQUIRED_TABLES) {
    const tableExists = await checkTableExists(table);
    if (tableExists) {
      await checkTableStructure(table);
    } else {
      tablesOk = false;
    }
  }
  
  // Check storage buckets
  await checkStorageBuckets();
  
  // Test message insertion
  if (tablesOk) {
    await testMessageInsertion();
  }
  
  console.log('===========================');
  console.log('Health check completed');
  console.log('===========================');
}

// Run the health check
runHealthCheck();
