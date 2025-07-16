require('dotenv').config();

const { createHttpServer } = require('./dist/tools/http-server');


createHttpServer().then(() => {
  console.log('✅ MCP server HTTP listening on port 3000');
  console.log("USERNAME:", process.env.SALESFORCE_USERNAME);
  console.log("PASSWORD:", process.env.SALESFORCE_PASSWORD);
});
