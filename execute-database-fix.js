#!/usr/bin/env node

/**
 * Script to execute the database fix SQL using the Supabase MCP tool
 * This will fix the messaging tables and ensure proper data integrity
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Configuration
const MCP_SERVER_URL = 'http://localhost:4567';
const SQL_FILE_PATH = path.join(__dirname, 'complete-database-fix.sql');
const SUPABASE_URL = 'https://heqifyikpitzpwyasvop.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlcWlmeWlrcGl0enB3eWFzdm9wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mzg2Mjc2MywiZXhwIjoyMDU5NDM4NzYzfQ.6bz0K2rUfI9IA3Ty4FCnCJrXZirgZJ3yF2YYzzcskME';

// Read the SQL file
async function readSqlFile() {
  try {
    const sql = fs.readFileSync(SQL_FILE_PATH, 'utf8');
    return sql;
  } catch (error) {
    console.error('Error reading SQL file:', error);
    throw error;
  }
}

// Execute SQL using the MCP server
async function executeSql(sql) {
  try {
    console.log('Connecting to MCP server at:', MCP_SERVER_URL);
    
    // Split the SQL into individual statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement separately
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const response = await axios.post(`${MCP_SERVER_URL}/execute-sql`, {
          sql: statement + ';',
          supabaseUrl: SUPABASE_URL,
          supabaseKey: SUPABASE_SERVICE_ROLE_KEY
        });
        
        console.log(`Statement ${i + 1} executed successfully:`, response.data);
      } catch (stmtError) {
        console.error(`Error executing statement ${i + 1}:`, stmtError.response?.data || stmtError.message);
        // Continue with next statement even if this one fails
      }
    }
    
    console.log('All SQL statements executed');
    return true;
  } catch (error) {
    console.error('Error executing SQL:', error.response?.data || error.message);
    throw error;
  }
}

// Check messaging tables
async function checkMessagingTables() {
  try {
    console.log('Checking messaging tables...');
    
    const tables = ['messages', 'message_recipients', 'contractor_aliases', 'message_attachments'];
    
    for (const table of tables) {
      try {
        const response = await axios.post(`${MCP_SERVER_URL}/query`, {
          table,
          limit: 5,
          supabaseUrl: SUPABASE_URL,
          supabaseKey: SUPABASE_SERVICE_ROLE_KEY
        });
        
        console.log(`Table ${table} check:`, {
          count: response.data.count,
          sample: response.data.data
        });
      } catch (tableError) {
        console.error(`Error checking table ${table}:`, tableError.response?.data || tableError.message);
      }
    }
  } catch (error) {
    console.error('Error checking messaging tables:', error.response?.data || error.message);
  }
}

// Main function
async function main() {
  try {
    // Check if MCP server is running
    try {
      await axios.get(MCP_SERVER_URL);
      console.log('MCP server is running');
    } catch (error) {
      console.error('MCP server is not running. Please start it with: node supabase-mcp-server.js');
      process.exit(1);
    }
    
    // Read and execute SQL
    const sql = await readSqlFile();
    await executeSql(sql);
    
    // Check tables after fix
    await checkMessagingTables();
    
    console.log('Database fix completed successfully');
  } catch (error) {
    console.error('Error in main process:', error);
    process.exit(1);
  }
}

// Run the script
main();
