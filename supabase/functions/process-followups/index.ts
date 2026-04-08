import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function sendTelegramNotification(
  serviceClient: any,
  userId: string,
  message: string,
  category?: string
) {
  const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!BOT_TOKEN) return;

  const { data: telegramUser } = await serviceClient
    .from("telegram_users")
    .select("telegram_chat_id, notification_prefs")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (!telegramUser?.telegram_chat_id) return;

  if (category && telegramUser.notification_prefs) {
    if (telegramUser.notification_prefs[category] === false) return;
  }

  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: telegramUser.telegram_chat_id,
        text: message,
        parse_mode: "HTML",
      }),
    });
  } catch (err) {
    console.error("Telegram notification failed:", err);
  }
}

async function checkConditionMet(
  supabase: any,
  followup: any
): Promise<boolean> {
  const condition = followup.condition_stop_on;
  if (!condition) return false;

  if (condition === "reply") {
    const { data } = await supabase
      .from("email_logs")
      .select("id")
      .eq("lead_id", followup.lead_id)
      .not("replied_at", "is", null)
      .limit(1);
    return (data && data.length > 0);
  }

  if (condition === "meeting_booked") {
    const { data } = await supabase
      .from("pipeline_stages")
      .select("id")
      .eq("lead_id", followup.lead_id)
      .eq("meeting_booked", true)
      .limit(1);
    return (data && data.length > 0);
  }

  if (condition === "payment_completed") {
    // Check pipeline for client_won as proxy for payment
    const { data } = await supabase
      .from("pipeline_stages")
      .select("id")
      .eq("lead_id", followup.lead_id)
      .eq("client_won", true)
      .limit(1);
    return (data && data.length > 0);
  }

  return false;
}

async function buildEmailContent(
  supabase: any,
  step: any,
  lead: any
): Promise<{ subject: string; body: string } | null> {
  let subject = step.subject_override || "";
  let body = step.body_override || "";

  if (!body && step.email_templates) {
    subject = subject || step.email_templates.subject;
    body = step.email_templates.body;
  }

  if (!body && step.outreach_scripts) {
    body = step.outreach_scripts.full_template;
    subject = subject || `Quick question for ${lead.first_name || "you"}`;
  }

  if (!body) return null;

  const replaceVars = (text: string) =>
    text
      .replace(/\{first_name\}/g, lead.first_name || "")
      .replace(/\{last_name\}/g, lead.last_name || "")
      .replace(/\{company_name\}/g, lead.company_name || "")
      .replace(/\{industry\}/g, lead.industry || "")
      .replace(/\{location\}/g, lead.location || "");

  subject = replaceVars(subject);
  body = replaceVars(body);

  if (step.content_assets?.file_url) {
    body += `\n\n📎 ${step.content_assets.title}: ${step.content_assets.file_url}`;
  }

  return { subject, body };
}

async function sendEmail(
  apiKey: string,
  fromEmail: string,
  toEmail: string,
  subject: string,
  body: string
): Promise<boolean> {
  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: toEmail }] }],
      from: { email: fromEmail },
      subject,
      content: [{ type: "text/html", value: `<div style="white-space:pre-wrap">${body}</div>` }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`SendGrid error:`, errText);
    return false;
  }
  return true;
}

async function getNextStepInfo(
  supabase: any,
  sequenceId: string,
  afterStep: number
): Promise<{ step_number: number; delay_days: number } | null> {
  const { data } = await supabase
    .from("followup_steps")
    .select("step_number, delay_days")
    .eq("sequence_id", sequenceId)
    .gt("step_number", afterStep)
    .order("step_number", { ascending: true })
    .limit(1)
    .single();
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
    if (!SENDGRID_API_KEY) {
      return new Response(JSON.stringify({ error: "SendGrid not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date().toISOString();

    const { data: pendingFollowups, error: fetchError } = await supabase
      .from("followup_status")
      .select("*")
      .eq("status", "active")
      .lte("next_followup_date", now)
      .limit(50);

    if (fetchError) {
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!pendingFollowups || pendingFollowups.length === 0) {
      return new Response(JSON.stringify({ processed: 0, message: "No pending followups" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let processed = 0;
    let errors = 0;

    for (const followup of pendingFollowups) {
      try {
        // Check conditional stop
        const conditionMet = await checkConditionMet(supabase, followup);
        if (conditionMet) {
          const stopReason = followup.condition_stop_on === "reply" ? "replied"
            : followup.condition_stop_on === "meeting_booked" ? "completed"
            : "completed";
          await supabase.from("followup_status").update({ status: stopReason, updated_at: now }).eq("id", followup.id);

          // Notify via Telegram
          const { data: lead } = await supabase.from("leads").select("first_name, company_name").eq("id", followup.lead_id).single();
          if (lead) {
            const name = lead.first_name + (lead.company_name ? ` (${lead.company_name})` : "");
            await sendTelegramNotification(
              supabase, followup.user_id,
              `✅ <b>Follow-up auto-stopped</b>\n${name} — condition met: ${followup.condition_stop_on}`,
              "campaigns"
            );
          }
          continue;
        }

        // Also check for replies (legacy behavior)
        if (!followup.condition_stop_on) {
          const { data: replyLogs } = await supabase
            .from("email_logs")
            .select("id")
            .eq("lead_id", followup.lead_id)
            .not("replied_at", "is", null)
            .limit(1);
          if (replyLogs && replyLogs.length > 0) {
            await supabase.from("followup_status").update({ status: "replied", updated_at: now }).eq("id", followup.id);
            continue;
          }
        }

        const nextStepNumber = followup.current_step + 1;
        const { data: step } = await supabase
          .from("followup_steps")
          .select("*, outreach_scripts(*), email_templates(*), content_assets(*)")
          .eq("sequence_id", followup.sequence_id)
          .eq("step_number", nextStepNumber)
          .single();

        if (!step) {
          await supabase.from("followup_status").update({ status: "completed", updated_at: now }).eq("id", followup.id);
          continue;
        }

        // Handle Voice Channel
        if (step.channel === "voice" || step.action_type === "voice") {
          const { data: lead } = await supabase.from("leads").select("*").eq("id", followup.lead_id).single();
          if (!lead) {
            await supabase.from("followup_status").update({ status: "completed", updated_at: now }).eq("id", followup.id);
            continue;
          }

          // Resolve Persona and From Number
          let fromNumber = step.voice_from_number;
          let personaId = step.voice_persona_id;

          if (!fromNumber && followup.campaign_id) {
            const { data: campaign } = await supabase
              .from("campaigns")
              .select("voice_from_number, voice_persona_id")
              .eq("id", followup.campaign_id)
              .single();
            fromNumber = campaign?.voice_from_number;
            personaId = personaId || campaign?.voice_persona_id;
          }

          // Default fallback if still missing
          fromNumber = fromNumber || "unknown"; // trigger-voice-call will handle validation
          personaId = personaId || "sales_executive";

          // Build context
          const replaceVars = (text: string) =>
            text
              .replace(/\{first_name\}/g, lead.first_name || "")
              .replace(/\{last_name\}/g, lead.last_name || "")
              .replace(/\{company_name\}/g, lead.company_name || "")
              .replace(/\{industry\}/g, lead.industry || "");

          const callContext = replaceVars(step.body_override || "Follow-up conversation");

          // Trigger AI Voice Call
          try {
            const { data: vRes, error: vErr } = await supabase.functions.invoke("trigger-voice-call", {
              body: {
                user_id: followup.user_id,
                lead_id: lead.id,
                to_number: lead.phone,
                from_number: fromNumber,
                persona_id: personaId,
                context: callContext,
                campaign_id: followup.campaign_id
              }
            });

            if (vErr || vRes?.error) {
              console.error("Voice trigger failed:", vErr || vRes?.error);
              errors++;
              continue;
            }
          } catch (vErr) {
            console.error("Voice trigger exception:", vErr);
            errors++;
            continue;
          }

          const nextInfo = await getNextStepInfo(supabase, followup.sequence_id, nextStepNumber);
          const nextDate = nextInfo ? new Date(Date.now() + nextInfo.delay_days * 86400000).toISOString() : null;
          
          await supabase.from("followup_status").update({
            current_step: nextStepNumber,
            next_followup_date: nextDate,
            updated_at: now,
            ...(nextDate ? {} : { status: "completed" }),
          }).eq("id", followup.id);

          // Notify via Telegram
          await sendTelegramNotification(
            supabase, followup.user_id,
            `📞 <b>AI Call Triggered</b>\n${lead.first_name} ${lead.last_name || ""} — Step ${nextStepNumber} (Follow-up)`,
            "campaigns"
          );

          processed++;
          continue;
        }

        // Skip other non-email channels
        if (step.channel !== "email" && step.action_type !== "email") {
          const nextInfo = await getNextStepInfo(supabase, followup.sequence_id, nextStepNumber);
          const nextDate = nextInfo ? new Date(Date.now() + nextInfo.delay_days * 86400000).toISOString() : null;
          await supabase.from("followup_status").update({
            current_step: nextStepNumber,
            next_followup_date: nextDate,
            updated_at: now,
            ...(nextDate ? {} : { status: "completed" }),
          }).eq("id", followup.id);
          continue;
        }

        const { data: lead } = await supabase.from("leads").select("*").eq("id", followup.lead_id).single();
        if (!lead) {
          await supabase.from("followup_status").update({ status: "completed", updated_at: now }).eq("id", followup.id);
          continue;
        }

        const { data: settings } = await supabase.from("user_settings").select("from_email").eq("user_id", followup.user_id).single();
        const fromEmail = settings?.from_email || "noreply@example.com";

        const emailContent = await buildEmailContent(supabase, step, lead);
        if (!emailContent) {
          console.warn(`Step ${nextStepNumber} has no content, skipping`);
          continue;
        }

        const sent = await sendEmail(SENDGRID_API_KEY, fromEmail, lead.email, emailContent.subject, emailContent.body);
        if (!sent) { errors++; continue; }

        await supabase.from("email_logs").insert({
          user_id: followup.user_id,
          lead_id: followup.lead_id,
          campaign_id: followup.campaign_id,
          status: "sent",
          sent_at: now,
        });

        const nextInfo = await getNextStepInfo(supabase, followup.sequence_id, nextStepNumber);
        const nextFollowupDate = nextInfo ? new Date(Date.now() + nextInfo.delay_days * 86400000).toISOString() : null;

        await supabase.from("followup_status").update({
          current_step: nextStepNumber,
          last_email_sent_at: now,
          next_followup_date: nextFollowupDate,
          updated_at: now,
          ...(nextFollowupDate ? {} : { status: "completed" }),
        }).eq("id", followup.id);

        // Telegram notification for follow-up sent
        const type = followup.followup_type || "sales";
        const emoji = type === "payment_reminder" ? "💰" : "📧";
        await sendTelegramNotification(
          supabase, followup.user_id,
          `${emoji} <b>Follow-up sent</b>\n${lead.first_name} ${lead.last_name || ""} — Step ${nextStepNumber}\nType: ${type.replace("_", " ")}`,
          "campaigns"
        );

        processed++;
      } catch (stepErr) {
        console.error(`Error processing followup ${followup.id}:`, stepErr);
        errors++;
      }
    }

    return new Response(
      JSON.stringify({ processed, errors, total: pendingFollowups.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
