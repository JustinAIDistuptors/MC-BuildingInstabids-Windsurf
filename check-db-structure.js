const http = require('http');

// Function to make a request to the MCP server
function makeRequest(path, method, body = null) {
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

// Check the messages table structure
async function checkMessagesTable() {
  console.log('Checking messages table structure...');
  
  const sql = `
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = 'messages' 
    ORDER BY ordinal_position;
  `;
  
  try {
    const result = await makeRequest('/execute-sql', 'POST', { sql });
    console.log('Messages Table Structure:');
    console.log(JSON.stringify(result, null, 2));
    
    // Check if recipient_id column exists
    if (result.data) {
      const hasRecipientId = result.data.some(col => col.column_name === 'recipient_id');
      console.log(`recipient_id column exists: ${hasRecipientId}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error checking messages table:', error);
    return null;
  }
}

// Check if message_recipients table exists
async function checkMessageRecipientsTable() {
  console.log('Checking if message_recipients table exists...');
  
  const sql = `
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 'message_recipients'
    ) as exists;
  `;
  
  try {
    const result = await makeRequest('/execute-sql', 'POST', { sql });
    console.log('Message Recipients Table Exists:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.data && result.data[0]) {
      console.log(`message_recipients table exists: ${result.data[0].exists}`);
      
      // If table exists, check its structure
      if (result.data[0].exists) {
        const structureSql = `
          SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_name = 'message_recipients' 
          ORDER BY ordinal_position;
        `;
        
        const structureResult = await makeRequest('/execute-sql', 'POST', { sql: structureSql });
        console.log('Message Recipients Table Structure:');
        console.log(JSON.stringify(structureResult, null, 2));
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error checking message_recipients table:', error);
    return null;
  }
}

// Main function
async function main() {
  try {
    // Check if the MCP server is running
    const serverStatus = await makeRequest('/', 'GET');
    console.log('MCP Server Status:', serverStatus);
    
    // Check the messages table
    await checkMessagesTable();
    
    // Check the message_recipients table
    await checkMessageRecipientsTable();
    
    console.log('Database check complete.');
  } catch (error) {
    console.error('Error:', error);
    console.log('Make sure the MCP server is running at http://localhost:4567/');
  }
}

// Run the main function
main();