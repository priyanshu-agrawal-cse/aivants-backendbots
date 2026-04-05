import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { startOfMonth, endOfMonth, startOfDay, endOfDay, subMonths, parseISO, isWithinInterval, format, differenceInDays } from "date-fns";

export type ClientHealth = {
  id: string;
  name: string;
  company: string | null;
  status: string;
  lastContact: number | null; // days ago
  paymentStatus: "up_to_date" | "pending" | "overdue";
  healthScore: "good" | "warning" | "critical";
  monthlyPayment: number;
  lifetimeValue: number;
};

export type PipelineStage = {
  stage: string;
  count: number;
  value: number;
};

export type ActivityItem = {
  id: string;
  time: string;
  description: string;
  type: "lead" | "email" | "meeting" | "proposal" | "client" | "project";
};

export function useCommandCenterData() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [revenueEntries, setRevenueEntries] = useState<any[]>([]);
  const [pipelineStages, setPipelineStages] = useState<any[]>([]);
  const [followupStatus, setFollowupStatus] = useState<any[]>([]);
  const [followupSequences, setFollowupSequences] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);

  useEffect(() => {
    if (user) fetchAll();
  }, [user]);

  async function fetchAll() {
    setLoading(true);
    const [
      leadsRes, clientsRes, emailRes, campaignRes, projectRes,
      teamRes, revenueRes, pipelineRes, followupRes, sequenceRes, proposalRes
    ] = await Promise.all([
      supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("clients").select("*"),
      supabase.from("email_logs").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("campaigns").select("*"),
      supabase.from("projects").select("*"),
      supabase.from("team_members").select("*"),
      supabase.from("revenue_entries").select("*").order("date", { ascending: false }),
      supabase.from("pipeline_stages").select("*"),
      supabase.from("followup_status").select("*"),
      supabase.from("followup_sequences").select("*"),
      supabase.from("proposals").select("*"),
    ]);

    if (leadsRes.data) setLeads(leadsRes.data);
    if (clientsRes.data) setClients(clientsRes.data);
    if (emailRes.data) setEmailLogs(emailRes.data);
    if (campaignRes.data) setCampaigns(campaignRes.data);
    if (projectRes.data) setProjects(projectRes.data);
    if (teamRes.data) setTeamMembers(teamRes.data);
    if (revenueRes.data) setRevenueEntries(revenueRes.data);
    if (pipelineRes.data) setPipelineStages(pipelineRes.data);
    if (followupRes.data) setFollowupStatus(followupRes.data);
    if (sequenceRes.data) setFollowupSequences(sequenceRes.data);
    if (proposalRes.data) setProposals(proposalRes.data);
    setLoading(false);
  }

  const now = new Date();
  const today = { start: startOfDay(now), end: endOfDay(now) };
  const thisMonth = { start: startOfMonth(now), end: endOfMonth(now) };

  // Section 1 — Leads Overview
  const leadsOverview = useMemo(() => {
    const leadsToday = leads.filter(l => {
      try { return isWithinInterval(parseISO(l.created_at), today); } catch { return false; }
    }).length;
    const newLeads = leads.filter(l => l.status === "new").length;
    const emailsSent = emailLogs.length;
    const replies = emailLogs.filter(e => e.replied_at).length;
    const meetingsBooked = pipelineStages.filter(p => p.meeting_booked).length;
    return { leadsToday, newLeads, emailsSent, replies, meetingsBooked, totalLeads: leads.length };
  }, [leads, emailLogs, pipelineStages]);

  // Section 2 — Clients
  const clientsOverview = useMemo(() => {
    const activeClients = clients.filter(c => c.status === "active").length;
    const activeProjects = projects.filter(p => p.status !== "completed" && p.status !== "cancelled").length;
    const pendingPayments = revenueEntries.filter(e =>
      e.type === "payment" && e.category === "client_payment"
    ).length;
    return { activeClients, activeProjects, pendingPayments, totalClients: clients.length };
  }, [clients, projects, revenueEntries]);

  // Section 3 — Revenue Snapshot
  const revenueSnapshot = useMemo(() => {
    const monthEntries = revenueEntries.filter(e => {
      try { return isWithinInterval(parseISO(e.date), thisMonth); } catch { return false; }
    });
    const revenue = monthEntries.filter(e => e.type === "payment").reduce((s, e) => s + Number(e.amount), 0);
    const costs = monthEntries.filter(e => e.type === "cost").reduce((s, e) => s + Number(e.amount), 0);
    const retainers = monthEntries.filter(e => e.category === "retainer").reduce((s, e) => s + Number(e.amount), 0);
    const pending = revenueEntries.filter(e => e.type === "payment" && e.is_recurring).reduce((s, e) => s + Number(e.amount), 0);
    return { monthlyRevenue: revenue, costs, retainers, pendingPayments: pending, profit: revenue - costs };
  }, [revenueEntries]);

  // Section 4 — Team Activity
  const teamActivity = useMemo(() => {
    const activeMembers = teamMembers.filter(t => t.is_active).length;
    const projectsNearDeadline = projects.filter(p => {
      if (!p.deadline) return false;
      try {
        const days = differenceInDays(parseISO(p.deadline), now);
        return days >= 0 && days <= 7;
      } catch { return false; }
    }).length;
    return { activeMembers, totalMembers: teamMembers.length, projectsNearDeadline };
  }, [teamMembers, projects]);

  // Section 5 — Outreach Engine
  const outreachEngine = useMemo(() => {
    const activeCampaigns = campaigns.filter(c => c.status === "active").length;
    const emailsToday = emailLogs.filter(e => {
      try { return isWithinInterval(parseISO(e.sent_at), today); } catch { return false; }
    }).length;
    const totalSent = emailLogs.length;
    const opened = emailLogs.filter(e => e.opened_at).length;
    const replied = emailLogs.filter(e => e.replied_at).length;
    const openRate = totalSent > 0 ? (opened / totalSent * 100) : 0;
    const replyRate = totalSent > 0 ? (replied / totalSent * 100) : 0;
    return { activeCampaigns, emailsToday, totalSent, openRate, replyRate, totalCampaigns: campaigns.length };
  }, [emailLogs, campaigns]);

  // Section 6 — Deal Pipeline
  const dealPipeline = useMemo(() => {
    const stages = ["prospect", "qualified", "proposal", "negotiation", "closed"];
    return stages.map(stage => ({
      stage,
      count: pipelineStages.filter(p => p.stage === stage).length,
      value: pipelineStages.filter(p => p.stage === stage).reduce((s, p) => s + Number(p.deal_value || 0), 0),
    }));
  }, [pipelineStages]);

  // Section 5b — Client Health
  const clientHealth = useMemo((): ClientHealth[] => {
    return clients.map(c => {
      const lastPayment = revenueEntries
        .filter(e => e.client_id === c.id && e.type === "payment")
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

      const daysSinceContact = c.updated_at
        ? differenceInDays(now, parseISO(c.updated_at))
        : null;

      const lifetimeValue = revenueEntries
        .filter(e => e.client_id === c.id && e.type === "payment")
        .reduce((s, e) => s + Number(e.amount), 0);

      let healthScore: "good" | "warning" | "critical" = "good";
      if (daysSinceContact && daysSinceContact > 30) healthScore = "critical";
      else if (daysSinceContact && daysSinceContact > 14) healthScore = "warning";

      return {
        id: c.id,
        name: c.name,
        company: c.company,
        status: c.status,
        lastContact: daysSinceContact,
        paymentStatus: lastPayment ? "up_to_date" : "pending",
        healthScore,
        monthlyPayment: Number(c.monthly_payment || 0),
        lifetimeValue,
      };
    });
  }, [clients, revenueEntries]);

  // Section — Activity Timeline (recent events from various tables)
  const activityTimeline = useMemo((): ActivityItem[] => {
    const items: ActivityItem[] = [];

    leads.slice(0, 10).forEach(l => {
      items.push({
        id: `lead-${l.id}`,
        time: l.created_at,
        description: `New lead added: ${l.first_name} ${l.last_name || ""}`.trim(),
        type: "lead",
      });
    });

    emailLogs.slice(0, 10).forEach(e => {
      if (e.replied_at) {
        items.push({
          id: `reply-${e.id}`,
          time: e.replied_at,
          description: "Email reply received",
          type: "email",
        });
      }
    });

    proposals.slice(0, 5).forEach(p => {
      items.push({
        id: `prop-${p.id}`,
        time: p.created_at,
        description: `Proposal created: ${p.name}`,
        type: "proposal",
      });
    });

    pipelineStages.filter(p => p.meeting_booked).slice(0, 5).forEach(p => {
      items.push({
        id: `meeting-${p.id}`,
        time: p.updated_at,
        description: "Meeting booked",
        type: "meeting",
      });
    });

    return items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 15);
  }, [leads, emailLogs, proposals, pipelineStages]);

  // Financial Health
  const financialHealth = useMemo(() => {
    const totalRevenue = revenueEntries.filter(e => e.type === "payment").reduce((s, e) => s + Number(e.amount), 0);
    const totalExpenses = revenueEntries.filter(e => e.type === "cost").reduce((s, e) => s + Number(e.amount), 0);
    const profit = totalRevenue - totalExpenses;
    const monthlyExpenses = revenueSnapshot.costs || 1;
    const cashRunway = monthlyExpenses > 0 ? Math.round(profit / monthlyExpenses) : 0;
    return { totalRevenue, totalExpenses, profit, cashRunway: Math.max(0, cashRunway) };
  }, [revenueEntries, revenueSnapshot]);

  // Automation Monitor
  const automationMonitor = useMemo(() => {
    const activeCampaigns = campaigns.filter(c => c.status === "active").length;
    const scheduledFollowups = followupStatus.filter(f => f.status === "active").length;
    const activeSequences = followupSequences.filter(s => s.is_active).length;
    return { activeCampaigns, scheduledFollowups, activeSequences };
  }, [campaigns, followupStatus, followupSequences]);

  // Lead Sources
  const leadSources = useMemo(() => {
    const sources: Record<string, number> = {};
    leads.forEach(l => {
      const src = l.source || "manual";
      sources[src] = (sources[src] || 0) + 1;
    });
    return Object.entries(sources).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [leads]);

  // Smart Lead Prioritization (high value leads)
  const highValueLeads = useMemo(() => {
    return leads
      .filter(l => (l.score || 0) >= 5 || (l.rating || 0) >= 4)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 5);
  }, [leads]);

  // Revenue projection
  const revenueProjection = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => subMonths(now, 5 - i));
    const monthlyRevs = months.map(m => {
      return revenueEntries.filter(e => {
        try {
          return e.type === "payment" && isWithinInterval(parseISO(e.date), { start: startOfMonth(m), end: endOfMonth(m) });
        } catch { return false; }
      }).reduce((s, e) => s + Number(e.amount), 0);
    });
    const current = monthlyRevs[monthlyRevs.length - 1] || 0;
    const avgGrowth = monthlyRevs.length > 1
      ? monthlyRevs.slice(1).reduce((s, v, i) => s + (v - monthlyRevs[i]), 0) / (monthlyRevs.length - 1)
      : 0;
    const conversionRate = leads.length > 0 ? (pipelineStages.filter(p => p.client_won).length / leads.length * 100) : 0;
    return {
      current,
      nextMonth: Math.max(0, current + avgGrowth),
      sixMonths: Math.max(0, current + avgGrowth * 6),
      conversionRate,
      monthlyTrend: months.map((m, i) => ({ month: format(m, "MMM"), revenue: monthlyRevs[i] })),
    };
  }, [revenueEntries, leads, pipelineStages]);

  return {
    loading,
    leadsOverview,
    clientsOverview,
    revenueSnapshot,
    teamActivity,
    outreachEngine,
    dealPipeline,
    clientHealth,
    activityTimeline,
    financialHealth,
    automationMonitor,
    leadSources,
    highValueLeads,
    revenueProjection,
    refetch: fetchAll,
  };
}
