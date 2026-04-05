import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function sendTelegramNotification(supabase: any, userId: string, message: string, category?: string) {
  const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!BOT_TOKEN) return;
  const { data: tu } = await supabase.from("telegram_users").select("telegram_chat_id, notification_prefs").eq("user_id", userId).eq("is_active", true).maybeSingle();
  if (!tu?.telegram_chat_id) return;
  if (category && tu.notification_prefs?.[category] === false) return;
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: tu.telegram_chat_id, text: message, parse_mode: "HTML" }),
    });
  } catch (e) { console.error("Telegram notify failed:", e); }
}

async function logAction(supabase: any, userId: string | null, action: string, category: string, details: any, status = "success", errorMessage?: string) {
  try {
    await supabase.from("system_logs").insert({
      user_id: userId,
      action,
      category,
      details,
      status,
      error_message: errorMessage,
    });
  } catch (e) { console.error("Log insert failed:", e); }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const SENDGRID_KEY = Deno.env.get("SENDGRID_API_KEY");
    const now = new Date();
    const results: any = { followups: 0, deadlines: 0, payments: 0, errors: 0 };

    // ==========================================
    // 1. PROCESS FOLLOW-UPS (from process-followups)
    // ==========================================
    const { data: pendingFollowups } = await supabase
      .from("followup_status")
      .select("*")
      .eq("status", "active")
      .lte("next_followup_date", now.toISOString())
      .limit(50);

    for (const fu of (pendingFollowups || [])) {
      try {
        // Check reply stop condition
        const { data: replies } = await supabase.from("email_logs").select("id").eq("lead_id", fu.lead_id).not("replied_at", "is", null).limit(1);
        if (replies?.length) {
          await supabase.from("followup_status").update({ status: "replied", updated_at: now.toISOString() }).eq("id", fu.id);
          await logAction(supabase, fu.user_id, "followup_auto_stopped", "automation", { followup_id: fu.id, reason: "replied" });
          results.followups++;
          continue;
        }

        // Get next step
        const nextStep = fu.current_step + 1;
        const { data: step } = await supabase.from("followup_steps").select("*, email_templates(*), outreach_scripts(*), content_assets(*)").eq("sequence_id", fu.sequence_id).eq("step_number", nextStep).single();

        if (!step) {
          await supabase.from("followup_status").update({ status: "completed", updated_at: now.toISOString() }).eq("id", fu.id);
          results.followups++;
          continue;
        }

        if (step.channel === "email" && SENDGRID_KEY) {
          const { data: lead } = await supabase.from("leads").select("*").eq("id", fu.lead_id).single();
          if (!lead) continue;

          const { data: settings } = await supabase.from("user_settings").select("from_email").eq("user_id", fu.user_id).single();
          const fromEmail = settings?.from_email || "noreply@aivants.com";

          let subject = step.subject_override || step.email_templates?.subject || `Follow-up for ${lead.first_name}`;
          let body = step.body_override || step.email_templates?.body || step.outreach_scripts?.full_template || "";

          const replaceVars = (t: string) => t
            .replace(/\{first_name\}/g, lead.first_name || "")
            .replace(/\{last_name\}/g, lead.last_name || "")
            .replace(/\{company_name\}/g, lead.company_name || "");

          subject = replaceVars(subject);
          body = replaceVars(body);
          if (step.content_assets?.file_url) body += `\n\n📎 ${step.content_assets.title}: ${step.content_assets.file_url}`;

          const resp = await fetch("https://api.sendgrid.com/v3/mail/send", {
            method: "POST",
            headers: { Authorization: `Bearer ${SENDGRID_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              personalizations: [{ to: [{ email: lead.email }] }],
              from: { email: fromEmail },
              subject,
              content: [{ type: "text/html", value: `<div style="white-space:pre-wrap">${body}</div>` }],
            }),
          });

          if (resp.ok) {
            await supabase.from("email_logs").insert({ user_id: fu.user_id, lead_id: fu.lead_id, campaign_id: fu.campaign_id, status: "sent", sent_at: now.toISOString() });
            await logAction(supabase, fu.user_id, "followup_email_sent", "email", { lead_id: fu.lead_id, step: nextStep });
            await sendTelegramNotification(supabase, fu.user_id, `📧 <b>Follow-up sent</b>\n${lead.first_name} ${lead.last_name || ""} — Step ${nextStep}`, "campaigns");
          }
        }

        // Advance step
        const { data: nextInfo } = await supabase.from("followup_steps").select("step_number, delay_days").eq("sequence_id", fu.sequence_id).gt("step_number", nextStep).order("step_number", { ascending: true }).limit(1).single();
        const nextDate = nextInfo ? new Date(Date.now() + nextInfo.delay_days * 86400000).toISOString() : null;
        await supabase.from("followup_status").update({
          current_step: nextStep,
          last_email_sent_at: now.toISOString(),
          next_followup_date: nextDate,
          updated_at: now.toISOString(),
          ...(nextDate ? {} : { status: "completed" }),
        }).eq("id", fu.id);

        results.followups++;
      } catch (e) {
        console.error(`Followup error ${fu.id}:`, e);
        await logAction(supabase, fu.user_id, "followup_error", "automation", { followup_id: fu.id }, "error", String(e));
        results.errors++;
      }
    }

    // ==========================================
    // 2. CHECK PROJECT DEADLINES
    // ==========================================
    const checkDays = [1, 3, 7];
    for (const days of checkDays) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + days);
      const dateStr = targetDate.toISOString().split("T")[0];

      const { data: projects } = await supabase.from("projects").select("id, name, deadline, user_id, team_notifications").eq("deadline", dateStr).neq("status", "completed");

      for (const p of (projects || [])) {
        // Telegram notification
        await sendTelegramNotification(supabase, p.user_id, `⏰ <b>Project deadline in ${days} day${days > 1 ? "s" : ""}</b>\n${p.name} — Due: ${p.deadline}`, "campaigns");

        // Email team if notifications enabled
        if (p.team_notifications && SENDGRID_KEY) {
          const { data: assignments } = await supabase.from("project_team_assignments").select("team_members(email, name)").eq("project_id", p.id);
          const emails = (assignments || []).map((a: any) => a.team_members?.email).filter(Boolean);
          const { data: settings } = await supabase.from("user_settings").select("from_email").eq("user_id", p.user_id).single();

          for (const email of emails) {
            await fetch("https://api.sendgrid.com/v3/mail/send", {
              method: "POST",
              headers: { Authorization: `Bearer ${SENDGRID_KEY}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                personalizations: [{ to: [{ email }] }],
                from: { email: settings?.from_email || "noreply@aivants.com", name: "Aivants" },
                subject: `⏰ Project Deadline: ${p.name} — ${days} day${days > 1 ? "s" : ""} remaining`,
                content: [{ type: "text/html", value: `<div style="font-family:sans-serif"><h2>Deadline Approaching</h2><p><strong>${p.name}</strong> is due on <strong>${p.deadline}</strong> (${days} day${days > 1 ? "s" : ""} left).</p></div>` }],
              }),
            });
          }
        }

        await logAction(supabase, p.user_id, "deadline_reminder_sent", "automation", { project_id: p.id, days_left: days });
        results.deadlines++;
      }
    }

    // ==========================================
    // 3. CHECK PAYMENT REMINDERS
    // ==========================================
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const { data: allClients } = await supabase.from("clients").select("id, name, company, monthly_payment, user_id, status").eq("status", "active").gt("monthly_payment", 0);

    for (const client of (allClients || [])) {
      const { data: payments } = await supabase.from("revenue_entries").select("id").eq("client_id", client.id).eq("type", "payment").gte("date", monthStart).limit(1);
      if (!payments?.length) {
        // No payment this month — check if it's past the 15th
        if (now.getDate() >= 15) {
          await sendTelegramNotification(supabase, client.user_id, `💰 <b>Payment pending</b>\n${client.name}${client.company ? ` (${client.company})` : ""} — ₹${Number(client.monthly_payment).toLocaleString("en-IN")} due this month`, "campaigns");
          await logAction(supabase, client.user_id, "payment_reminder_sent", "automation", { client_id: client.id, amount: client.monthly_payment });
          results.payments++;
        }
      }
    }

    // ==========================================
    // 4. PROCESS PENDING AUTOMATION JOBS
    // ==========================================
    const { data: pendingJobs } = await supabase.from("automation_jobs").select("*").eq("status", "pending").lte("scheduled_for", now.toISOString()).limit(20);

    for (const job of (pendingJobs || [])) {
      try {
        await supabase.from("automation_jobs").update({ status: "running", started_at: now.toISOString() }).eq("id", job.id);

        // Execute job based on type
        let result: any = {};
        switch (job.job_type) {
          case "send_email":
            if (SENDGRID_KEY && job.payload.to && job.payload.subject) {
              const { data: settings } = await supabase.from("user_settings").select("from_email").eq("user_id", job.user_id).single();
              const resp = await fetch("https://api.sendgrid.com/v3/mail/send", {
                method: "POST",
                headers: { Authorization: `Bearer ${SENDGRID_KEY}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                  personalizations: [{ to: [{ email: job.payload.to }] }],
                  from: { email: settings?.from_email || "noreply@aivants.com" },
                  subject: job.payload.subject,
                  content: [{ type: "text/html", value: job.payload.body || "" }],
                }),
              });
              result = { sent: resp.ok };
            }
            break;
          case "telegram_notify":
            await sendTelegramNotification(supabase, job.user_id, job.payload.message || "Notification", job.payload.category);
            result = { notified: true };
            break;
          default:
            result = { message: "Unknown job type" };
        }

        await supabase.from("automation_jobs").update({ status: "completed", completed_at: new Date().toISOString(), result }).eq("id", job.id);
        await logAction(supabase, job.user_id, `job_completed_${job.job_type}`, "automation", { job_id: job.id, result });
      } catch (e) {
        await supabase.from("automation_jobs").update({ status: "failed", error_message: String(e), completed_at: new Date().toISOString() }).eq("id", job.id);
        await logAction(supabase, job.user_id, "job_failed", "automation", { job_id: job.id }, "error", String(e));
        results.errors++;
      }
    }

    await logAction(supabase, null, "automation_run_completed", "system", results);

    return new Response(JSON.stringify({ success: true, ...results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Automation runner error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
