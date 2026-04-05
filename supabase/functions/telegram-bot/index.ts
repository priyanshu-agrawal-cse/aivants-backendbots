import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TELEGRAM_API = "https://api.telegram.org/bot";

async function sendMessage(token: string, chatId: number, text: string, parseMode = "HTML") {
  // Telegram has a 4096 char limit per message
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= 4000) {
      chunks.push(remaining);
      break;
    }
    let splitAt = remaining.lastIndexOf("\n", 4000);
    if (splitAt < 500) splitAt = 4000;
    chunks.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt);
  }
  for (const chunk of chunks) {
    await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: chunk, parse_mode: parseMode }),
    });
  }
}

function getServiceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

async function getUserForChat(db: any, chatId: number) {
  const { data } = await db
    .from("telegram_users")
    .select("user_id")
    .eq("telegram_chat_id", chatId)
    .eq("is_active", true)
    .maybeSingle();
  return data?.user_id || null;
}

// ===================== TOOL DEFINITIONS =====================

const tools = [
  // READ tools
  {
    type: "function",
    function: {
      name: "get_leads",
      description: "Get leads with optional filters. Use for queries about leads, prospects, contacts.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "Filter by status: new, contacted, qualified, converted, lost" },
          search: { type: "string", description: "Search by name, company, or email" },
          limit: { type: "number", description: "Max results (default 10)" },
          order_by: { type: "string", enum: ["created_at", "score", "rating"] },
          order_dir: { type: "string", enum: ["asc", "desc"] },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_high_value_leads",
      description: "Get leads sorted by score. Use for 'best leads', 'top leads', 'priority leads'.",
      parameters: { type: "object", properties: { limit: { type: "number" } } },
    },
  },
  {
    type: "function",
    function: {
      name: "get_clients",
      description: "Get clients with optional status filter or search",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string" },
          search: { type: "string", description: "Search by name or company" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_pending_payments",
      description: "Get clients with pending/overdue payments",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_projects",
      description: "Get projects with optional status filter",
      parameters: { type: "object", properties: { status: { type: "string" } } },
    },
  },
  {
    type: "function",
    function: {
      name: "get_projects_near_deadline",
      description: "Get projects with deadlines approaching in the next 7 days",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_revenue_summary",
      description: "Get full revenue breakdown: income, expenses, profit",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_monthly_revenue",
      description: "Get revenue data for current or specified month",
      parameters: { type: "object", properties: { month: { type: "string", description: "YYYY-MM format" } } },
    },
  },
  {
    type: "function",
    function: {
      name: "get_campaigns",
      description: "Get email campaigns with stats",
      parameters: { type: "object", properties: { status: { type: "string" } } },
    },
  },
  {
    type: "function",
    function: {
      name: "get_email_stats",
      description: "Get email statistics: sent, opened, replied, bounced",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_pipeline",
      description: "Get deal pipeline with stages and values",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_team_members",
      description: "Get team members and their roles/costs",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_proposals",
      description: "Get proposals with optional status filter",
      parameters: { type: "object", properties: { status: { type: "string" } } },
    },
  },
  {
    type: "function",
    function: {
      name: "get_followups",
      description: "Get follow-up schedules and statuses",
      parameters: { type: "object", properties: { status: { type: "string" } } },
    },
  },
  {
    type: "function",
    function: {
      name: "get_content_assets",
      description: "Get available content assets (PDFs, documents, etc.)",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "search_knowledge_base",
      description: "Search internal knowledge base for docs, processes, notes",
      parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
    },
  },
  // WRITE tools
  {
    type: "function",
    function: {
      name: "create_lead",
      description: "Create a new lead. Use when user says 'add lead', 'create lead', 'new prospect'.",
      parameters: {
        type: "object",
        properties: {
          first_name: { type: "string" },
          last_name: { type: "string" },
          company_name: { type: "string" },
          email: { type: "string" },
          phone: { type: "string" },
          industry: { type: "string" },
        },
        required: ["first_name", "email"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_email",
      description: "Send an email to a contact. Use when user says 'send email', 'email John', etc.",
      parameters: {
        type: "object",
        properties: {
          to_email: { type: "string", description: "Recipient email" },
          subject: { type: "string" },
          body: { type: "string", description: "Email body (HTML supported)" },
          lead_name: { type: "string", description: "Name to search for if email not provided" },
        },
        required: ["subject", "body"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_asset_email",
      description: "Send a content asset (PDF, document) to someone via email",
      parameters: {
        type: "object",
        properties: {
          to_email: { type: "string" },
          lead_name: { type: "string", description: "Name to search for if email not provided" },
          asset_title: { type: "string", description: "Title of the content asset to attach" },
        },
        required: ["asset_title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_followup",
      description: "Create a follow-up task/reminder for a lead or client",
      parameters: {
        type: "object",
        properties: {
          lead_name: { type: "string", description: "Name of lead/client" },
          purpose: { type: "string", description: "Purpose of the follow-up" },
          days: { type: "number", description: "Follow up in N days from now" },
        },
        required: ["lead_name", "purpose"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "start_campaign",
      description: "Start/activate a campaign by name",
      parameters: {
        type: "object",
        properties: { campaign_name: { type: "string" } },
        required: ["campaign_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "pause_campaign",
      description: "Pause a campaign by name",
      parameters: {
        type: "object",
        properties: { campaign_name: { type: "string" } },
        required: ["campaign_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_lead_status",
      description: "Update a lead's status (e.g., mark as qualified, converted)",
      parameters: {
        type: "object",
        properties: {
          lead_name: { type: "string" },
          status: { type: "string", enum: ["new", "contacted", "qualified", "converted", "lost"] },
        },
        required: ["lead_name", "status"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_dashboard",
      description: "Get a quick dashboard overview: leads, campaigns, emails, pipeline",
      parameters: { type: "object", properties: {} },
    },
  },
];

// ===================== TOOL EXECUTION =====================

async function executeTool(db: any, userId: string, name: string, args: any): Promise<any> {
  switch (name) {
    case "get_leads": {
      let q = db.from("leads").select("id,first_name,last_name,email,company_name,status,score,rating,industry,phone,source,created_at").eq("user_id", userId);
      if (args.status) q = q.eq("status", args.status);
      if (args.search) q = q.or(`first_name.ilike.%${args.search}%,last_name.ilike.%${args.search}%,company_name.ilike.%${args.search}%,email.ilike.%${args.search}%`);
      q = q.order(args.order_by || "created_at", { ascending: args.order_dir === "asc" });
      const { data, error } = await q.limit(args.limit || 10);
      if (error) return { error: error.message };
      return { leads: data, count: data?.length };
    }
    case "get_high_value_leads": {
      const { data } = await db.from("leads").select("id,first_name,last_name,email,company_name,status,score,rating,industry").eq("user_id", userId).order("score", { ascending: false }).limit(args.limit || 10);
      return { leads: data, count: data?.length };
    }
    case "get_clients": {
      let q = db.from("clients").select("*").eq("user_id", userId);
      if (args.status) q = q.eq("status", args.status);
      if (args.search) q = q.or(`name.ilike.%${args.search}%,company.ilike.%${args.search}%`);
      const { data } = await q.limit(50);
      return { clients: data, count: data?.length };
    }
    case "get_pending_payments": {
      const { data: clients } = await db.from("clients").select("id,name,company,monthly_payment,status").eq("user_id", userId);
      const { data: revenue } = await db.from("revenue_entries").select("*").eq("user_id", userId).eq("type", "payment").gte("date", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]);
      const paidIds = new Set((revenue || []).map((r: any) => r.client_id));
      const pending = (clients || []).filter((c: any) => c.monthly_payment > 0 && !paidIds.has(c.id));
      return { pending_payments: pending, count: pending.length };
    }
    case "get_projects": {
      let q = db.from("projects").select("id,name,status,deadline,start_date,description").eq("user_id", userId);
      if (args.status) q = q.eq("status", args.status);
      const { data } = await q.limit(50);
      return { projects: data, count: data?.length };
    }
    case "get_projects_near_deadline": {
      const nextWeek = new Date(); nextWeek.setDate(nextWeek.getDate() + 7);
      const { data } = await db.from("projects").select("id,name,status,deadline").eq("user_id", userId).not("deadline", "is", null).lte("deadline", nextWeek.toISOString().split("T")[0]).neq("status", "completed");
      return { projects: data, count: data?.length };
    }
    case "get_monthly_revenue": {
      const now = new Date();
      const month = args.month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const { data } = await db.from("revenue_entries").select("*").eq("user_id", userId).gte("date", `${month}-01`).lte("date", `${month}-31`);
      const income = (data || []).filter((e: any) => e.type !== "expense").reduce((s: number, e: any) => s + Number(e.amount), 0);
      const expenses = (data || []).filter((e: any) => e.type === "expense").reduce((s: number, e: any) => s + Number(e.amount), 0);
      return { month, income, expenses, profit: income - expenses };
    }
    case "get_revenue_summary": {
      const { data } = await db.from("revenue_entries").select("*").eq("user_id", userId);
      const income = (data || []).filter((e: any) => e.type !== "expense").reduce((s: number, e: any) => s + Number(e.amount), 0);
      const expenses = (data || []).filter((e: any) => e.type === "expense").reduce((s: number, e: any) => s + Number(e.amount), 0);
      return { total_income: income, total_expenses: expenses, profit: income - expenses };
    }
    case "get_campaigns": {
      let q = db.from("campaigns").select("id,name,status,subject,created_at").eq("user_id", userId);
      if (args.status) q = q.eq("status", args.status);
      const { data } = await q.limit(20);
      // Get stats for each campaign
      if (data) {
        for (const c of data) {
          const { data: logs } = await db.from("email_logs").select("opened_at,replied_at,bounced").eq("user_id", userId).eq("campaign_id", c.id);
          (c as any).sent = logs?.length || 0;
          (c as any).opened = logs?.filter((l: any) => l.opened_at).length || 0;
          (c as any).replied = logs?.filter((l: any) => l.replied_at).length || 0;
        }
      }
      return { campaigns: data, count: data?.length };
    }
    case "get_email_stats": {
      const { data } = await db.from("email_logs").select("status,opened_at,replied_at,bounced").eq("user_id", userId);
      const total = data?.length || 0;
      const opened = (data || []).filter((e: any) => e.opened_at).length;
      const replied = (data || []).filter((e: any) => e.replied_at).length;
      const bounced = (data || []).filter((e: any) => e.bounced).length;
      return { total_sent: total, opened, replied, bounced, open_rate: total ? ((opened / total) * 100).toFixed(1) + "%" : "0%", reply_rate: total ? ((replied / total) * 100).toFixed(1) + "%" : "0%" };
    }
    case "get_pipeline": {
      const { data } = await db.from("pipeline_stages").select("stage,deal_value,meeting_booked,client_won").eq("user_id", userId);
      const stages: Record<string, { count: number; value: number }> = {};
      (data || []).forEach((p: any) => {
        if (!stages[p.stage]) stages[p.stage] = { count: 0, value: 0 };
        stages[p.stage].count++;
        stages[p.stage].value += Number(p.deal_value || 0);
      });
      return { pipeline: stages, total_deals: data?.length };
    }
    case "get_team_members": {
      const { data } = await db.from("team_members").select("*").eq("user_id", userId);
      return { team: data, active: (data || []).filter((m: any) => m.is_active).length, total: data?.length };
    }
    case "get_proposals": {
      let q = db.from("proposals").select("id,name,status,amount,client_name,industry,created_at").eq("user_id", userId);
      if (args.status) q = q.eq("status", args.status);
      const { data } = await q.limit(20);
      return { proposals: data, count: data?.length };
    }
    case "get_followups": {
      let q = db.from("followup_status").select("id,client_name,client_company,status,next_followup_date,purpose,category").eq("user_id", userId);
      if (args.status) q = q.eq("status", args.status);
      const { data } = await q.limit(30);
      return { followups: data, count: data?.length };
    }
    case "get_content_assets": {
      const { data } = await db.from("content_assets").select("id,title,type,category,description").eq("user_id", userId).limit(20);
      return { assets: data, count: data?.length };
    }
    case "search_knowledge_base": {
      const { data } = await db.from("ai_knowledge_base").select("title,content,category").eq("user_id", userId).or(`title.ilike.%${args.query}%,content.ilike.%${args.query}%`);
      return { results: data, count: data?.length };
    }
    case "get_dashboard": {
      const [{ count: leadCount }, { count: campaignCount }, { data: todayLogs }, { data: pipeline }] = await Promise.all([
        db.from("leads").select("id", { count: "exact", head: true }).eq("user_id", userId),
        db.from("campaigns").select("id", { count: "exact", head: true }).eq("user_id", userId),
        db.from("email_logs").select("id,replied_at").eq("user_id", userId).gte("sent_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
        db.from("pipeline_stages").select("meeting_booked,client_won").eq("user_id", userId),
      ]);
      return {
        leads: leadCount || 0,
        campaigns: campaignCount || 0,
        emails_today: todayLogs?.length || 0,
        replies_today: todayLogs?.filter((l: any) => l.replied_at)?.length || 0,
        meetings_booked: pipeline?.filter((p: any) => p.meeting_booked)?.length || 0,
        clients_won: pipeline?.filter((p: any) => p.client_won)?.length || 0,
      };
    }
    // WRITE tools
    case "create_lead": {
      const { data, error } = await db.from("leads").insert({
        user_id: userId,
        first_name: args.first_name,
        last_name: args.last_name || null,
        company_name: args.company_name || null,
        email: args.email,
        phone: args.phone || null,
        industry: args.industry || null,
        status: "new",
      }).select("id,first_name,last_name,email,company_name").single();
      if (error) return { error: error.message };
      return { success: true, lead: data, message: "Lead created successfully" };
    }
    case "send_email": {
      // Resolve email from lead name if needed
      let toEmail = args.to_email;
      let leadId = null;
      if (!toEmail && args.lead_name) {
        const { data: leads } = await db.from("leads").select("id,email,first_name,last_name,company_name").eq("user_id", userId)
          .or(`first_name.ilike.%${args.lead_name}%,last_name.ilike.%${args.lead_name}%,company_name.ilike.%${args.lead_name}%`).limit(1);
        if (leads?.length) { toEmail = leads[0].email; leadId = leads[0].id; }
      }
      if (!toEmail) return { error: "Could not find email address. Please specify the recipient." };

      // Get sender settings
      const { data: settings } = await db.from("user_settings").select("from_email").eq("user_id", userId).maybeSingle();
      const fromEmail = settings?.from_email || "noreply@example.com";
      const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
      if (!SENDGRID_API_KEY) return { error: "Email provider not configured" };

      const sgRes = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: { Authorization: `Bearer ${SENDGRID_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: toEmail }] }],
          from: { email: fromEmail },
          subject: args.subject,
          content: [{ type: "text/html", value: `<p>${args.body.replace(/\n/g, "<br>")}</p>` }],
        }),
      });
      if (!sgRes.ok) return { error: `Email failed: ${(await sgRes.text()).substring(0, 200)}` };

      // Find lead for logging if not already found
      if (!leadId) {
        const { data: lead } = await db.from("leads").select("id").eq("user_id", userId).eq("email", toEmail).maybeSingle();
        leadId = lead?.id || null;
      }
      await db.from("email_logs").insert({ user_id: userId, lead_id: leadId, status: "sent", sent_at: new Date().toISOString() });
      return { success: true, message: `Email sent to ${toEmail}` };
    }
    case "send_asset_email": {
      let toEmail = args.to_email;
      if (!toEmail && args.lead_name) {
        const { data: leads } = await db.from("leads").select("id,email").eq("user_id", userId)
          .or(`first_name.ilike.%${args.lead_name}%,last_name.ilike.%${args.lead_name}%,company_name.ilike.%${args.lead_name}%`).limit(1);
        if (leads?.length) toEmail = leads[0].email;
      }
      if (!toEmail) return { error: "Could not find recipient email" };

      const { data: asset } = await db.from("content_assets").select("*").eq("user_id", userId).ilike("title", `%${args.asset_title}%`).limit(1).maybeSingle();
      if (!asset) return { error: `Asset "${args.asset_title}" not found` };

      const { data: settings } = await db.from("user_settings").select("from_email").eq("user_id", userId).maybeSingle();
      const fromEmail = settings?.from_email || "noreply@example.com";
      const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
      if (!SENDGRID_API_KEY) return { error: "Email provider not configured" };

      const sgRes = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: { Authorization: `Bearer ${SENDGRID_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: toEmail }] }],
          from: { email: fromEmail },
          subject: `${asset.title} — Shared with you`,
          content: [{ type: "text/html", value: `<p>Hi,</p><p>Please find the resource below:</p><p><strong>${asset.title}</strong></p>${asset.description ? `<p>${asset.description}</p>` : ""}<p><a href="${asset.file_url}">Download ${asset.type.toUpperCase()}</a></p>` }],
        }),
      });
      if (!sgRes.ok) return { error: "Failed to send asset email" };

      const { data: lead } = await db.from("leads").select("id").eq("user_id", userId).eq("email", toEmail).maybeSingle();
      await db.from("email_logs").insert({ user_id: userId, lead_id: lead?.id || null, status: "sent", sent_at: new Date().toISOString() });
      return { success: true, message: `Sent "${asset.title}" to ${toEmail}` };
    }
    case "create_followup": {
      // Find lead
      const { data: leads } = await db.from("leads").select("id,first_name,last_name,company_name,email").eq("user_id", userId)
        .or(`first_name.ilike.%${args.lead_name}%,last_name.ilike.%${args.lead_name}%,company_name.ilike.%${args.lead_name}%`).limit(1);
      if (!leads?.length) return { error: `Lead "${args.lead_name}" not found` };
      const lead = leads[0];

      // Find first active sequence
      const { data: seq } = await db.from("followup_sequences").select("id").eq("user_id", userId).eq("is_active", true).limit(1).maybeSingle();
      if (!seq) return { error: "No active follow-up sequence found. Please create one in the portal first." };

      const days = args.days || 1;
      const nextDate = new Date(Date.now() + days * 86400000).toISOString();

      const { error } = await db.from("followup_status").insert({
        user_id: userId,
        lead_id: lead.id,
        sequence_id: seq.id,
        status: "active",
        current_step: 0,
        client_name: `${lead.first_name} ${lead.last_name || ""}`.trim(),
        client_company: lead.company_name || "",
        client_email: lead.email,
        purpose: args.purpose,
        next_followup_date: nextDate,
      });
      if (error) return { error: error.message };
      return { success: true, message: `Follow-up created for ${lead.first_name} in ${days} day(s): ${args.purpose}` };
    }
    case "start_campaign": {
      const { data: campaign, error } = await db.from("campaigns")
        .update({ status: "active", updated_at: new Date().toISOString() })
        .eq("user_id", userId).ilike("name", `%${args.campaign_name}%`).select("name").maybeSingle();
      if (error || !campaign) return { error: `Campaign "${args.campaign_name}" not found` };
      return { success: true, message: `Campaign "${campaign.name}" is now active` };
    }
    case "pause_campaign": {
      const { data: campaign, error } = await db.from("campaigns")
        .update({ status: "paused", updated_at: new Date().toISOString() })
        .eq("user_id", userId).ilike("name", `%${args.campaign_name}%`).select("name").maybeSingle();
      if (error || !campaign) return { error: `Campaign "${args.campaign_name}" not found` };
      return { success: true, message: `Campaign "${campaign.name}" is now paused` };
    }
    case "update_lead_status": {
      const { data: leads } = await db.from("leads").select("id,first_name").eq("user_id", userId)
        .or(`first_name.ilike.%${args.lead_name}%,last_name.ilike.%${args.lead_name}%,company_name.ilike.%${args.lead_name}%`).limit(1);
      if (!leads?.length) return { error: `Lead "${args.lead_name}" not found` };
      const { error } = await db.from("leads").update({ status: args.status, updated_at: new Date().toISOString() }).eq("id", leads[0].id);
      if (error) return { error: error.message };
      return { success: true, message: `${leads[0].first_name}'s status updated to "${args.status}"` };
    }
    default:
      return { error: "Unknown tool" };
  }
}

// ===================== CONVERSATION MEMORY =====================

async function getConversationHistory(db: any, chatId: number): Promise<Array<{ role: string; content: string }>> {
  const { data } = await db
    .from("telegram_chat_history")
    .select("role, content")
    .eq("telegram_chat_id", chatId)
    .order("created_at", { ascending: false })
    .limit(20);
  return (data || []).reverse();
}

async function saveMessage(db: any, chatId: number, userId: string, role: string, content: string, pendingAction: any = null) {
  await db.from("telegram_chat_history").insert({
    telegram_chat_id: chatId,
    user_id: userId,
    role,
    content,
    pending_action: pendingAction,
  });
}

async function getPendingAction(db: any, chatId: number): Promise<any> {
  const { data } = await db
    .from("telegram_chat_history")
    .select("pending_action")
    .eq("telegram_chat_id", chatId)
    .not("pending_action", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.pending_action || null;
}

async function clearPendingAction(db: any, chatId: number) {
  // Clear by updating the latest pending action entry
  const { data } = await db
    .from("telegram_chat_history")
    .select("id")
    .eq("telegram_chat_id", chatId)
    .not("pending_action", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (data) {
    await db.from("telegram_chat_history").update({ pending_action: null }).eq("id", data.id);
  }
}

// Trim conversation history to last 20 messages to prevent unbounded growth
async function trimHistory(db: any, chatId: number) {
  const { data } = await db
    .from("telegram_chat_history")
    .select("id")
    .eq("telegram_chat_id", chatId)
    .order("created_at", { ascending: false })
    .range(20, 1000);
  if (data?.length) {
    const ids = data.map((d: any) => d.id);
    await db.from("telegram_chat_history").delete().in("id", ids);
  }
}

// ===================== AI CONVERSATION HANDLER =====================

async function handleAIConversation(token: string, chatId: number, userText: string, db: any, userId: string) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    return sendMessage(token, chatId, "⚠️ AI is not configured. Please check your settings.");
  }

  // Check for pending confirmation
  const pendingAction = await getPendingAction(db, chatId);
  const isConfirmation = /^(yes|yeah|yep|sure|confirm|ok|go ahead|do it|proceed|haan|ha)/i.test(userText.trim());
  const isDenial = /^(no|nah|nope|cancel|stop|don't|nahi)/i.test(userText.trim());

  if (pendingAction && isConfirmation) {
    await clearPendingAction(db, chatId);
    // Execute the pending tool
    const result = await executeTool(db, userId, pendingAction.tool, pendingAction.args);
    const response = result.error ? `❌ ${result.error}` : `✅ ${result.message || "Done!"}`;
    await saveMessage(db, chatId, userId, "user", userText);
    await saveMessage(db, chatId, userId, "assistant", response);
    return sendMessage(token, chatId, response);
  }

  if (pendingAction && isDenial) {
    await clearPendingAction(db, chatId);
    await saveMessage(db, chatId, userId, "user", userText);
    const msg = "👍 Action cancelled.";
    await saveMessage(db, chatId, userId, "assistant", msg);
    return sendMessage(token, chatId, msg);
  }

  // Save user message
  await saveMessage(db, chatId, userId, "user", userText);

  // Load AI settings for the user
  const { data: aiSettings } = await db.from("ai_settings").select("*").eq("user_id", userId).maybeSingle();
  let apiUrl = "https://ai.gateway.lovable.dev/v1/chat/completions";
  let apiKey = LOVABLE_API_KEY;
  const model = aiSettings?.model_name || "google/gemini-3-flash-preview";
  const temperature = Number(aiSettings?.temperature) || 0.7;

  // Support external providers if configured
  if (aiSettings?.api_key && aiSettings?.provider) {
    switch (aiSettings.provider) {
      case "openai": apiUrl = "https://api.openai.com/v1/chat/completions"; apiKey = aiSettings.api_key; break;
      case "anthropic": apiUrl = "https://api.anthropic.com/v1/messages"; apiKey = aiSettings.api_key; break;
      case "groq": apiUrl = "https://api.groq.com/openai/v1/chat/completions"; apiKey = aiSettings.api_key; break;
    }
  }

  // Get conversation history
  const history = await getConversationHistory(db, chatId);

  const systemPrompt = `You are the Aivants AI Assistant on Telegram — a conversational business operator for a digital agency.

CORE BEHAVIOR:
- Respond naturally and conversationally, like a smart business assistant
- Use tools to get real data before answering data questions — never make up numbers
- Use ₹ (INR) for currency
- Keep responses concise but friendly — this is Telegram, not a report
- Use simple text formatting (no markdown, use plain text with line breaks)
- Use emojis sparingly for readability

CRITICAL RULES FOR WRITE ACTIONS:
- For destructive actions (delete, bulk operations), you MUST ask for confirmation FIRST and set needs_confirmation=true in your response
- For safe write actions (create lead, send email, create followup), execute immediately unless the user's intent is ambiguous
- When you need to confirm, describe what you're about to do clearly

CONTEXT AWARENESS:
- Use conversation history to understand references like "the one I mentioned", "that proposal", "him/her"
- If the user's intent is unclear, ask a clarifying question

Today's date: ${new Date().toISOString().split("T")[0]}`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...history.map((h) => ({ role: h.role, content: h.content })),
  ];

  try {
    // Send typing indicator
    await fetch(`${TELEGRAM_API}${token}/sendChatAction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, action: "typing" }),
    });

    // First AI call with tools
    const firstRes = await fetch(apiUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, tools, temperature, max_tokens: 2048 }),
    });

    if (!firstRes.ok) {
      const status = firstRes.status;
      if (status === 429) {
        return sendMessage(token, chatId, "⚠️ Too many requests. Please try again in a moment.");
      }
      if (status === 402) {
        return sendMessage(token, chatId, "⚠️ AI credits exhausted. Please add credits in your workspace settings.");
      }
      console.error("AI error:", status, await firstRes.text());
      return sendMessage(token, chatId, "⚠️ AI is temporarily unavailable. Please try again.");
    }

    let aiData = await firstRes.json();
    let assistantMsg = aiData.choices?.[0]?.message;

    // Process tool calls loop (up to 5 iterations)
    let iterations = 0;
    while (assistantMsg?.tool_calls && iterations < 5) {
      iterations++;
      const toolResults: any[] = [];

      for (const tc of assistantMsg.tool_calls) {
        const args = JSON.parse(tc.function.arguments || "{}");
        console.log(`[Telegram] Executing tool: ${tc.function.name}`, args);
        const result = await executeTool(db, userId, tc.function.name, args);
        toolResults.push({
          role: "tool",
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        });
      }

      const nextMessages = [...messages, assistantMsg, ...toolResults];
      const nextRes = await fetch(apiUrl, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages: nextMessages, tools, temperature, max_tokens: 2048 }),
      });

      if (!nextRes.ok) throw new Error("AI follow-up error");
      aiData = await nextRes.json();
      assistantMsg = aiData.choices?.[0]?.message;
    }

    const answer = assistantMsg?.content || "I couldn't process that. Could you rephrase?";

    // Save assistant response
    await saveMessage(db, chatId, userId, "assistant", answer);
    await trimHistory(db, chatId);

    // Send response (convert markdown to plain text for Telegram)
    const telegramText = answer
      .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
      .replace(/\*(.*?)\*/g, "<i>$1</i>")
      .replace(/`(.*?)`/g, "<code>$1</code>")
      .replace(/###\s?(.*)/g, "<b>$1</b>")
      .replace(/##\s?(.*)/g, "<b>$1</b>")
      .replace(/#\s?(.*)/g, "<b>$1</b>");

    await sendMessage(token, chatId, telegramText);

  } catch (err) {
    console.error("AI conversation error:", err);
    await sendMessage(token, chatId, "⚠️ Something went wrong. Please try again.");
  }
}

// ===================== LEGACY COMMAND HANDLERS =====================

async function handleStart(token: string, chatId: number) {
  const db = getServiceClient();
  const { data: existing } = await db
    .from("telegram_users")
    .select("user_id")
    .eq("telegram_chat_id", chatId)
    .maybeSingle();

  if (existing) {
    await sendMessage(token, chatId,
      `✅ <b>Welcome back to Aivants!</b>\n\n` +
      `You can now chat with me naturally. Try:\n` +
      `• "Show my top leads"\n` +
      `• "Send email to John from Alpha Realty"\n` +
      `• "How are my campaigns performing?"\n\n` +
      `Or use /help for classic commands.`
    );
    return;
  }

  await sendMessage(token, chatId,
    `👋 <b>Welcome to Aivants AI Assistant!</b>\n\n` +
    `Your Telegram Chat ID is: <code>${chatId}</code>\n\n` +
    `To get started:\n` +
    `1. Go to Aivants → Settings\n` +
    `2. Paste this Chat ID in the Telegram section\n` +
    `3. Click "Link Account"\n\n` +
    `Once linked, you can talk to me naturally — no commands needed!`
  );
}

async function handleHelp(token: string, chatId: number) {
  await sendMessage(token, chatId,
    `📋 <b>Aivants AI Assistant</b>\n\n` +
    `<b>💬 Just chat naturally:</b>\n` +
    `• "Show my top leads today"\n` +
    `• "Send welcome email to John from Alpha Realty"\n` +
    `• "Which clients have pending payments?"\n` +
    `• "Create follow-up for Sarah in 3 days"\n` +
    `• "Add a new lead: Mark from Skyline Realty"\n` +
    `• "Start the Q1 campaign"\n` +
    `• "How's my pipeline looking?"\n` +
    `• "Show my revenue this month"\n\n` +
    `<b>⚡ Classic commands still work:</b>\n` +
    `/dashboard — Quick overview\n` +
    `/status — Check connection\n\n` +
    `I understand context, so we can have a natural conversation! 🤖`
  );
}

// ===================== MAIN HANDLER =====================

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (!BOT_TOKEN) {
      return new Response(JSON.stringify({ error: "Bot token not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const update = await req.json();
    const message = update.message;

    if (!message || !message.text) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const chatId = message.chat.id;
    const text = message.text.trim();
    const command = text.split(" ")[0].toLowerCase().split("@")[0];

    // Handle essential commands directly
    switch (command) {
      case "/start":
        await handleStart(BOT_TOKEN, chatId);
        break;
      case "/help":
        await handleHelp(BOT_TOKEN, chatId);
        break;
      case "/status": {
        const db = getServiceClient();
        const userId = await getUserForChat(db, chatId);
        if (userId) {
          await sendMessage(BOT_TOKEN, chatId, `✅ <b>Connected</b>\n\nYour Telegram is linked to Aivants.\nChat ID: <code>${chatId}</code>`);
        } else {
          await sendMessage(BOT_TOKEN, chatId, `❌ <b>Not Connected</b>\n\nUse /start to get your Chat ID, then link in Aivants Settings.`);
        }
        break;
      }
      default: {
        // ALL other messages go through AI conversation
        const db = getServiceClient();
        const userId = await getUserForChat(db, chatId);

        if (!userId) {
          await sendMessage(BOT_TOKEN, chatId,
            `❌ Account not linked yet.\n\nUse /start to get your Chat ID, then link it in Aivants → Settings.`
          );
          break;
        }

        await handleAIConversation(BOT_TOKEN, chatId, text, db, userId);
        break;
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Telegram bot error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
