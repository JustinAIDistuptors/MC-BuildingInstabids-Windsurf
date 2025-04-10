const fs = require('fs');
const http = require('http');

// Read the SQL file
const sql = fs.readFileSync('./migration.sql', 'utf8');

// Prepare the request data
const data = JSON.stringify({
  sql: sql
});

// Configure the request options
const options = {
  hostname: 'localhost',
  port: 4567,
  path: '/execute-migration',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

// Send the request
const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:');
    console.log(responseData);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

// Write the data and end the request
req.write(data);
req.end();
