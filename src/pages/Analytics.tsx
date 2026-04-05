import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  FunnelChart, Funnel, LabelList,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, subDays } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Mail, Users, Target, MessageSquare } from "lucide-react";

interface DailyData {
  date: string;
  sent: number;
  opens: number;
  replies: number;
}

interface CampaignPerf {
  name: string;
  opens: number;
  replies: number;
}

interface FunnelData {
  name: string;
  value: number;
  fill: string;
}

interface ReplyBreakdown {
  name: string;
  value: number;
  fill: string;
}

const lineConfig: ChartConfig = {
  sent: { label: "Sent", color: "hsl(var(--chart-1))" },
  opens: { label: "Opens", color: "hsl(var(--chart-2))" },
  replies: { label: "Replies", color: "hsl(var(--chart-3))" },
};

const barConfig: ChartConfig = {
  opens: { label: "Open Rate %", color: "hsl(var(--chart-1))" },
  replies: { label: "Reply Rate %", color: "hsl(var(--chart-2))" },
};

const revenueConfig: ChartConfig = {
  revenue: { label: "Pipeline Value", color: "hsl(var(--chart-4))" },
};

const FUNNEL_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const REPLY_COLORS: Record<string, string> = {
  interested: "hsl(142, 76%, 36%)",
  meeting_request: "hsl(217, 91%, 60%)",
  objection: "hsl(38, 92%, 50%)",
  not_interested: "hsl(0, 84%, 60%)",
  question: "hsl(262, 83%, 58%)",
  out_of_office: "hsl(var(--muted-foreground))",
  referral: "hsl(173, 80%, 40%)",
  unsubscribe: "hsl(0, 0%, 45%)",
};

export default function Analytics() {
  const { user } = useAuth();
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [campaignPerf, setCampaignPerf] = useState<CampaignPerf[]>([]);
  const [funnelData, setFunnelData] = useState<FunnelData[]>([]);
  const [replyBreakdown, setReplyBreakdown] = useState<ReplyBreakdown[]>([]);
  const [revenueData, setRevenueData] = useState<{ date: string; revenue: number }[]>([]);
  const [summary, setSummary] = useState({
    totalSent: 0, avgOpenRate: 0, avgReplyRate: 0, bounceRate: 0,
    meetingsBooked: 0, clientsWon: 0, totalPipelineValue: 0, avgDealSize: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchAnalytics() {
      setLoading(true);

      const [{ data: logs }, { data: pipeline }, { data: channelActs }] = await Promise.all([
        supabase.from("email_logs").select("*, campaigns(name)").eq("user_id", user!.id),
        supabase.from("pipeline_stages").select("*").eq("user_id", user!.id),
        supabase.from("channel_activities").select("*").eq("user_id", user!.id),
      ]);

      const allLogs = logs || [];
      const allPipeline = pipeline || [];

      // Summary
      const totalSent = allLogs.length;
      const totalOpened = allLogs.filter((l) => l.opened_at).length;
      const totalReplied = allLogs.filter((l) => l.replied_at).length;
      const totalBounced = allLogs.filter((l) => l.bounced).length;
      const meetingsBooked = allPipeline.filter((p) => p.meeting_booked).length;
      const clientsWon = allPipeline.filter((p) => p.client_won).length;
      const totalPipelineValue = allPipeline.reduce((sum, p) => sum + (Number((p as any).deal_value) || 0), 0);
      const dealsWithValue = allPipeline.filter((p) => Number((p as any).deal_value) > 0);
      const avgDealSize = dealsWithValue.length > 0 ? Math.round(totalPipelineValue / dealsWithValue.length) : 0;

      setSummary({
        totalSent,
        avgOpenRate: totalSent > 0 ? Math.round((totalOpened / totalSent) * 1000) / 10 : 0,
        avgReplyRate: totalSent > 0 ? Math.round((totalReplied / totalSent) * 1000) / 10 : 0,
        bounceRate: totalSent > 0 ? Math.round((totalBounced / totalSent) * 1000) / 10 : 0,
        meetingsBooked,
        clientsWon,
        totalPipelineValue,
        avgDealSize,
      });

      // Daily data
      const daily: DailyData[] = [];
      for (let i = 6; i >= 0; i--) {
        const day = subDays(new Date(), i);
        const dayStr = format(day, "yyyy-MM-dd");
        const dayLabel = format(day, "MMM d");
        const dayLogs = allLogs.filter(
          (l) => l.sent_at && format(new Date(l.sent_at), "yyyy-MM-dd") === dayStr
        );
        daily.push({
          date: dayLabel,
          sent: dayLogs.length,
          opens: dayLogs.filter((l) => l.opened_at).length,
          replies: dayLogs.filter((l) => l.replied_at).length,
        });
      }
      setDailyData(daily);

      // Revenue over time (pipeline deals by date)
      const revMap = new Map<string, number>();
      for (let i = 6; i >= 0; i--) {
        const day = subDays(new Date(), i);
        const dayLabel = format(day, "MMM d");
        revMap.set(dayLabel, 0);
      }
      allPipeline.forEach((p) => {
        const dayLabel = format(new Date(p.created_at), "MMM d");
        if (revMap.has(dayLabel)) {
          revMap.set(dayLabel, (revMap.get(dayLabel) || 0) + (Number((p as any).deal_value) || 0));
        }
      });
      setRevenueData(Array.from(revMap.entries()).map(([date, revenue]) => ({ date, revenue })));

      // Campaign performance
      const campaignMap = new Map<string, { sent: number; opened: number; replied: number }>();
      allLogs.forEach((log) => {
        const name = (log as any).campaigns?.name || "Unknown";
        if (!campaignMap.has(name)) campaignMap.set(name, { sent: 0, opened: 0, replied: 0 });
        const c = campaignMap.get(name)!;
        c.sent++;
        if (log.opened_at) c.opened++;
        if (log.replied_at) c.replied++;
      });
      setCampaignPerf(
        Array.from(campaignMap.entries())
          .filter(([name]) => name !== "Unknown")
          .map(([name, stats]) => ({
            name,
            opens: stats.sent > 0 ? Math.round((stats.opened / stats.sent) * 1000) / 10 : 0,
            replies: stats.sent > 0 ? Math.round((stats.replied / stats.sent) * 1000) / 10 : 0,
          }))
          .sort((a, b) => b.opens - a.opens)
          .slice(0, 6)
      );

      // Pipeline funnel
      const stageCounts: Record<string, number> = {};
      allPipeline.forEach((p) => {
        stageCounts[p.stage] = (stageCounts[p.stage] || 0) + 1;
      });
      const funnelStages = ["New Lead", "Contacted", "Interested", "Meeting Scheduled", "Proposal Sent", "Client Won"];
      setFunnelData(
        funnelStages
          .map((name, i) => ({ name, value: stageCounts[name] || 0, fill: FUNNEL_COLORS[i % FUNNEL_COLORS.length] }))
          .filter((d) => d.value > 0)
      );

      // Reply classification breakdown
      const replyCounts: Record<string, number> = {};
      allLogs.forEach((l) => {
        const cls = (l as any).reply_classification;
        if (cls) replyCounts[cls] = (replyCounts[cls] || 0) + 1;
      });
      setReplyBreakdown(
        Object.entries(replyCounts).map(([name, value]) => ({
          name: name.replace(/_/g, " "),
          value,
          fill: REPLY_COLORS[name] || "hsl(var(--muted-foreground))",
        }))
      );

      setLoading(false);
    }

    fetchAnalytics();
  }, [user]);

  const summaryCards = [
    { label: "Total Sent", value: summary.totalSent.toLocaleString(), icon: Mail, color: "text-chart-1" },
    { label: "Open Rate", value: `${summary.avgOpenRate}%`, icon: TrendingUp, color: "text-chart-2" },
    { label: "Reply Rate", value: `${summary.avgReplyRate}%`, icon: MessageSquare, color: "text-chart-3" },
    { label: "Meetings", value: summary.meetingsBooked.toString(), icon: Target, color: "text-chart-4" },
    { label: "Clients Won", value: summary.clientsWon.toString(), icon: Users, color: "text-success" },
    { label: "Pipeline Value", value: `₹${summary.totalPipelineValue.toLocaleString("en-IN")}`, icon: DollarSign, color: "text-chart-5" },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Campaign performance & revenue tracking</p>
        </div>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-10 w-full" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  const hasData = summary.totalSent > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Campaign performance & revenue tracking</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {summaryCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!hasData ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No email data yet. Start sending campaigns to see analytics here.</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="engagement" className="space-y-4">
          <TabsList>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="revenue">Revenue & Pipeline</TabsTrigger>
            <TabsTrigger value="replies">Reply Intelligence</TabsTrigger>
          </TabsList>

          <TabsContent value="engagement" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>Daily Sending Volume</CardTitle></CardHeader>
                <CardContent>
                  <ChartContainer config={lineConfig} className="h-[300px] w-full">
                    <LineChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="sent" stroke="var(--color-sent)" strokeWidth={2} />
                      <Line type="monotone" dataKey="opens" stroke="var(--color-opens)" strokeWidth={2} />
                      <Line type="monotone" dataKey="replies" stroke="var(--color-replies)" strokeWidth={2} />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {campaignPerf.length > 0 && (
                <Card>
                  <CardHeader><CardTitle>Top Performing Campaigns</CardTitle></CardHeader>
                  <CardContent>
                    <ChartContainer config={barConfig} className="h-[300px] w-full">
                      <BarChart data={campaignPerf} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={120} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="opens" fill="var(--color-opens)" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="replies" fill="var(--color-replies)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Total Pipeline Value</div>
                  <div className="text-2xl font-bold">₹{summary.totalPipelineValue.toLocaleString("en-IN")}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Avg Deal Size</div>
                  <div className="text-2xl font-bold">₹{summary.avgDealSize.toLocaleString("en-IN")}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Bounce Rate</div>
                  <div className="text-2xl font-bold">{summary.bounceRate}%</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>Pipeline Value Trend</CardTitle></CardHeader>
                <CardContent>
                  <ChartContainer config={revenueConfig} className="h-[300px] w-full">
                    <AreaChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area type="monotone" dataKey="revenue" stroke="var(--color-revenue)" fill="var(--color-revenue)" fillOpacity={0.2} strokeWidth={2} />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {funnelData.length > 0 && (
                <Card>
                  <CardHeader><CardTitle>Pipeline Funnel</CardTitle></CardHeader>
                  <CardContent>
                    <ChartContainer config={{}} className="h-[300px] w-full">
                      <BarChart data={funnelData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={130} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {funnelData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="replies" className="space-y-6">
            {replyBreakdown.length > 0 ? (
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle>Reply Classification</CardTitle></CardHeader>
                  <CardContent>
                    <ChartContainer config={{}} className="h-[300px] w-full">
                      <PieChart>
                        <Pie data={replyBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                          {replyBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Reply Breakdown</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {replyBreakdown.map((item) => (
                        <div key={item.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.fill }} />
                            <span className="text-sm capitalize">{item.name}</span>
                          </div>
                          <Badge variant="secondary">{item.value}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">No classified replies yet. Use the AI Deal Assistant to classify incoming replies.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
