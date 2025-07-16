import express from 'express';
import { createSalesforceConnection } from '../utils/connection.js';
import { handleQueryRecords, QueryArgs } from './query.js';

export interface HttpServerOptions {
  port?: number;
}

export async function createHttpServer(options: HttpServerOptions = {}) {
  const port = options.port ?? 3000;
  const app = express();
  app.use(express.json());

  app.post('/query', async (req: express.Request, res: express.Response) => {
    const { objectName, fields, whereClause, orderBy, limit } = req.body;

    if (!objectName || !Array.isArray(fields)) {
      return res.status(400).json({ error: 'objectName and fields are required' });
    }

    try {
      const conn = await createSalesforceConnection();
      const result = await handleQueryRecords(conn, {
        objectName,
        fields,
        whereClause,
        orderBy,
        limit,
      } as QueryArgs);

      const text = result.content.map((c) => (c.type === 'text' ? c.text : '')).join('\n');
      if (result.isError) {
        res.status(400).json({ error: text });
      } else {
        res.json({ result: text });
      }
    } catch (e) {
      res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
    }
  });

  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      console.log(`✅ MCP HTTP server listening on port ${port}`);
      resolve(server);
    });
  });
}
