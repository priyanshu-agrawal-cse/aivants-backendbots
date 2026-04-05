require("dotenv").config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { GoogleGenAI } = require("@google/genai");

const app = express();
app.use(bodyParser.json());

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

// Configuration for Official API
const TOKEN = process.env.WHATSAPP_TOKEN;
const WEBHOOK_VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || "my-custom-token";
const SYSTEM_PROMPT = `You are a helpful business assistant. Reply intelligently to incoming customer queries.`;

// Webhook Verification (Setup)
app.get('/webhook', (req, res) => {
  if (
    req.query['hub.mode'] == 'subscribe' &&
    req.query['hub.verify_token'] == WEBHOOK_VERIFY_TOKEN
  ) {
    res.send(req.query['hub.challenge']);
  } else {
    res.sendStatus(400);
  }
});

// Incoming Message Webhook
app.post('/webhook', async (req, res) => {
  // Acknowledge receipt to avoid WhatsApp retries
  res.sendStatus(200);

  if (req.body.object) {
    if (
      req.body.entry &&
      req.body.entry[0].changes &&
      req.body.entry[0].changes[0] &&
      req.body.entry[0].changes[0].value.messages &&
      req.body.entry[0].changes[0].value.messages[0]
    ) {
      const phoneNumberId = req.body.entry[0].changes[0].value.metadata.phone_number_id;
      const from = req.body.entry[0].changes[0].value.messages[0].from; // sender phone number
      const msgBody = req.body.entry[0].changes[0].value.messages[0].text.body;

      console.log(`Incoming message from ${from}: ${msgBody}`);

      try {
        // Query Gemini AI
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `
${SYSTEM_PROMPT}

User: ${msgBody}
Assistant:
`,
        });

        const reply = response.text;
        console.log("AI:", reply);

        // Send reply via WhatsApp API
        await axios({
          method: 'POST',
          url: `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
          headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'Content-Type': 'application/json'
          },
          data: {
            messaging_product: 'whatsapp',
            to: from,
            text: { body: reply }
          }
        });
      } catch (error) {
         console.error("Error generating or sending response:", error.message);
      }
    }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`WhatsApp API Bot Webhook is listening on port ${PORT}`);
});
