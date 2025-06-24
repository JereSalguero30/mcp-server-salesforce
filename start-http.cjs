const { createHttpServer } = require('./dist/tools/http-server');

createHttpServer({ port: 3000 }).then(() => {
  console.log('✅ MCP server HTTP listening on port 3000');
});
