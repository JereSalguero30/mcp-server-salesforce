require('dotenv').config();
const { createHttpServer } = require('./dist/tools/http-server');

const port = process.env.PORT || 3000; // <- CAMBIO CLAVE AQUÍ

createHttpServer({ port }).then(() => {
  console.log('✅ MCP server HTTP listening on port', port);
  console.log("USERNAME:", process.env.SALESFORCE_USERNAME);
  console.log("PASSWORD:", process.env.SALESFORCE_PASSWORD);
});

