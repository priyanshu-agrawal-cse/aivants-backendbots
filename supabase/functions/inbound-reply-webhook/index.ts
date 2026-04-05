import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Validate webhook secret: check env var first, then per-user DB secrets
    const envSecret = Deno.env.get("WEBHOOK_SECRET");
    const providedSecret = req.headers.get("x-webhook-secret");
    const contentType = req.headers.get("content-type") || "";
    const isFormData = contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded");

    if (envSecret && providedSecret !== envSecret && !isFormData) {
      return new Response(JSON.stringify({ error: "Invalid webhook secret" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If no env secret, check if any user has a DB-stored webhook secret that matches
    if (!envSecret && providedSecret) {
      const { data: matchingSettings } = await serviceClient
        .from("user_settings")
        .select("user_id")
        .eq("webhook_secret", providedSecret)
        .limit(1);
      // Secret provided but doesn't match any user — reject
      if (!matchingSettings || matchingSettings.length === 0) {
        return new Response(JSON.stringify({ error: "Invalid webhook secret" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    let fromEmail = "";
    let toEmail = "";
    let subject = "";
    let replyBody = "";

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      // JSON webhook format (custom integrations, Zapier, etc.)
      const body = await req.json();
      fromEmail = (body.from || body.sender || body.from_email || "").toLowerCase().trim();
      toEmail = (body.to || body.recipient || body.to_email || "").toLowerCase().trim();
      subject = body.subject || "";
      replyBody = body.text || body.body || body.html || body.content || "";
    } else if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
      // SendGrid Inbound Parse format
      const formData = await req.formData();
      fromEmail = (formData.get("from") as string || "").toLowerCase().trim();
      toEmail = (formData.get("to") as string || "").toLowerCase().trim();
      subject = (formData.get("subject") as string) || "";
      replyBody = (formData.get("text") as string) || (formData.get("html") as string) || "";
      
      // Extract just the email from "Name <email>" format
      const emailMatch = fromEmail.match(/<([^>]+)>/);
      if (emailMatch) fromEmail = emailMatch[1];
      const toMatch = toEmail.match(/<([^>]+)>/);
      if (toMatch) toEmail = toMatch[1];
    } else {
      return new Response(JSON.stringify({ error: "Unsupported content type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate required fields
    if (!fromEmail || !replyBody) {
      return new Response(JSON.stringify({ error: "Missing from email or reply body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Truncate reply body to prevent abuse
    if (replyBody.length > 10000) {
      replyBody = replyBody.substring(0, 10000);
    }

    // Find the matching email log by looking up the lead's email
    // First find the lead by the sender's email address
    const { data: leads } = await serviceClient
      .from("leads")
      .select("id, user_id")
      .eq("email", fromEmail)
      .limit(1);

    if (!leads || leads.length === 0) {
      console.log(`No lead found for email: ${fromEmail}`);
      return new Response(JSON.stringify({ status: "ignored", reason: "no matching lead" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lead = leads[0];

    // Find the most recent email log for this lead that hasn't been replied to
    const { data: emailLogs } = await serviceClient
      .from("email_logs")
      .select("id, user_id")
      .eq("lead_id", lead.id)
      .is("replied_at", null)
      .order("sent_at", { ascending: false })
      .limit(1);

    if (!emailLogs || emailLogs.length === 0) {
      console.log(`No unreplied email log found for lead: ${lead.id}`);
      return new Response(JSON.stringify({ status: "ignored", reason: "no unreplied email log" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const emailLog = emailLogs[0];

    // Now call the classify-reply logic inline (to avoid an extra HTTP hop)
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      // Still store the reply even if AI is unavailable
      await serviceClient
        .from("email_logs")
        .update({
          reply_body: replyBody,
          replied_at: new Date().toISOString(),
        })
        .eq("id", emailLog.id);

      return new Response(JSON.stringify({ status: "stored", classified: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Classify with AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "You are a B2B sales reply classifier. Analyze email replies and classify them accurately.",
          },
          {
            role: "user",
            content: `Classify this email reply:\n\n"${replyBody.substring(0, 3000)}"`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "classify_reply",
              description: "Classify a sales email reply",
              parameters: {
                type: "object",
                properties: {
                  classification: {
                    type: "string",
                    enum: ["interested", "meeting_request", "objection", "not_interested", "out_of_office", "referral", "question", "unsubscribe"],
                  },
                  sentiment: {
                    type: "string",
                    enum: ["positive", "neutral", "negative"],
                  },
                  suggested_action: {
                    type: "string",
                    description: "Recommended next step (1-2 sentences)",
                  },
                  priority: {
                    type: "string",
                    enum: ["high", "medium", "low"],
                  },
                },
                required: ["classification", "sentiment", "suggested_action", "priority"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "classify_reply" } },
      }),
    });

    let classification = "unknown";
    let sentiment = "neutral";
    let suggestedAction = "";
    let priority = "medium";

    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        try {
          const parsed = JSON.parse(toolCall.function.arguments);
          classification = parsed.classification || classification;
          sentiment = parsed.sentiment || sentiment;
          suggestedAction = parsed.suggested_action || suggestedAction;
          priority = parsed.priority || priority;
        } catch { /* use defaults */ }
      }
    } else {
      const errText = await aiResponse.text();
      console.error("AI classification failed:", aiResponse.status, errText);
    }

    // Update email log
    await serviceClient
      .from("email_logs")
      .update({
        reply_body: replyBody,
        replied_at: new Date().toISOString(),
        reply_classification: classification,
        reply_sentiment: sentiment,
      })
      .eq("id", emailLog.id);

    // Auto-update pipeline for positive replies
    if (classification === "interested" || classification === "meeting_request") {
      const newStage = classification === "meeting_request" ? "Meeting Scheduled" : "Interested";
      const { data: existing } = await serviceClient
        .from("pipeline_stages")
        .select("id")
        .eq("lead_id", lead.id)
        .eq("user_id", lead.user_id)
        .maybeSingle();

      if (existing) {
        await serviceClient.from("pipeline_stages").update({
          stage: newStage,
          meeting_booked: classification === "meeting_request",
          updated_at: new Date().toISOString(),
        }).eq("id", existing.id);
      } else {
        await serviceClient.from("pipeline_stages").insert({
          user_id: lead.user_id,
          lead_id: lead.id,
          stage: newStage,
          meeting_booked: classification === "meeting_request",
        });
      }
    }

    // Stop active followup sequences if reply received
    await serviceClient
      .from("followup_status")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("lead_id", lead.id)
      .eq("status", "active");

    // Send email alert for high-priority replies
    if (priority === "high") {
      try {
        // Get user's email from auth
        const { data: userData } = await serviceClient.auth.admin.getUserById(lead.user_id);
        const userEmail = userData?.user?.email;

        if (userEmail) {
          const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
          // Get user's configured from_email
          const { data: settings } = await serviceClient
            .from("user_settings")
            .select("from_email")
            .eq("user_id", lead.user_id)
            .maybeSingle();
          const senderEmail = settings?.from_email || "noreply@example.com";

          if (SENDGRID_API_KEY) {
            await fetch("https://api.sendgrid.com/v3/mail/send", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${SENDGRID_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                personalizations: [{ to: [{ email: userEmail }] }],
                from: { email: senderEmail, name: "Aivants Alert" },
                subject: `🔥 High-Priority Reply: ${classification.replace(/_/g, " ")} from ${fromEmail}`,
                content: [{
                  type: "text/html",
                  value: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                      <h2 style="color: #1a1a1a;">🔔 High-Priority Reply Detected</h2>
                      <div style="background: #f4f4f5; border-radius: 8px; padding: 16px; margin: 16px 0;">
                        <p style="margin: 4px 0;"><strong>From:</strong> ${fromEmail}</p>
                        <p style="margin: 4px 0;"><strong>Classification:</strong> ${classification.replace(/_/g, " ")}</p>
                        <p style="margin: 4px 0;"><strong>Sentiment:</strong> ${sentiment}</p>
                        <p style="margin: 4px 0;"><strong>Suggested Action:</strong> ${suggestedAction}</p>
                      </div>
                      <div style="background: #ffffff; border: 1px solid #e4e4e7; border-radius: 8px; padding: 16px; margin: 16px 0;">
                        <p style="font-weight: bold; margin-bottom: 8px;">Reply Preview:</p>
                        <p style="color: #555; white-space: pre-wrap;">${replyBody.substring(0, 500)}${replyBody.length > 500 ? "..." : ""}</p>
                      </div>
                      <p style="color: #888; font-size: 12px;">This is an automated alert from Aivants. Log in to take action.</p>
                    </div>
                  `,
                }],
              }),
            });
            console.log(`Alert email sent to ${userEmail} for high-priority reply`);
          }
        }
      } catch (alertErr) {
        console.error("Failed to send alert email:", alertErr);
        // Don't fail the webhook response for alert failures
      }
    }

    // Send Telegram notification for all classified replies
    try {
      const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
      if (BOT_TOKEN) {
        const { data: tgUser } = await serviceClient
          .from("telegram_users")
          .select("telegram_chat_id, notification_prefs")
          .eq("user_id", lead.user_id)
          .eq("is_active", true)
          .maybeSingle();

        const replyNotifEnabled = tgUser?.notification_prefs?.replies !== false;
        if (tgUser?.telegram_chat_id && replyNotifEnabled) {
          const emoji = priority === "high" ? "🔥" : classification === "meeting_request" ? "📅" : "💬";
          const tgMsg =
            `${emoji} <b>New Lead Reply</b>\n\n` +
            `👤 Lead: ${fromEmail}\n` +
            `📊 Classification: <b>${classification.replace(/_/g, " ")}</b>\n` +
            `💭 Sentiment: ${sentiment}\n` +
            `⚡ Priority: ${priority}\n\n` +
            `💬 Reply:\n"${replyBody.substring(0, 300)}${replyBody.length > 300 ? "..." : ""}"\n\n` +
            `🎯 <b>Recommended:</b> ${suggestedAction}`;

          await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: tgUser.telegram_chat_id, text: tgMsg, parse_mode: "HTML" }),
          });
        }
      }
    } catch (tgErr) {
      console.error("Telegram notification failed:", tgErr);
    }

    return new Response(
      JSON.stringify({
        status: "processed",
        email_log_id: emailLog.id,
        classification,
        sentiment,
        priority,
        suggested_action: suggestedAction,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
