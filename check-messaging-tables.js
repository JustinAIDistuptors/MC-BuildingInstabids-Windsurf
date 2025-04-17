const http = require('http');
const fs = require('fs');

// Function to make HTTP requests to the MCP server
function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4567,
      path,
      method,
      headers: {}
    };

    if (body) {
      options.headers['Content-Type'] = 'application/json';
    }

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ error: 'Failed to parse response', raw: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

// Check if the MCP server is running
async function checkServerStatus() {
  try {
    const status = await makeRequest('/');
    console.log('MCP Server Status:', status);
    return true;
  } catch (error) {
    console.error('MCP Server is not running:', error.message);
    return false;
  }
}

// Check the structure of the messages table
async function checkMessagesTable() {
  try {
    const result = await makeRequest('/table/messages');
    console.log('\nMessages Table Structure:');
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Error checking messages table:', error.message);
    return null;
  }
}

// Check the structure of the message_recipients table
async function checkMessageRecipientsTable() {
  try {
    const result = await makeRequest('/table/message_recipients');
    console.log('\nMessage Recipients Table Structure:');
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Error checking message_recipients table:', error.message);
    return null;
  }
}

// Query sample data from messages table
async function queryMessagesData() {
  try {
    const result = await makeRequest('/query', 'POST', {
      table: 'messages',
      limit: 5
    });
    console.log('\nSample Messages Data:');
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Error querying messages data:', error.message);
    return null;
  }
}

// Query sample data from message_recipients table
async function queryMessageRecipientsData() {
  try {
    const result = await makeRequest('/query', 'POST', {
      table: 'message_recipients',
      limit: 5
    });
    console.log('\nSample Message Recipients Data:');
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Error querying message_recipients data:', error.message);
    return null;
  }
}

// Main function to run all checks
async function runDatabaseChecks() {
  console.log('Starting database structure check...');
  
  const serverRunning = await checkServerStatus();
  if (!serverRunning) {
    console.error('Please start the MCP server before running this script.');
    return;
  }
  
  const messagesTable = await checkMessagesTable();
  const messageRecipientsTable = await checkMessageRecipientsTable();
  
  if (messagesTable) {
    await queryMessagesData();
  }
  
  if (messageRecipientsTable) {
    await queryMessageRecipientsData();
  }
  
  // Analyze the results and generate recommendations
  const recommendations = analyzeDatabase(messagesTable, messageRecipientsTable);
  
  // Write recommendations to a file
  fs.writeFileSync('database-analysis-results.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    messagesTable,
    messageRecipientsTable,
    recommendations
  }, null, 2));
  
  console.log('\nDatabase analysis complete. Results saved to database-analysis-results.json');
  console.log('\nRecommendations:');
  console.log(recommendations);
}

// Analyze the database structure and generate recommendations
function analyzeDatabase(messagesTable, messageRecipientsTable) {
  const recommendations = [];
  
  // Check if messages table has recipient_id column
  if (messagesTable && messagesTable.columns) {
    const hasRecipientId = messagesTable.columns.some(col => col.column_name === 'recipient_id');
    
    if (hasRecipientId) {
      recommendations.push('The messages table still has a recipient_id column that should be removed.');
    }
  }
  
  // Check if message_recipients table exists
  if (!messageRecipientsTable || !messageRecipientsTable.columns) {
    recommendations.push('The message_recipients table does not exist or could not be accessed. It needs to be created.');
  }
  
  // If no issues found
  if (recommendations.length === 0) {
    recommendations.push('The database schema appears to be correctly set up for the messaging system.');
  }
  
  return recommendations;
}

// Run the checks
runDatabaseChecks();