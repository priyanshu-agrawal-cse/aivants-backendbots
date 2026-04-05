import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, Globe, Linkedin, Mail, UserPlus, Bot, Wifi, Server, CheckCircle } from "lucide-react";

const fmt = (v: number) => `₹${v.toLocaleString("en-IN")}`;

// Smart Lead Prioritization
export function HighValueLeads({ leads }: { leads: any[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Flame className="h-4 w-4 text-destructive" /> High Value Leads
        </CardTitle>
      </CardHeader>
      <CardContent>
        {leads.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No high-value leads detected</p>
        ) : (
          <div className="space-y-2">
            {leads.map(l => (
              <div key={l.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {l.title ? `${l.title} — ` : ""}{l.first_name} {l.last_name || ""}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{l.company_name || l.email}</p>
                </div>
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 text-[10px] shrink-0">
                  Score: {l.score || 0}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Lead Sources
const sourceIcons: Record<string, any> = {
  website: Globe,
  linkedin: Linkedin,
  email: Mail,
  manual: UserPlus,
};

export function LeadSources({ sources }: { sources: { name: string; count: number }[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Lead Sources</CardTitle>
      </CardHeader>
      <CardContent>
        {sources.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No lead data</p>
        ) : (
          <div className="space-y-2">
            {sources.slice(0, 5).map(s => {
              const Icon = sourceIcons[s.name.toLowerCase()] || UserPlus;
              return (
                <div key={s.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm capitalize">{s.name}</span>
                  </div>
                  <span className="text-sm font-semibold">{s.count}</span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Automation Monitor
export function AutomationMonitor({ data }: { data: { activeCampaigns: number; scheduledFollowups: number; activeSequences: number } }) {
  const items = [
    { label: "Campaigns Running", value: data.activeCampaigns },
    { label: "Follow-Ups Scheduled", value: data.scheduledFollowups },
    { label: "Automations Active", value: data.activeSequences },
  ];
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" /> Automation Monitor
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map(i => (
            <div key={i.label} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{i.label}</span>
              <span className="text-sm font-bold">{i.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// System Health
export function SystemHealth() {
  const systems = [
    { label: "Email Server", status: "online" },
    { label: "AI Automation", status: "running" },
    { label: "CRM Sync", status: "healthy" },
  ];
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Server className="h-4 w-4 text-muted-foreground" /> System Health
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {systems.map(s => (
            <div key={s.label} className="flex items-center justify-between">
              <span className="text-sm">{s.label}</span>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-success" />
                <span className="text-xs text-success capitalize">{s.status}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Revenue Prediction
export function RevenuePrediction({ current, nextMonth, sixMonths, conversionRate }: {
  current: number; nextMonth: number; sixMonths: number; conversionRate: number;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">AI Revenue Prediction</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Current Monthly</span>
            <span className="text-sm font-bold">{fmt(current)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Projected Next Month</span>
            <span className="text-sm font-bold text-success">{fmt(nextMonth)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Projected 6 Months</span>
            <span className="text-sm font-bold text-primary">{fmt(sixMonths)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Conversion Rate</span>
            <span className="text-sm font-bold">{conversionRate.toFixed(1)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
