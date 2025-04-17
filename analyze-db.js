// analyze-db.js
// This script uses the Supabase MCP server to analyze the database structure

const fetch = require('node-fetch');

// MCP server URL
const MCP_SERVER = 'http://localhost:4567';

// Project ID to analyze
const PROJECT_ID = '2d0c9c04-8167-4e2e-aeca-45bd719ee589';

async function fetchFromMCP(endpoint, params = {}) {
  const queryString = Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
  
  const url = `${MCP_SERVER}/${endpoint}${queryString ? '?' + queryString : ''}`;
  console.log(`Fetching: ${url}`);
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    return null;
  }
}

async function analyzeDatabase() {
  console.log('Analyzing database structure...');
  
  // 1. Check if the messages table exists
  console.log('\nChecking messages table...');
  const messagesTable = await fetchFromMCP('execute-sql', {
    sql: `SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'messages'
    )`
  });
  console.log('Messages table exists:', messagesTable);
  
  // 2. Get the structure of the messages table
  console.log('\nGetting messages table structure...');
  const messagesStructure = await fetchFromMCP('execute-sql', {
    sql: `SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'messages'`
  });
  console.log('Messages table structure:', messagesStructure);
  
  // 3. Get sample messages for the project
  console.log('\nGetting sample messages for project...');
  const messages = await fetchFromMCP('execute-sql', {
    sql: `SELECT * FROM messages 
          WHERE project_id = '${PROJECT_ID}' 
          LIMIT 10`
  });
  console.log('Sample messages:', messages);
  
  // 4. Check if the contractor_aliases table exists
  console.log('\nChecking contractor_aliases table...');
  const aliasesTable = await fetchFromMCP('execute-sql', {
    sql: `SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'contractor_aliases'
    )`
  });
  console.log('Contractor aliases table exists:', aliasesTable);
  
  // 5. Get sample aliases for the project
  console.log('\nGetting contractor aliases for project...');
  const aliases = await fetchFromMCP('execute-sql', {
    sql: `SELECT * FROM contractor_aliases 
          WHERE project_id = '${PROJECT_ID}'`
  });
  console.log('Contractor aliases:', aliases);
  
  // 6. Check if the contractors table exists
  console.log('\nChecking contractors table...');
  const contractorsTable = await fetchFromMCP('execute-sql', {
    sql: `SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'contractors'
    )`
  });
  console.log('Contractors table exists:', contractorsTable);
  
  // 7. Get sample contractors for the project
  console.log('\nGetting contractors for project...');
  const contractors = await fetchFromMCP('execute-sql', {
    sql: `SELECT * FROM contractors 
          WHERE project_id = '${PROJECT_ID}'`
  });
  console.log('Contractors:', contractors);
  
  console.log('\nDatabase analysis complete!');
}

// Run the analysis
analyzeDatabase()
  .then(() => console.log('Analysis completed successfully'))
  .catch(err => console.error('Analysis failed:', err));
