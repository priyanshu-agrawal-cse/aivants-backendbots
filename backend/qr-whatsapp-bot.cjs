require("dotenv").config();
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const { GoogleGenAI } = require("@google/genai");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

// State to hold the current raw QR code for the frontend
let latestQR = "";
let isReady = false;

// Expose API for frontend to retrieve the status
app.get('/api/qr', (req, res) => {
    res.json({ qr: latestQR, ready: isReady });
});

app.listen(3001, () => {
    console.log("QR Server API running on port 3001");
});

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

const SYSTEM_PROMPT = `You are a helpful business assistant. Reply intelligently to incoming customer queries.`;

const client = new Client({
    authStrategy: new LocalAuth()
});

client.on("qr", (qr) => {
    latestQR = qr; // Save raw QR string for frontend fetching
    isReady = false;
    qrcode.generate(qr, { small: true });
    console.log("QR RECEIVED - Refresh or check dashboard to see the QR code");
});

client.on("ready", () => {
    latestQR = "";
    isReady = true;
    console.log("Client is ready! The AI agent is now online and listening.");
});

client.on("message", async (msg) => {
    try {
        console.log("Incoming:", msg.from, msg.body);
        if (!msg.from.endsWith("@c.us")) return;
        if (msg.fromMe) return;
        if (msg.type !== "chat") return;
        if (!msg.body || typeof msg.body !== 'string' || !msg.body.trim()) return;

        const chat = await msg.getChat();
        await chat.sendStateTyping();

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `\n${SYSTEM_PROMPT}\nUser: ${msg.body}\nAssistant:\n`,
        });

        const reply = response.text;
        console.log("AI:", reply);

        await chat.clearState();
        await chat.sendMessage(reply);

    } catch (error) {
        console.error("Error generating or sending response:", error.message);
        if (error.message.includes("is not fully visible")) return;
    }
});

client.initialize();
