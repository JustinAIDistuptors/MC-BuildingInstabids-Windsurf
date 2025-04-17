const http = require('http');

const options = {
  hostname: 'localhost',
  port: 4567,
  path: '/table/messages',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(JSON.parse(data));
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.end();