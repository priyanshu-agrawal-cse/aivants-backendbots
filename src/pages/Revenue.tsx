import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  IndianRupee, Plus, TrendingUp, TrendingDown, Wallet, Users, CreditCard,
  BarChart3, Trash2, Edit, ArrowUpRight, ArrowDownRight, Target, Download
} from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, parseISO, isWithinInterval } from "date-fns";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from "recharts";

type RevenueEntry = {
  id: string;
  user_id: string;
  type: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  client_id: string | null;
  is_recurring: boolean;
  recurring_interval: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
};

type Client = { id: string; name: string; company: string | null };
type TeamMember = { id: string; name: string; monthly_cost: number | null; is_active: boolean };

const CATEGORIES = {
  payment: [
    { value: "client_payment", label: "Client Payment" },
    { value: "project_milestone", label: "Project Milestone" },
    { value: "retainer", label: "Monthly Retainer" },
    { value: "other_income", label: "Other Income" },
  ],
  cost: [
    { value: "team_salary", label: "Team Salary" },
    { value: "subscription", label: "Software/Subscription" },
    { value: "infrastructure", label: "Infrastructure" },
    { value: "marketing", label: "Marketing Spend" },
    { value: "other_cost", label: "Other Cost" },
  ],
};

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(142, 71%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 84%, 60%)",
  "hsl(262, 83%, 58%)",
];

export default function Revenue() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<RevenueEntry[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<RevenueEntry | null>(null);

  // Form state
  const [formType, setFormType] = useState<"payment" | "cost">("payment");
  const [formCategory, setFormCategory] = useState("client_payment");
  const [formDescription, setFormDescription] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formDate, setFormDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [formClientId, setFormClientId] = useState<string>("");
  const [formRecurring, setFormRecurring] = useState(false);
  const [formInterval, setFormInterval] = useState("monthly");
  const [formNotes, setFormNotes] = useState("");

  useEffect(() => {
    if (user) fetchAll();
  }, [user]);

  async function fetchAll() {
    setLoading(true);
    const [entriesRes, clientsRes, teamRes] = await Promise.all([
      supabase.from("revenue_entries").select("*").order("date", { ascending: false }),
      supabase.from("clients").select("id, name, company"),
      supabase.from("team_members").select("id, name, monthly_cost, is_active"),
    ]);
    if (entriesRes.data) setEntries(entriesRes.data as RevenueEntry[]);
    if (clientsRes.data) setClients(clientsRes.data);
    if (teamRes.data) setTeamMembers(teamRes.data);
    setLoading(false);
  }

  function resetForm() {
    setFormType("payment");
    setFormCategory("client_payment");
    setFormDescription("");
    setFormAmount("");
    setFormDate(format(new Date(), "yyyy-MM-dd"));
    setFormClientId("");
    setFormRecurring(false);
    setFormInterval("monthly");
    setFormNotes("");
    setEditingEntry(null);
  }

  function openCreate(type: "payment" | "cost") {
    resetForm();
    setFormType(type);
    setFormCategory(type === "payment" ? "client_payment" : "team_salary");
    setDialogOpen(true);
  }

  function openEdit(entry: RevenueEntry) {
    setEditingEntry(entry);
    setFormType(entry.type as "payment" | "cost");
    setFormCategory(entry.category);
    setFormDescription(entry.description);
    setFormAmount(String(entry.amount));
    setFormDate(entry.date);
    setFormClientId(entry.client_id || "");
    setFormRecurring(entry.is_recurring);
    setFormInterval(entry.recurring_interval || "monthly");
    setFormNotes(entry.notes || "");
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!formDescription || !formAmount || !user) return;
    const payload = {
      user_id: user.id,
      type: formType,
      category: formCategory,
      description: formDescription,
      amount: parseFloat(formAmount),
      date: formDate,
      client_id: formClientId || null,
      is_recurring: formRecurring,
      recurring_interval: formRecurring ? formInterval : null,
      notes: formNotes,
    };
    let error;
    if (editingEntry) {
      ({ error } = await supabase.from("revenue_entries").update(payload).eq("id", editingEntry.id));
    } else {
      ({ error } = await supabase.from("revenue_entries").insert(payload));
    }
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editingEntry ? "Entry updated" : "Entry added" });
      setDialogOpen(false);
      resetForm();
      fetchAll();
    }
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("revenue_entries").delete().eq("id", id);
    if (!error) { fetchAll(); toast({ title: "Deleted" }); }
  }

  // ─── Analytics ──────────────────────────────────────
  const now = new Date();

  const currentMonthEntries = useMemo(() =>
    entries.filter(e => {
      const d = parseISO(e.date);
      return isWithinInterval(d, { start: startOfMonth(now), end: endOfMonth(now) });
    }), [entries]);

  const lastMonthEntries = useMemo(() => {
    const lm = subMonths(now, 1);
    return entries.filter(e => {
      const d = parseISO(e.date);
      return isWithinInterval(d, { start: startOfMonth(lm), end: endOfMonth(lm) });
    });
  }, [entries]);

  const sum = (arr: RevenueEntry[], type: string) => arr.filter(e => e.type === type).reduce((s, e) => s + Number(e.amount), 0);

  const currentRevenue = sum(currentMonthEntries, "payment");
  const currentCosts = sum(currentMonthEntries, "cost");
  const currentProfit = currentRevenue - currentCosts;
  const lastRevenue = sum(lastMonthEntries, "payment");
  const lastCosts = sum(lastMonthEntries, "cost");
  const lastProfit = lastRevenue - lastCosts;

  const revenueGrowth = lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue * 100) : 0;
  const profitMargin = currentRevenue > 0 ? (currentProfit / currentRevenue * 100) : 0;

  const totalTeamCost = teamMembers.filter(t => t.is_active).reduce((s, t) => s + (t.monthly_cost || 0), 0);
  const recurringRevenue = entries.filter(e => e.type === "payment" && e.is_recurring).reduce((s, e) => s + Number(e.amount), 0);

  // Monthly trend (last 6 months)
  const monthlyTrend = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => subMonths(now, 5 - i));
    return months.map(m => {
      const mEntries = entries.filter(e => {
        const d = parseISO(e.date);
        return isWithinInterval(d, { start: startOfMonth(m), end: endOfMonth(m) });
      });
      return {
        month: format(m, "MMM"),
        revenue: sum(mEntries, "payment"),
        costs: sum(mEntries, "cost"),
        profit: sum(mEntries, "payment") - sum(mEntries, "cost"),
      };
    });
  }, [entries]);

  // Category breakdown for current month
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    currentMonthEntries.forEach(e => {
      const label = [...CATEGORIES.payment, ...CATEGORIES.cost].find(c => c.value === e.category)?.label || e.category;
      map[label] = (map[label] || 0) + Number(e.amount);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [currentMonthEntries]);

  // Growth projection (simple linear)
  const projectedRevenue = useMemo(() => {
    if (monthlyTrend.length < 2) return currentRevenue;
    const revs = monthlyTrend.map(m => m.revenue);
    const avgGrowth = revs.slice(1).reduce((s, v, i) => s + (v - revs[i]), 0) / (revs.length - 1);
    return Math.max(0, currentRevenue + avgGrowth);
  }, [monthlyTrend, currentRevenue]);

  const fmt = (v: number) => `₹${v.toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;

  function exportCSV() {
    const headers = ["Date", "Type", "Category", "Description", "Amount", "Client", "Recurring", "Interval", "Notes"];
    const rows = entries.map(e => {
      const client = clients.find(c => c.id === e.client_id);
      const catLabel = [...CATEGORIES.payment, ...CATEGORIES.cost].find(c => c.value === e.category)?.label || e.category;
      return [
        e.date,
        e.type,
        catLabel,
        `"${e.description.replace(/"/g, '""')}"`,
        e.amount,
        client ? `"${client.name}"` : "",
        e.is_recurring ? "Yes" : "No",
        e.recurring_interval || "",
        `"${(e.notes || "").replace(/"/g, '""')}"`,
      ].join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `revenue-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: `${entries.length} entries downloaded` });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Revenue Dashboard</h1>
          <p className="text-muted-foreground">Financial overview — revenue, costs, profit & growth projections</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV} className="gap-1" disabled={entries.length === 0}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button onClick={() => openCreate("payment")} className="gap-1">
            <Plus className="h-4 w-4" /> Add Payment
          </Button>
          <Button variant="outline" onClick={() => openCreate("cost")} className="gap-1">
            <Plus className="h-4 w-4" /> Add Cost
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Revenue (This Month)" value={fmt(currentRevenue)} icon={<IndianRupee className="h-4 w-4" />}
          change={revenueGrowth} subtitle={`Last month: ${fmt(lastRevenue)}`} />
        <KPICard title="Total Costs" value={fmt(currentCosts)} icon={<CreditCard className="h-4 w-4" />}
          change={lastCosts > 0 ? ((currentCosts - lastCosts) / lastCosts * 100) : 0} invertColor subtitle={`Team cost: ${fmt(totalTeamCost)}/mo`} />
        <KPICard title="Net Profit" value={fmt(currentProfit)} icon={<Wallet className="h-4 w-4" />}
          change={lastProfit !== 0 ? ((currentProfit - lastProfit) / Math.abs(lastProfit) * 100) : 0}
          subtitle={`Margin: ${profitMargin.toFixed(1)}%`} />
        <KPICard title="Projected Next Month" value={fmt(projectedRevenue)} icon={<Target className="h-4 w-4" />}
          subtitle={`MRR: ${fmt(recurringRevenue)}`} />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">6-Month Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Area type="monotone" dataKey="revenue" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} name="Revenue" />
                <Area type="monotone" dataKey="costs" stackId="2" stroke="hsl(0, 84%, 60%)" fill="hsl(0, 84%, 60%)" fillOpacity={0.2} name="Costs" />
                <Area type="monotone" dataKey="profit" stroke="hsl(142, 71%, 45%)" fill="hsl(142, 71%, 45%)" fillOpacity={0.2} name="Profit" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {categoryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {categoryBreakdown.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data this month</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Entries Table */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Entries</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="costs">Costs</TabsTrigger>
          <TabsTrigger value="recurring">Recurring</TabsTrigger>
        </TabsList>
        {["all", "payments", "costs", "recurring"].map(tab => (
          <TabsContent key={tab} value={tab}>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries
                      .filter(e =>
                        tab === "all" ? true :
                        tab === "payments" ? e.type === "payment" :
                        tab === "costs" ? e.type === "cost" :
                        e.is_recurring
                      )
                      .slice(0, 50)
                      .map(entry => {
                        const client = clients.find(c => c.id === entry.client_id);
                        const catLabel = [...CATEGORIES.payment, ...CATEGORIES.cost].find(c => c.value === entry.category)?.label || entry.category;
                        return (
                          <TableRow key={entry.id}>
                            <TableCell className="text-muted-foreground text-sm">{format(parseISO(entry.date), "dd MMM yyyy")}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {entry.description}
                                {entry.is_recurring && <Badge variant="outline" className="text-xs">Recurring</Badge>}
                              </div>
                            </TableCell>
                            <TableCell><Badge variant="secondary" className="text-xs">{catLabel}</Badge></TableCell>
                            <TableCell className="text-sm text-muted-foreground">{client ? client.name : "—"}</TableCell>
                            <TableCell className={`text-right font-medium ${entry.type === "payment" ? "text-green-600" : "text-red-500"}`}>
                              {entry.type === "payment" ? "+" : "−"}{fmt(Number(entry.amount))}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1 justify-end">
                                <Button variant="ghost" size="icon" onClick={() => openEdit(entry)}><Edit className="h-3.5 w-3.5" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(entry.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    {entries.filter(e =>
                      tab === "all" ? true :
                      tab === "payments" ? e.type === "payment" :
                      tab === "costs" ? e.type === "cost" :
                      e.is_recurring
                    ).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No entries yet. Add a payment or cost to get started.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingEntry ? "Edit Entry" : formType === "payment" ? "Add Payment" : "Add Cost"}</DialogTitle>
            <DialogDescription>Record a financial entry for tracking</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={formType} onValueChange={(v: "payment" | "cost") => { setFormType(v); setFormCategory(v === "payment" ? "client_payment" : "team_salary"); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="payment">Payment (Income)</SelectItem>
                    <SelectItem value="cost">Cost (Expense)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES[formType].map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="e.g. March retainer - Acme Corp" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount (₹)</Label>
                <Input type="number" value={formAmount} onChange={e => setFormAmount(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Client (optional)</Label>
              <Select value={formClientId} onValueChange={setFormClientId}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ""}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={formRecurring} onCheckedChange={setFormRecurring} />
              <Label>Recurring entry</Label>
              {formRecurring && (
                <Select value={formInterval} onValueChange={setFormInterval}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={formNotes} onChange={e => setFormNotes(e.target.value)} rows={2} placeholder="Optional notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!formDescription || !formAmount}>{editingEntry ? "Update" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KPICard({ title, value, icon, change, subtitle, invertColor }: {
  title: string; value: string; icon: React.ReactNode; change?: number; subtitle?: string; invertColor?: boolean;
}) {
  const isPositive = change !== undefined ? (invertColor ? change <= 0 : change >= 0) : true;
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center gap-2 mt-1">
          {change !== undefined && (
            <span className={`flex items-center text-xs font-medium ${isPositive ? "text-green-600" : "text-red-500"}`}>
              {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(change).toFixed(1)}%
            </span>
          )}
          {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
