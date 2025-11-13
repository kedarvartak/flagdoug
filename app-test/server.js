/**
 * Simple HTTP server to serve the test website
 * This simulates kedar.com running on localhost:9000
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 9000;

const server = http.createServer((req, res) => {
  // Serve index.html for all requests
  const filePath = path.join(__dirname, 'index.html');
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end('Error loading page');
      return;
    }
    
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Kedar.com test website running at http://localhost:${PORT}`);
  console.log(`📝 Open http://localhost:${PORT} in your browser`);
  console.log(`\n⚠️  Make sure FlagDoug API is running on http://localhost:3001`);
});
