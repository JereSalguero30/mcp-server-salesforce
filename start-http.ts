import { createHttpServer } from '@tsmztech/mcp-server-salesforce';

createHttpServer({
    port: 3000,
}).then(() => {
    console.log('✅ MCP server HTTP listening on port 3000');
});

