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

const { generateSoqlFromPrompt } = require('./claude-soql');

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


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Custom Salesforce API listening on port ${PORT}`);
});

