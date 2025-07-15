const express = require('express');
const jsforce = require('jsforce');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(express.json());

const conn = new jsforce.Connection({
  loginUrl: process.env.SALESFORCE_INSTANCE_URL
});

app.post('/contact-by-phone', async (req, res) => {
  const phone = req.body.phone;

  if (!phone) return res.status(400).json({ error: 'Missing phone' });

  try {
    await conn.login(
      process.env.SALESFORCE_USERNAME,
      process.env.SALESFORCE_PASSWORD + process.env.SALESFORCE_TOKEN
    );

    const result = await conn.query(
      `SELECT Id, FirstName, LastName, Phone FROM Contact WHERE Phone = '${phone}' LIMIT 5`
    );

    res.json(result.records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const simplePromptToQuery = (prompt) => {
  // Prototipo simple basado en palabras clave (puede mejorar con OpenAI)
  const lower = prompt.toLowerCase();

  if (lower.includes("contacto") || lower.includes("contactos")) {
    if (lower.includes("teléfono") || lower.includes("telefono")) {
      return "SELECT Id, FirstName, LastName, Phone FROM Contact WHERE Phone != null LIMIT 10";
    }
    return "SELECT Id, FirstName, LastName FROM Contact LIMIT 10";
  }

  if (lower.includes("cuentas") || lower.includes("account")) {
    return "SELECT Id, Name, Phone FROM Account LIMIT 10";
  }

  return null;
};

const { generateSoqlFromPrompt } = require('./claude-soql.cjs');

function addPhoneFilter(query, phone, contactId, accountId) {
  const match = query.match(/from\s+(\w+)/i);
  if (!match) return query;
  const object = match[1].toLowerCase();

  let condition = '';
  if (object === 'contact' && contactId) {
    condition = `Id = '${contactId}'`;
  } else if (object === 'account' && accountId) {
    condition = `Id = '${accountId}'`;
  } else if (object === 'opportunity' && accountId) {
    condition = `AccountId = '${accountId}'`;
  } else {
    return query;
  }

  if (/where/i.test(query)) {
    return query.replace(/where/i, `WHERE ${condition} AND`);
  }
  return `${query} WHERE ${condition}`;
}

app.post('/query-natural', async (req, res) => {
  const prompt = req.body.prompt;
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

  try {
    const query = await generateSoqlFromPrompt(prompt);
    console.log("🧠 Claude generó SOQL:", query);

    await conn.login(
      process.env.SALESFORCE_USERNAME,
      process.env.SALESFORCE_PASSWORD + process.env.SALESFORCE_TOKEN
    );

    const result = await conn.query(query);
    res.json(result.records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/prompt-query', async (req, res) => {
  const { prompt, phone } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

  try {
    let contactId = null;
    let accountId = null;

    if (phone) {
      await conn.login(
        process.env.SALESFORCE_USERNAME,
        process.env.SALESFORCE_PASSWORD + process.env.SALESFORCE_TOKEN
      );

      const contactRes = await conn.query(
        `SELECT Id, AccountId FROM Contact WHERE Phone = '${phone}' OR MobilePhone = '${phone}' LIMIT 1`
      );
      if (contactRes.records && contactRes.records.length > 0) {
        contactId = contactRes.records[0].Id;
        accountId = contactRes.records[0].AccountId;
      }
    }

    let query = await generateSoqlFromPrompt(prompt);
    console.log('🧠 Claude generó SOQL:', query);

    if (phone && (contactId || accountId)) {
      query = addPhoneFilter(query, phone, contactId, accountId);
      console.log('🔎 Query con filtro de teléfono:', query);
    }

    if (!conn.accessToken) {
      await conn.login(
        process.env.SALESFORCE_USERNAME,
        process.env.SALESFORCE_PASSWORD + process.env.SALESFORCE_TOKEN
      );
    }

    const result = await conn.query(query);
    res.json(result.records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Custom Salesforce API listening on port ${PORT}`);
});

