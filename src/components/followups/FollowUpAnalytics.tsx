import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { Mail, Eye, MessageSquare, Target, TrendingUp, CalendarCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface AnalyticsData {
  totalSent: number;
  totalOpened: number;
  totalReplied: number;
  totalBounced: number;
  openRate: number;
  replyRate: number;
  bounceRate: number;
  // Follow-up specific
  totalFollowups: number;
  activeFollowups: number;
  completedFollowups: number;
  pausedFollowups: number;
  // By type breakdown
  typeBreakdown: { name: string; count: number }[];
  // Monthly trend
  monthlyTrend: { month: string; sent: number; opened: number; replied: number }[];
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--destructive))",
  "hsl(var(--accent-foreground))",
  "hsl(var(--muted-foreground))",
  "hsl(142 76% 36%)",
  "hsl(38 92% 50%)",
];

export function FollowUpAnalytics() {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchAnalytics = async () => {
      setLoading(true);

      const [emailRes, followupRes] = await Promise.all([
        supabase.from("email_logs").select("*").eq("user_id", user.id),
        supabase.from("followup_status").select("*").eq("user_id", user.id),
      ]);

      const emails = emailRes.data || [];
      const followups = followupRes.data || [];

      const totalSent = emails.length;
      const totalOpened = emails.filter(e => e.opened_at).length;
      const totalReplied = emails.filter(e => e.replied_at).length;
      const totalBounced = emails.filter(e => e.bounced).length;

      // Follow-up status counts
      const activeFollowups = followups.filter(f => f.status === "active").length;
      const completedFollowups = followups.filter(f => ["completed", "replied"].includes(f.status)).length;
      const pausedFollowups = followups.filter(f => f.status === "paused").length;

      // Type breakdown
      const typeCounts: Record<string, number> = {};
      followups.forEach(f => {
        const t = (f.followup_type || "sales").replace(/_/g, " ");
        typeCounts[t] = (typeCounts[t] || 0) + 1;
      });
      const typeBreakdown = Object.entries(typeCounts).map(([name, count]) => ({ name, count }));

      // Monthly trend (last 6 months)
      const monthlyMap: Record<string, { sent: number; opened: number; replied: number }> = {};
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleString("default", { month: "short", year: "2-digit" });
        monthlyMap[key] = { sent: 0, opened: 0, replied: 0 };
      }
      emails.forEach(e => {
        const d = new Date(e.sent_at);
        const key = d.toLocaleString("default", { month: "short", year: "2-digit" });
        if (monthlyMap[key]) {
          monthlyMap[key].sent++;
          if (e.opened_at) monthlyMap[key].opened++;
          if (e.replied_at) monthlyMap[key].replied++;
        }
      });
      const monthlyTrend = Object.entries(monthlyMap).map(([month, v]) => ({ month, ...v }));

      setData({
        totalSent,
        totalOpened,
        totalReplied,
        totalBounced,
        openRate: totalSent ? Math.round((totalOpened / totalSent) * 100) : 0,
        replyRate: totalSent ? Math.round((totalReplied / totalSent) * 100) : 0,
        bounceRate: totalSent ? Math.round((totalBounced / totalSent) * 100) : 0,
        totalFollowups: followups.length,
        activeFollowups,
        completedFollowups,
        pausedFollowups,
        typeBreakdown,
        monthlyTrend,
      });
      setLoading(false);
    };

    fetchAnalytics();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const metricCards = [
    { label: "Emails Sent", value: data.totalSent, icon: Mail, accent: "text-primary" },
    { label: "Open Rate", value: `${data.openRate}%`, sub: `${data.totalOpened} opened`, icon: Eye, accent: "text-chart-2" },
    { label: "Reply Rate", value: `${data.replyRate}%`, sub: `${data.totalReplied} replies`, icon: MessageSquare, accent: "text-chart-3" },
    { label: "Bounce Rate", value: `${data.bounceRate}%`, sub: `${data.totalBounced} bounced`, icon: Target, accent: "text-destructive" },
  ];

  const statusData = [
    { name: "Active", value: data.activeFollowups },
    { name: "Completed", value: data.completedFollowups },
    { name: "Paused", value: data.pausedFollowups },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-4">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {metricCards.map(m => (
          <Card key={m.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`rounded-lg bg-muted p-2.5 ${m.accent}`}>
                <m.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{m.value}</p>
                <p className="text-xs text-muted-foreground">{m.label}</p>
                {m.sub && <p className="text-[10px] text-muted-foreground">{m.sub}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Follow-up summary row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Active Sequences", value: data.activeFollowups, icon: TrendingUp },
          { label: "Completed", value: data.completedFollowups, icon: CalendarCheck },
          { label: "Total Follow-Ups", value: data.totalFollowups, icon: Mail },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Monthly Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Email Performance (6 months)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthlyTrend} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="sent" name="Sent" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="opened" name="Opened" fill="hsl(var(--chart-2, 173 58% 39%))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="replied" name="Replied" fill="hsl(var(--chart-3, 142 76% 36%))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Type Breakdown Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Follow-Up Types</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {data.typeBreakdown.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">No follow-ups yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.typeBreakdown}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                    style={{ fontSize: 11 }}
                  >
                    {data.typeBreakdown.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Status Breakdown */}
        {statusData.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Follow-Up Status Overview</CardTitle>
            </CardHeader>
            <CardContent className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} className="fill-muted-foreground" width={80} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="value" name="Count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
