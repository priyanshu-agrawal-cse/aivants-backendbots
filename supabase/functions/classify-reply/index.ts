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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email_log_id, reply_body } = await req.json();
    if (!email_log_id || !reply_body) {
      return new Response(JSON.stringify({ error: "Missing email_log_id or reply_body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Classify the reply using AI with tool calling for structured output
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
            content: `You are a B2B sales reply classifier. Analyze email replies and classify them accurately.`,
          },
          {
            role: "user",
            content: `Classify this email reply:\n\n"${reply_body}"`,
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
                    description: "The type of reply",
                  },
                  sentiment: {
                    type: "string",
                    enum: ["positive", "neutral", "negative"],
                    description: "Overall sentiment",
                  },
                  suggested_action: {
                    type: "string",
                    description: "Recommended next step for the sales rep (1-2 sentences)",
                  },
                  priority: {
                    type: "string",
                    enum: ["high", "medium", "low"],
                    description: "Priority level for follow-up",
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

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, try again later" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    let classification = "unknown";
    let sentiment = "neutral";
    let suggestedAction = "";
    let priority = "medium";

    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      classification = parsed.classification;
      sentiment = parsed.sentiment;
      suggestedAction = parsed.suggested_action;
      priority = parsed.priority;
    }

    // Update the email log with classification
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await serviceClient
      .from("email_logs")
      .update({
        reply_classification: classification,
        reply_sentiment: sentiment,
        reply_body: reply_body,
        replied_at: new Date().toISOString(),
      })
      .eq("id", email_log_id);

    // If interested or meeting_request, update pipeline stage
    if (classification === "interested" || classification === "meeting_request") {
      const { data: emailLog } = await serviceClient
        .from("email_logs")
        .select("lead_id")
        .eq("id", email_log_id)
        .single();

      if (emailLog?.lead_id) {
        const newStage = classification === "meeting_request" ? "Meeting Scheduled" : "Interested";
        const { data: existing } = await serviceClient
          .from("pipeline_stages")
          .select("id")
          .eq("lead_id", emailLog.lead_id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (existing) {
          await serviceClient
            .from("pipeline_stages")
            .update({
              stage: newStage,
              meeting_booked: classification === "meeting_request",
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
        } else {
          await serviceClient.from("pipeline_stages").insert({
            user_id: user.id,
            lead_id: emailLog.lead_id,
            stage: newStage,
            meeting_booked: classification === "meeting_request",
          });
        }
      }
    }

    // Send email alert for high-priority replies
    if (priority === "high") {
      try {
        const { data: userData } = await serviceClient.auth.admin.getUserById(user.id);
        const userEmail = userData?.user?.email;

        if (userEmail) {
          const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
          const { data: settings } = await serviceClient
            .from("user_settings")
            .select("from_email")
            .eq("user_id", user.id)
            .maybeSingle();
          const senderEmail = settings?.from_email || "noreply@example.com";

          // Get lead info for the alert
          const { data: emailLogData } = await serviceClient
            .from("email_logs")
            .select("lead_id, leads(first_name, last_name, email, company_name)")
            .eq("id", email_log_id)
            .single();
          const leadInfo = (emailLogData as any)?.leads;
          const leadName = leadInfo ? `${leadInfo.first_name} ${leadInfo.last_name || ""}`.trim() : "Unknown";
          const leadEmail = leadInfo?.email || "unknown";

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
                subject: `🔥 High-Priority Reply: ${classification.replace(/_/g, " ")} from ${leadName}`,
                content: [{
                  type: "text/html",
                  value: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                      <h2 style="color: #1a1a1a;">🔔 High-Priority Reply Detected</h2>
                      <div style="background: #f4f4f5; border-radius: 8px; padding: 16px; margin: 16px 0;">
                        <p style="margin: 4px 0;"><strong>Lead:</strong> ${leadName} (${leadEmail})</p>
                        <p style="margin: 4px 0;"><strong>Company:</strong> ${leadInfo?.company_name || "N/A"}</p>
                        <p style="margin: 4px 0;"><strong>Classification:</strong> ${classification.replace(/_/g, " ")}</p>
                        <p style="margin: 4px 0;"><strong>Sentiment:</strong> ${sentiment}</p>
                        <p style="margin: 4px 0;"><strong>Suggested Action:</strong> ${suggestedAction}</p>
                      </div>
                      <div style="background: #ffffff; border: 1px solid #e4e4e7; border-radius: 8px; padding: 16px; margin: 16px 0;">
                        <p style="font-weight: bold; margin-bottom: 8px;">Reply Preview:</p>
                        <p style="color: #555; white-space: pre-wrap;">${reply_body.substring(0, 500)}${reply_body.length > 500 ? "..." : ""}</p>
                      </div>
                      <p style="color: #888; font-size: 12px;">This is an automated alert from Aivants. Log in to take action.</p>
                    </div>
                  `,
                }],
              }),
            });
            console.log(`Alert email sent to ${userEmail} for high-priority reply from ${leadName}`);
          }
        }
      } catch (alertErr) {
        console.error("Failed to send alert email:", alertErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        classification,
        sentiment,
        suggested_action: suggestedAction,
        priority,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
