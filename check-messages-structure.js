const http = require('http');

// Function to make a POST request to the MCP server
function postToMCP(endpoint, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'localhost',
      port: 4567,
      path: endpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve(parsedData);
        } catch (e) {
          console.error('Error parsing response:', e);
          resolve({ error: 'Failed to parse response', raw: responseData });
        }
      });
    });
    
    req.on('error', (e) => {
      reject(e);
    });
    
    req.write(postData);
    req.end();
  });
}

// Check the messages table structure
async function checkMessagesTable() {
  console.log('Checking messages table structure...');
  
  try {
    const result = await postToMCP('/query', {
      table: 'messages',
      limit: 1
    });
    
    if (result.error) {
      console.error('Error querying messages table:', result.error);
      return;
    }
    
    if (result.data && result.data.length > 0) {
      console.log('Messages table columns:');
      console.log(Object.keys(result.data[0]));
      
      // Check if recipient_id exists
      const hasRecipientId = Object.keys(result.data[0]).includes('recipient_id');
      console.log(`Has recipient_id column: ${hasRecipientId}`);
    } else {
      console.log('No data found in messages table');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Check if message_recipients table exists and its structure
async function checkMessageRecipientsTable() {
  console.log('\nChecking message_recipients table...');
  
  try {
    const result = await postToMCP('/query', {
      table: 'message_recipients',
      limit: 1
    });
    
    if (result.error) {
      console.log('Error querying message_recipients table:', result.error);
      console.log('Table might not exist');
      return false;
    }
    
    console.log('Message recipients table exists');
    
    if (result.data && result.data.length > 0) {
      console.log('Message_recipients table columns:');
      console.log(Object.keys(result.data[0]));
    } else {
      console.log('No data found in message_recipients table, but table exists');
    }
    
    return true;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}

// Main function
async function main() {
  try {
    await checkMessagesTable();
    await checkMessageRecipientsTable();
    
    console.log('\nDatabase check complete');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the main function
main();