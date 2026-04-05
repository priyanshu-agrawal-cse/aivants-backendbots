import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Tool definitions for the AI agent
const tools = [
  {
    type: "function",
    function: {
      name: "get_leads",
      description: "Get leads with optional filters. Use for queries about leads, prospects, contacts.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "Filter by status: new, contacted, qualified, converted, lost" },
          limit: { type: "number", description: "Max results (default 20)" },
          order_by: { type: "string", enum: ["created_at", "score", "rating"], description: "Sort field" },
          order_dir: { type: "string", enum: ["asc", "desc"], description: "Sort direction" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_high_value_leads",
      description: "Get leads sorted by score/rating. Use for 'best leads', 'top leads', 'priority leads'.",
      parameters: { type: "object", properties: { limit: { type: "number" } } },
    },
  },
  {
    type: "function",
    function: {
      name: "get_leads_by_industry",
      description: "Get leads filtered by industry",
      parameters: { type: "object", properties: { industry: { type: "string" } }, required: ["industry"] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_clients",
      description: "Get clients with optional status filter",
      parameters: { type: "object", properties: { status: { type: "string" } } },
    },
  },
  {
    type: "function",
    function: {
      name: "get_pending_payments",
      description: "Get clients/revenue entries with pending payments",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_client_projects",
      description: "Get projects for a specific client",
      parameters: { type: "object", properties: { client_name: { type: "string" } }, required: ["client_name"] },
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
      description: "Get projects with deadlines in the next 7 days",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_monthly_revenue",
      description: "Get revenue data for current month or specified month",
      parameters: { type: "object", properties: { month: { type: "string", description: "YYYY-MM format" } } },
    },
  },
  {
    type: "function",
    function: {
      name: "get_revenue_summary",
      description: "Get full revenue breakdown: income, expenses, profit, cost breakdown",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_client_lifetime_value",
      description: "Get lifetime value for all or a specific client",
      parameters: { type: "object", properties: { client_name: { type: "string" } } },
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
      description: "Get email sending statistics: sent, opened, replied, bounced",
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
      description: "Get team members and their roles",
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
      name: "search_knowledge_base",
      description: "Search the AI knowledge base for internal company docs, processes, notes",
      parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_followups",
      description: "Get follow-up status and schedules",
      parameters: { type: "object", properties: { status: { type: "string" } } },
    },
  },
  // NEW TOOLS - Write operations
  {
    type: "function",
    function: {
      name: "create_lead",
      description: "Create a new lead in the system",
      parameters: {
        type: "object",
        properties: {
          first_name: { type: "string" },
          last_name: { type: "string" },
          email: { type: "string" },
          company_name: { type: "string" },
          phone: { type: "string" },
          industry: { type: "string" },
          source: { type: "string" },
          notes: { type: "string" },
        },
        required: ["first_name", "email"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_client",
      description: "Create a new client record",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          email: { type: "string" },
          company: { type: "string" },
          phone: { type: "string" },
          industry: { type: "string" },
          monthly_payment: { type: "number" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_project",
      description: "Create a new project",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          client_name: { type: "string", description: "Name of existing client to link" },
          deadline: { type: "string", description: "YYYY-MM-DD format" },
          status: { type: "string", enum: ["planning", "in_progress", "review", "completed"] },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_followup",
      description: "Create a follow-up reminder for a lead or client",
      parameters: {
        type: "object",
        properties: {
          lead_name: { type: "string", description: "Name of lead to follow up with" },
          purpose: { type: "string" },
          days_from_now: { type: "number", description: "Number of days from today" },
          notes: { type: "string" },
        },
        required: ["lead_name", "days_from_now"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_lead_status",
      description: "Update a lead's status",
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
      name: "add_revenue_entry",
      description: "Add a revenue or expense entry",
      parameters: {
        type: "object",
        properties: {
          amount: { type: "number" },
          type: { type: "string", enum: ["payment", "expense", "refund"] },
          description: { type: "string" },
          category: { type: "string" },
          client_name: { type: "string", description: "Optional client name to link" },
        },
        required: ["amount", "description"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_system_logs",
      description: "Get recent system activity logs",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string", description: "Filter by category: automation, email, ai, system" },
          limit: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_ai_memory",
      description: "Recall stored information from AI memory",
      parameters: {
        type: "object",
        properties: {
          memory_type: { type: "string", description: "Type: context, preference, fact" },
          key: { type: "string", description: "Optional specific key to look up" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "save_ai_memory",
      description: "Store a piece of information in AI memory for future reference. Use when user says 'remember this' or shares important facts.",
      parameters: {
        type: "object",
        properties: {
          key: { type: "string", description: "Short identifier for the memory" },
          value: { type: "string", description: "The information to remember" },
          memory_type: { type: "string", enum: ["context", "preference", "fact"], description: "Type of memory" },
        },
        required: ["key", "value"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_automation_status",
      description: "Get status of automation jobs and scheduled tasks",
      parameters: { type: "object", properties: { status: { type: "string" } } },
    },
  },
];

// Execute a tool call against the database
async function executeTool(supabase: any, userId: string, name: string, args: any): Promise<any> {
  switch (name) {
    // READ TOOLS (existing)
    case "get_leads": {
      let q = supabase.from("leads").select("id,first_name,last_name,email,company_name,status,score,rating,industry,source,created_at").eq("user_id", userId);
      if (args.status) q = q.eq("status", args.status);
      q = q.order(args.order_by || "created_at", { ascending: args.order_dir === "asc" });
      q = q.limit(args.limit || 20);
      const { data, error } = await q;
      if (error) return { error: error.message };
      return { leads: data, count: data?.length };
    }
    case "get_high_value_leads": {
      const { data } = await supabase.from("leads").select("id,first_name,last_name,email,company_name,status,score,rating,industry,source").eq("user_id", userId).order("score", { ascending: false }).limit(args.limit || 10);
      return { leads: data, count: data?.length };
    }
    case "get_leads_by_industry": {
      const { data } = await supabase.from("leads").select("id,first_name,last_name,email,company_name,status,score,industry").eq("user_id", userId).ilike("industry", `%${args.industry}%`).limit(50);
      return { leads: data, count: data?.length };
    }
    case "get_clients": {
      let q = supabase.from("clients").select("*").eq("user_id", userId);
      if (args.status) q = q.eq("status", args.status);
      const { data } = await q.limit(50);
      return { clients: data, count: data?.length };
    }
    case "get_pending_payments": {
      const { data: clients } = await supabase.from("clients").select("id,name,company,monthly_payment,status").eq("user_id", userId);
      const { data: revenue } = await supabase.from("revenue_entries").select("*").eq("user_id", userId).eq("type", "payment").gte("date", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]);
      const paidIds = new Set((revenue || []).map((r: any) => r.client_id));
      const pending = (clients || []).filter((c: any) => c.monthly_payment > 0 && !paidIds.has(c.id));
      return { pending_payments: pending, count: pending.length };
    }
    case "get_client_projects": {
      const { data: clients } = await supabase.from("clients").select("id").eq("user_id", userId).ilike("name", `%${args.client_name}%`);
      if (!clients?.length) return { projects: [], message: "Client not found" };
      const { data } = await supabase.from("projects").select("*").in("client_id", clients.map((c: any) => c.id));
      return { projects: data, count: data?.length };
    }
    case "get_projects": {
      let q = supabase.from("projects").select("id,name,status,deadline,start_date,client_id,description").eq("user_id", userId);
      if (args.status) q = q.eq("status", args.status);
      const { data } = await q.limit(50);
      return { projects: data, count: data?.length };
    }
    case "get_projects_near_deadline": {
      const nextWeek = new Date(); nextWeek.setDate(nextWeek.getDate() + 7);
      const { data } = await supabase.from("projects").select("id,name,status,deadline,client_id").eq("user_id", userId).not("deadline", "is", null).lte("deadline", nextWeek.toISOString().split("T")[0]).neq("status", "completed");
      return { projects: data, count: data?.length };
    }
    case "get_monthly_revenue": {
      const now = new Date();
      const month = args.month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const { data } = await supabase.from("revenue_entries").select("*").eq("user_id", userId).gte("date", `${month}-01`).lte("date", `${month}-31`);
      const income = (data || []).filter((e: any) => e.type !== "expense").reduce((s: number, e: any) => s + Number(e.amount), 0);
      const expenses = (data || []).filter((e: any) => e.type === "expense").reduce((s: number, e: any) => s + Number(e.amount), 0);
      return { month, income, expenses, profit: income - expenses, entries_count: data?.length };
    }
    case "get_revenue_summary": {
      const { data } = await supabase.from("revenue_entries").select("*").eq("user_id", userId);
      const income = (data || []).filter((e: any) => e.type !== "expense").reduce((s: number, e: any) => s + Number(e.amount), 0);
      const expenses = (data || []).filter((e: any) => e.type === "expense").reduce((s: number, e: any) => s + Number(e.amount), 0);
      const byCategory: Record<string, number> = {};
      (data || []).forEach((e: any) => { byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount); });
      return { total_income: income, total_expenses: expenses, profit: income - expenses, by_category: byCategory };
    }
    case "get_client_lifetime_value": {
      const { data: clients } = await supabase.from("clients").select("id,name,company,monthly_payment,contract_start").eq("user_id", userId);
      if (args.client_name) {
        const match = (clients || []).filter((c: any) => c.name.toLowerCase().includes(args.client_name.toLowerCase()));
        if (!match.length) return { message: "Client not found" };
        const { data: rev } = await supabase.from("revenue_entries").select("amount").eq("user_id", userId).in("client_id", match.map((c: any) => c.id));
        return { client: match[0], lifetime_value: (rev || []).reduce((s: number, e: any) => s + Number(e.amount), 0) };
      }
      const results = [];
      for (const c of (clients || []).slice(0, 20)) {
        const { data: rev } = await supabase.from("revenue_entries").select("amount").eq("client_id", c.id);
        results.push({ name: c.name, company: c.company, monthly: c.monthly_payment, ltv: (rev || []).reduce((s: number, e: any) => s + Number(e.amount), 0) });
      }
      return { clients: results.sort((a, b) => b.ltv - a.ltv) };
    }
    case "get_campaigns": {
      let q = supabase.from("campaigns").select("id,name,status,subject,created_at").eq("user_id", userId);
      if (args.status) q = q.eq("status", args.status);
      const { data } = await q.limit(20);
      return { campaigns: data, count: data?.length };
    }
    case "get_email_stats": {
      const { data } = await supabase.from("email_logs").select("status,opened_at,replied_at,bounced").eq("user_id", userId);
      const total = data?.length || 0;
      const opened = (data || []).filter((e: any) => e.opened_at).length;
      const replied = (data || []).filter((e: any) => e.replied_at).length;
      const bounced = (data || []).filter((e: any) => e.bounced).length;
      return { total_sent: total, opened, replied, bounced, open_rate: total ? ((opened / total) * 100).toFixed(1) + "%" : "0%", reply_rate: total ? ((replied / total) * 100).toFixed(1) + "%" : "0%" };
    }
    case "get_pipeline": {
      const { data } = await supabase.from("pipeline_stages").select("stage,deal_value,meeting_booked,client_won,lead_id").eq("user_id", userId);
      const stages: Record<string, { count: number; value: number }> = {};
      (data || []).forEach((p: any) => {
        if (!stages[p.stage]) stages[p.stage] = { count: 0, value: 0 };
        stages[p.stage].count++;
        stages[p.stage].value += Number(p.deal_value || 0);
      });
      return { pipeline: stages, total_deals: data?.length };
    }
    case "get_team_members": {
      const { data } = await supabase.from("team_members").select("*").eq("user_id", userId);
      return { team: data, active: (data || []).filter((m: any) => m.is_active).length, total: data?.length };
    }
    case "get_proposals": {
      let q = supabase.from("proposals").select("id,name,status,amount,client_name,industry,created_at").eq("user_id", userId);
      if (args.status) q = q.eq("status", args.status);
      const { data } = await q.limit(20);
      return { proposals: data, count: data?.length };
    }
    case "search_knowledge_base": {
      const { data } = await supabase.from("ai_knowledge_base").select("title,content,category").eq("user_id", userId).or(`title.ilike.%${args.query}%,content.ilike.%${args.query}%,category.ilike.%${args.query}%`);
      return { results: data, count: data?.length };
    }
    case "get_followups": {
      let q = supabase.from("followup_status").select("id,client_name,client_company,status,next_followup_date,purpose,category,followup_type").eq("user_id", userId);
      if (args.status) q = q.eq("status", args.status);
      const { data } = await q.limit(30);
      return { followups: data, count: data?.length };
    }

    // NEW WRITE TOOLS
    case "create_lead": {
      const { data, error } = await supabase.from("leads").insert({
        user_id: userId,
        first_name: args.first_name,
        last_name: args.last_name || null,
        email: args.email,
        company_name: args.company_name || null,
        phone: args.phone || null,
        industry: args.industry || null,
        source: args.source || "ai_assistant",
        notes: args.notes || null,
        status: "new",
      }).select("id,first_name,last_name,email,company_name").single();
      if (error) return { error: error.message };
      await logAction(supabase, userId, "lead_created", "ai", { lead_id: data.id });
      return { success: true, lead: data };
    }
    case "create_client": {
      const { data, error } = await supabase.from("clients").insert({
        user_id: userId,
        name: args.name,
        email: args.email || null,
        company: args.company || null,
        phone: args.phone || null,
        industry: args.industry || null,
        monthly_payment: args.monthly_payment || 0,
      }).select("id,name,email,company").single();
      if (error) return { error: error.message };
      await logAction(supabase, userId, "client_created", "ai", { client_id: data.id });
      return { success: true, client: data };
    }
    case "create_project": {
      let clientId = null;
      if (args.client_name) {
        const { data: clients } = await supabase.from("clients").select("id").eq("user_id", userId).ilike("name", `%${args.client_name}%`).limit(1);
        clientId = clients?.[0]?.id || null;
      }
      const { data, error } = await supabase.from("projects").insert({
        user_id: userId,
        name: args.name,
        description: args.description || "",
        client_id: clientId,
        deadline: args.deadline || null,
        status: args.status || "planning",
      }).select("id,name,status,deadline").single();
      if (error) return { error: error.message };
      await logAction(supabase, userId, "project_created", "ai", { project_id: data.id });
      return { success: true, project: data };
    }
    case "create_followup": {
      const { data: leads } = await supabase.from("leads").select("id,first_name,email,company_name").eq("user_id", userId).ilike("first_name", `%${args.lead_name}%`).limit(1);
      if (!leads?.length) return { error: "Lead not found" };
      const lead = leads[0];

      // Get or create a default sequence
      let { data: seq } = await supabase.from("followup_sequences").select("id").eq("user_id", userId).eq("name", "AI Created Sequence").limit(1).single();
      if (!seq) {
        const { data: newSeq } = await supabase.from("followup_sequences").insert({ user_id: userId, name: "AI Created Sequence", is_active: true }).select("id").single();
        seq = newSeq;
      }
      if (!seq) return { error: "Could not create sequence" };

      const nextDate = new Date(Date.now() + (args.days_from_now || 7) * 86400000).toISOString();
      const { data, error } = await supabase.from("followup_status").insert({
        user_id: userId,
        lead_id: lead.id,
        sequence_id: seq.id,
        status: "active",
        next_followup_date: nextDate,
        purpose: args.purpose || "Follow up",
        notes: args.notes || "",
        client_name: lead.first_name,
        client_email: lead.email,
        client_company: lead.company_name || "",
      }).select("id,client_name,next_followup_date,purpose").single();
      if (error) return { error: error.message };
      await logAction(supabase, userId, "followup_created", "ai", { followup_id: data.id });
      return { success: true, followup: data };
    }
    case "update_lead_status": {
      const { data: leads } = await supabase.from("leads").select("id,first_name").eq("user_id", userId).ilike("first_name", `%${args.lead_name}%`).limit(1);
      if (!leads?.length) return { error: "Lead not found" };
      const { error } = await supabase.from("leads").update({ status: args.status, updated_at: new Date().toISOString() }).eq("id", leads[0].id);
      if (error) return { error: error.message };
      await logAction(supabase, userId, "lead_status_updated", "ai", { lead_id: leads[0].id, new_status: args.status });
      return { success: true, message: `${leads[0].first_name}'s status updated to ${args.status}` };
    }
    case "add_revenue_entry": {
      let clientId = null;
      if (args.client_name) {
        const { data: clients } = await supabase.from("clients").select("id").eq("user_id", userId).ilike("name", `%${args.client_name}%`).limit(1);
        clientId = clients?.[0]?.id || null;
      }
      const { data, error } = await supabase.from("revenue_entries").insert({
        user_id: userId,
        amount: args.amount,
        type: args.type || "payment",
        description: args.description,
        category: args.category || "client_payment",
        client_id: clientId,
      }).select("id,amount,type,description").single();
      if (error) return { error: error.message };
      await logAction(supabase, userId, "revenue_entry_added", "ai", { entry_id: data.id });
      return { success: true, entry: data };
    }
    case "get_system_logs": {
      let q = supabase.from("system_logs").select("action,category,details,status,error_message,created_at").eq("user_id", userId);
      if (args.category) q = q.eq("category", args.category);
      const { data } = await q.order("created_at", { ascending: false }).limit(args.limit || 20);
      return { logs: data, count: data?.length };
    }
    case "get_ai_memory": {
      let q = supabase.from("ai_memory").select("key,value,memory_type,metadata,updated_at").eq("user_id", userId);
      if (args.memory_type) q = q.eq("memory_type", args.memory_type);
      if (args.key) q = q.eq("key", args.key);
      const { data } = await q.order("updated_at", { ascending: false }).limit(50);
      return { memories: data, count: data?.length };
    }
    case "save_ai_memory": {
      const { data, error } = await supabase.from("ai_memory").upsert({
        user_id: userId,
        key: args.key,
        value: args.value,
        memory_type: args.memory_type || "context",
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,memory_type,key" }).select("key,value").single();
      if (error) return { error: error.message };
      return { success: true, memory: data };
    }
    case "get_automation_status": {
      let q = supabase.from("automation_jobs").select("id,job_type,status,payload,result,error_message,scheduled_for,completed_at").eq("user_id", userId);
      if (args.status) q = q.eq("status", args.status);
      const { data } = await q.order("created_at", { ascending: false }).limit(20);
      return { jobs: data, count: data?.length };
    }
    default:
      return { error: "Unknown tool" };
  }
}

async function logAction(supabase: any, userId: string, action: string, category: string, details: any) {
  try {
    await supabase.from("system_logs").insert({ user_id: userId, action, category, details });
  } catch (e) { console.error("Log failed:", e); }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI not configured");

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader || "" } },
    });
    
    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, conversation_id, page_context } = await req.json();

    // Load user's AI settings
    const { data: aiSettings } = await supabaseAdmin.from("ai_settings").select("*").eq("user_id", user.id).maybeSingle();
    const model = aiSettings?.model_name || "google/gemini-3-flash-preview";
    const temperature = Number(aiSettings?.temperature) || 0.7;
    const maxTokens = aiSettings?.max_tokens || 4096;

    // Load persistent AI memories for context
    const { data: memories } = await supabaseAdmin.from("ai_memory").select("key,value,memory_type").eq("user_id", user.id).limit(50);
    const memoryContext = memories?.length
      ? `\n\nSTORED MEMORIES:\n${memories.map((m: any) => `[${m.memory_type}] ${m.key}: ${m.value}`).join("\n")}`
      : "";

    // Build system prompt
    const systemPrompt = `You are the Aivants AI Command Assistant — an intelligent business operator for a digital agency. You have access to tools that query and modify real business data.

RULES:
- Always use tools to get data before answering data questions. Never make up numbers.
- Use ₹ (INR) for all currency.
- Be concise but actionable. Use bullet points and formatting.
- For destructive actions (delete, remove), ALWAYS ask for confirmation first.
- When showing data, format it as clean markdown tables or lists.
- You can create leads, clients, projects, follow-ups, and revenue entries.
- When the user asks you to "remember" something, use the save_ai_memory tool.
- You can check system logs and automation job status.
- You can analyze patterns and give recommendations.
${page_context ? `\nCurrent page context: ${page_context}` : ""}
${memoryContext}

Today's date: ${new Date().toISOString().split("T")[0]}`;

    // Determine API endpoint
    let apiUrl = "https://ai.gateway.lovable.dev/v1/chat/completions";
    let apiKey = LOVABLE_API_KEY;
    
    if (aiSettings?.api_key && aiSettings?.provider) {
      switch (aiSettings.provider) {
        case "openai": apiUrl = "https://api.openai.com/v1/chat/completions"; apiKey = aiSettings.api_key; break;
        case "anthropic": apiUrl = "https://api.anthropic.com/v1/messages"; apiKey = aiSettings.api_key; break;
        case "groq": apiUrl = "https://api.groq.com/openai/v1/chat/completions"; apiKey = aiSettings.api_key; break;
      }
    }

    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: any) => ({ role: m.role, content: m.content })),
    ];

    const firstResponse = await fetch(apiUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages: aiMessages, tools, temperature, max_tokens: maxTokens }),
    });

    if (!firstResponse.ok) {
      const status = firstResponse.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded, try again shortly" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const errText = await firstResponse.text();
      console.error("AI error:", status, errText);
      throw new Error("AI gateway error");
    }

    let aiData = await firstResponse.json();
    let assistantMessage = aiData.choices?.[0]?.message;

    // Process tool calls in a loop (up to 5 iterations)
    let iterations = 0;
    while (assistantMessage?.tool_calls && iterations < 5) {
      iterations++;
      const toolResults: any[] = [];

      for (const tc of assistantMessage.tool_calls) {
        const args = JSON.parse(tc.function.arguments || "{}");
        console.log(`Executing tool: ${tc.function.name}`, args);
        const result = await executeTool(supabaseAdmin, user.id, tc.function.name, args);
        toolResults.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify(result) });
      }

      const nextMessages = [...aiMessages, assistantMessage, ...toolResults];
      const nextResponse = await fetch(apiUrl, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages: nextMessages, tools, temperature, max_tokens: maxTokens }),
      });

      if (!nextResponse.ok) throw new Error("AI follow-up error");
      aiData = await nextResponse.json();
      assistantMessage = aiData.choices?.[0]?.message;
    }

    const answer = assistantMessage?.content || "I couldn't generate a response.";

    // Log the AI interaction
    await logAction(supabaseAdmin, user.id, "ai_chat", "ai", {
      tools_used: assistantMessage?.tool_calls?.map((tc: any) => tc.function.name) || [],
      model,
    });

    // Save messages to conversation if conversation_id provided
    if (conversation_id) {
      const userMsg = messages[messages.length - 1];
      await supabaseAdmin.from("chat_messages").insert([
        { conversation_id, role: "user", content: userMsg.content },
        { conversation_id, role: "assistant", content: answer, tool_calls: assistantMessage?.tool_calls || null },
      ]);
      await supabaseAdmin.from("chat_conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversation_id);
    }

    return new Response(JSON.stringify({ answer, tool_calls: assistantMessage?.tool_calls }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
