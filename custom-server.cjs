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

app.listen(3000, () => {
  console.log('✅ Custom Salesforce API listening on port 3000');
});
