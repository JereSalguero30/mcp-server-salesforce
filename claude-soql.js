const { Anthropic } = require("@anthropic-ai/sdk");

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function generateSoqlFromPrompt(prompt) {
  const response = await anthropic.messages.create({
    model: "claude-3-opus-20240229",
    max_tokens: 300,
    temperature: 0,
    system: `Sos un experto en Salesforce. Convertí un pedido en lenguaje natural en una consulta SOQL válida. 
Solo devolvé la consulta, sin explicaciones. Usá objetos estándar como Contact, Account, Opportunity, Product2 y Promotion__c.`,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0]?.text?.trim();
  return text;
}

module.exports = { generateSoqlFromPrompt };
