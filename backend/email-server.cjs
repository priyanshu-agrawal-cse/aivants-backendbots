const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const { AccessToken } = require("livekit-server-sdk");

const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Supabase Admin Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
let supabaseAdmin = null;

if (supabaseUrl && supabaseServiceKey && !supabaseServiceKey.includes("insert_")) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  console.log("✅ Supabase Admin Proxy initialized.");
} else {
  console.warn("⚠️ Supabase Admin Proxy NOT initialized — Service Role Key is missing or placeholder.");
}

// Administrative Proxy Routes (for AI Agent)
app.post("/api/proxy/get-memory", async (req, res) => {
  const { userId, key } = req.body;
  if (!supabaseAdmin) return res.status(500).json({ error: "Supabase Admin not configured" });
  
  try {
    const { data, error } = await supabaseAdmin
      .from("ai_memory")
      .select("value")
      .eq("user_id", userId)
      .eq("key", key)
      .maybeSingle();
    
    if (error) throw error;
    return res.json({ value: data ? data.value : null });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/proxy/create-campaign", async (req, res) => {
  const { userId, name, subject, body } = req.body;
  if (!supabaseAdmin) return res.status(500).json({ error: "Supabase Admin not configured" });

  try {
    const { data, error } = await supabaseAdmin
      .from("campaigns")
      .insert({
        user_id: userId,
        name,
        subject,
        body,
        status: "paused"
      })
      .select()
      .single();

    if (error) throw error;
    return res.json({ success: true, campaign: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/proxy/create-followup", async (req, res) => {
  // Add more proxy routes as needed for other agent tools
  const { userId, leadId, purpose, nextDate } = req.body;
  if (!supabaseAdmin) return res.status(500).json({ error: "Supabase Admin not configured" });

  try {
    const { data, error } = await supabaseAdmin
      .from("followup_status")
      .insert({
        user_id: userId,
        lead_id: leadId,
        purpose,
        next_followup_date: nextDate,
        status: "active"
      })
      .select()
      .single();

    if (error) throw error;
    return res.json({ success: true, followup: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/proxy/get-summary", async (req, res) => {
  const { userId } = req.body;
  if (!supabaseAdmin) return res.status(500).json({ error: "Supabase Admin not configured" });

  try {
    const [leads, campaigns] = await Promise.all([
      supabaseAdmin.from("leads").select("*", { count: "exact", head: true }).eq("user_id", userId),
      supabaseAdmin.from("campaigns").select("*", { count: "exact", head: true }).eq("user_id", userId)
    ]);
    
    return res.json({ leads: leads.count, campaigns: campaigns.count });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Helper: build a Nodemailer transporter from user-supplied credentials
function createTransporter(smtpEmail, smtpPassword) {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: smtpEmail,
      pass: smtpPassword,
    },
  });
}

// POST /api/send-email
// Body: { smtp_email, smtp_password, to, subject, body, from_name? }
app.post("/api/send-email", async (req, res) => {
  const { smtp_email, smtp_password, to, subject, body, from_name } = req.body;

  if (!smtp_email || !smtp_password || !to || !subject || !body) {
    return res.status(400).json({
      error: "Missing required fields: smtp_email, smtp_password, to, subject, body",
    });
  }

  const transporter = createTransporter(smtp_email, smtp_password);

  const mailOptions = {
    from: from_name ? `"${from_name}" <${smtp_email}>` : smtp_email,
    to,
    subject,
    html: body,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to} — Message ID: ${info.messageId}`);
    return res.json({ success: true, messageId: info.messageId });
  } catch (err) {
    console.error("❌ Failed to send email:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/test-smtp
// Body: { smtp_email, smtp_password }  — validates credentials by sending a test email to yourself
app.post("/api/test-smtp", async (req, res) => {
  const { smtp_email, smtp_password } = req.body;

  if (!smtp_email || !smtp_password) {
    return res.status(400).json({ error: "smtp_email and smtp_password are required" });
  }

  const transporter = createTransporter(smtp_email, smtp_password);

  try {
    await transporter.verify();
    return res.json({ success: true, message: "SMTP credentials verified!" });
  } catch (err) {
    console.error("❌ SMTP verification failed:", err.message);
    return res.status(401).json({ error: `SMTP Error: ${err.message}` });
  }
});

// GET /api/token
// Returns a LiveKit access token
app.get("/api/token", async (req, res) => {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl = process.env.LIVEKIT_URL;

  if (!apiKey || !apiSecret || !wsUrl) {
    return res.status(500).json({ error: "LiveKit credentials not configured" });
  }

  const participantName = req.query.participantName || "user-" + Math.floor(Math.random() * 1000);
  const roomName = req.query.roomName || "voice-chat-" + Math.floor(Math.random() * 1000);
  const userId = req.query.userId || "anonymous";
  const voiceMode = req.query.voiceMode || "default";
  const openaiKey = req.query.openaiKey || "";

  try {
    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantName,
      metadata: JSON.stringify({ userId, voiceMode, openaiKey }),
    });
    at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true });
    
    return res.json({ 
      token: await at.toJwt(),
      url: wsUrl
    });
  } catch (err) {
    console.error("❌ Failed to generate LiveKit token:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Health check
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

const PORT = process.env.EMAIL_SERVER_PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n📧 Email server (Nodemailer) running on http://localhost:${PORT}`);
  console.log(`   POST /api/send-email  — send an email`);
  console.log(`   POST /api/test-smtp   — verify SMTP credentials`);
  console.log(`   GET  /api/health      — health check\n`);
});
