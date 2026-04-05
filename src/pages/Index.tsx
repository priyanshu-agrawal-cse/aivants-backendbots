import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCommandCenterData } from "@/hooks/useCommandCenterData";
import { KPICard, KPISection } from "@/components/command-center/KPIGrid";
import { QuickActions } from "@/components/command-center/QuickActions";
import { ActivityTimeline } from "@/components/command-center/ActivityTimeline";
import { DealPipelineVisual } from "@/components/command-center/DealPipelineVisual";
import { ClientHealthTable } from "@/components/command-center/ClientHealthTable";
import { FinancialHealth } from "@/components/command-center/FinancialHealth";
import { AIOpportunityScanner, AIAssistant } from "@/components/command-center/AIInsights";
import {
  HighValueLeads, LeadSources, AutomationMonitor, SystemHealth, RevenuePrediction,
} from "@/components/command-center/SmallWidgets";
import {
  Users, Mail, MessageSquare, CalendarCheck, Briefcase, FolderKanban,
  IndianRupee, CreditCard, Wallet, UsersRound, Clock, Megaphone, Eye, Reply, Loader2,
} from "lucide-react";

const fmt = (v: number) => `₹${v.toLocaleString("en-IN")}`;

export default function Index() {
  const { user } = useAuth();
  const data = useCommandCenterData();
  const firstName = user?.user_metadata?.first_name || user?.email?.split("@")[0] || "there";

  const businessContext = useMemo(() => {
    const lo = data.leadsOverview;
    const co = data.clientsOverview;
    const rs = data.revenueSnapshot;
    const oe = data.outreachEngine;
    const fh = data.financialHealth;
    const dp = data.dealPipeline;
    return `Business Summary:
Leads: ${lo.totalLeads} total, ${lo.newLeads} new, ${lo.leadsToday} today
Emails: ${lo.emailsSent} sent, ${lo.replies} replies, ${lo.meetingsBooked} meetings booked
Clients: ${co.activeClients} active, ${co.activeProjects} projects running
Revenue this month: ₹${rs.monthlyRevenue}, Costs: ₹${rs.costs}, Profit: ₹${rs.profit}
Outreach: ${oe.totalSent} emails, ${oe.openRate.toFixed(0)}% open rate, ${oe.replyRate.toFixed(0)}% reply rate
Pipeline: ${dp.map(s => `${s.stage}: ${s.count}`).join(", ")}
Total revenue all-time: ₹${fh.totalRevenue}, expenses: ₹${fh.totalExpenses}
Client health issues: ${data.clientHealth.filter(c => c.healthScore !== "good").length} clients need attention
High value leads: ${data.highValueLeads.length}`;
  }, [data]);

  if (data.loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-8 max-w-[1400px] mx-auto w-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome back, {firstName}
        </p>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Leads Overview */}
      <KPISection title="Leads">
        <KPICard label="Today" value={data.leadsOverview.leadsToday} icon={Users} color="text-primary" />
        <KPICard label="New Leads" value={data.leadsOverview.newLeads} icon={Users} color="text-success" />
        <KPICard label="Emails Sent" value={data.leadsOverview.emailsSent} icon={Mail} color="text-primary" />
        <KPICard label="Replies" value={data.leadsOverview.replies} icon={MessageSquare} color="text-success" />
        <KPICard label="Meetings" value={data.leadsOverview.meetingsBooked} icon={CalendarCheck} color="text-primary" />
      </KPISection>

      {/* Clients */}
      <KPISection title="Clients">
        <KPICard label="Active" value={data.clientsOverview.activeClients} icon={Briefcase} color="text-primary" />
        <KPICard label="Projects" value={data.clientsOverview.activeProjects} icon={FolderKanban} color="text-primary" />
        <KPICard label="Pending Payments" value={data.clientsOverview.pendingPayments} icon={CreditCard} color="text-warning" />
      </KPISection>

      {/* Revenue */}
      <KPISection title="Revenue">
        <KPICard label="Monthly" value={fmt(data.revenueSnapshot.monthlyRevenue)} icon={IndianRupee} color="text-success" />
        <KPICard label="Retainers" value={fmt(data.revenueSnapshot.retainers)} icon={IndianRupee} color="text-primary" />
        <KPICard label="Pending" value={fmt(data.revenueSnapshot.pendingPayments)} icon={CreditCard} color="text-warning" />
        <KPICard label="Net Profit" value={fmt(data.revenueSnapshot.profit)} icon={Wallet} color={data.revenueSnapshot.profit >= 0 ? "text-success" : "text-destructive"} />
      </KPISection>

      {/* Team & Outreach */}
      <div className="grid gap-6 sm:gap-8 grid-cols-1 lg:grid-cols-2">
        <KPISection title="Team">
          <KPICard label="Active" value={data.teamActivity.activeMembers} icon={UsersRound} color="text-primary" subtext={`of ${data.teamActivity.totalMembers}`} />
          <KPICard label="Deadlines" value={data.teamActivity.projectsNearDeadline} icon={Clock} color="text-warning" />
        </KPISection>
        <KPISection title="Outreach">
          <KPICard label="Campaigns" value={data.outreachEngine.activeCampaigns} icon={Megaphone} color="text-primary" subtext={`of ${data.outreachEngine.totalCampaigns}`} />
          <KPICard label="Open Rate" value={`${data.outreachEngine.openRate.toFixed(0)}%`} icon={Eye} color="text-success" />
        </KPISection>
      </div>

      {/* Pipeline + Activity + Client Health */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <DealPipelineVisual stages={data.dealPipeline} />
        <ActivityTimeline items={data.activityTimeline} />
        <ClientHealthTable clients={data.clientHealth} />
      </div>

      {/* AI Insights */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <AIOpportunityScanner businessContext={businessContext} />
        <AIAssistant businessContext={businessContext} />
      </div>

      {/* Financial */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <RevenuePrediction
          current={data.revenueProjection.current}
          nextMonth={data.revenueProjection.nextMonth}
          sixMonths={data.revenueProjection.sixMonths}
          conversionRate={data.revenueProjection.conversionRate}
        />
        <FinancialHealth {...data.financialHealth} />
        <HighValueLeads leads={data.highValueLeads} />
      </div>

      {/* System */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <LeadSources sources={data.leadSources} />
        <AutomationMonitor data={data.automationMonitor} />
        <SystemHealth />
      </div>
    </div>
  );
}
