import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import {
  Calendar, Clock, Plus, AlertCircle, CheckCircle2, CalendarClock,
  Loader2, Pause, Search, Users, CreditCard,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { isPast, isToday, isFuture, parseISO, addDays } from "date-fns";
import { FollowUpItemCard, type FollowUpItemData } from "@/components/followups/FollowUpItemCard";
import { CreateFollowUpDialog, type CreateFollowUpData } from "@/components/followups/CreateFollowUpDialog";
import { FollowUpAnalytics } from "@/components/followups/FollowUpAnalytics";
import { BarChart3 } from "lucide-react";

interface Lead { id: string; first_name: string; last_name: string | null; email: string; company_name: string | null; }
interface Sequence { id: string; name: string; followup_type: string; }
interface Asset { id: string; title: string; type: string; }
interface Template { id: string; name: string; subject: string; body: string; }

export default function FollowUps() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [followups, setFollowups] = useState<FollowUpItemData[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [mainTab, setMainTab] = useState("lead");
  const [subTab, setSubTab] = useState("today");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  // Reschedule
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState("");
  // Delete
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);

    const [fuRes, leadsRes, seqRes, assetRes, templatesRes] = await Promise.all([
      supabase
        .from("followup_status")
        .select("*, leads(first_name, last_name, email, company_name), followup_sequences(name, followup_type)")
        .eq("user_id", user.id)
        .order("next_followup_date", { ascending: true }),
      supabase.from("leads").select("id, first_name, last_name, email, company_name").eq("user_id", user.id).order("first_name"),
      supabase.from("followup_sequences").select("id, name, followup_type").eq("user_id", user.id),
      supabase.from("content_assets").select("id, title, type").eq("user_id", user.id),
      supabase.from("email_templates").select("id, name, subject, body").eq("user_id", user.id),
    ]);

    // Fetch steps for all sequences
    const items: FollowUpItemData[] = (fuRes.data || []).map((item: any) => ({
      ...item,
      lead: item.leads,
      sequence: item.followup_sequences,
    }));

    // Batch fetch steps for active items
    const activeSeqIds = [...new Set(items.filter(i => i.status === "active").map(i => i.sequence_id))];
    if (activeSeqIds.length > 0) {
      const { data: allSteps } = await supabase
        .from("followup_steps")
        .select("*")
        .in("sequence_id", activeSeqIds)
        .order("step_number", { ascending: true });
      if (allSteps) {
        items.forEach(item => {
          item.steps = (allSteps as any[]).filter(s => s.sequence_id === item.sequence_id);
        });
      }
    }

    setFollowups(items);
    setLeads((leadsRes.data || []) as Lead[]);
    setSequences((seqRes.data || []) as Sequence[]);
    setAssets((assetRes.data || []) as Asset[]);
    setTemplates((templatesRes.data || []) as Template[]);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [user]);

  // Filter by main tab (lead vs client) and search
  const filtered = useMemo(() => {
    return followups.filter(f => {
      const cat = f.category || "lead";
      if (cat !== mainTab) return false;
      if (!search) return true;
      const searchLower = search.toLowerCase();
      const name = f.client_name || (f.lead ? `${f.lead.first_name} ${f.lead.last_name || ""}` : "");
      const company = f.client_company || f.lead?.company_name || "";
      return name.toLowerCase().includes(searchLower) || company.toLowerCase().includes(searchLower);
    });
  }, [followups, mainTab, search]);

  const todayItems = filtered.filter(f => f.status === "active" && f.next_followup_date && isToday(parseISO(f.next_followup_date)));
  const overdueItems = filtered.filter(f => f.status === "active" && f.next_followup_date && isPast(parseISO(f.next_followup_date)) && !isToday(parseISO(f.next_followup_date)));
  const upcomingItems = filtered.filter(f => f.status === "active" && f.next_followup_date && isFuture(parseISO(f.next_followup_date)) && !isToday(parseISO(f.next_followup_date)));
  const completedItems = filtered.filter(f => ["completed", "replied"].includes(f.status));
  const pausedItems = filtered.filter(f => f.status === "paused");

  const handlePause = async (id: string) => {
    const { error } = await supabase.from("followup_status").update({ status: "paused", updated_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Follow-up paused" }); fetchAll();
  };

  const handleResume = async (id: string) => {
    const { error } = await supabase.from("followup_status").update({ status: "active", updated_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Follow-up resumed" }); fetchAll();
  };

  const handleSkip = async (item: FollowUpItemData) => {
    const nextStep = item.current_step + 1;
    const { data: stepData } = await supabase
      .from("followup_steps")
      .select("step_number, delay_days")
      .eq("sequence_id", item.sequence_id)
      .gt("step_number", nextStep)
      .order("step_number", { ascending: true })
      .limit(1)
      .maybeSingle();

    const nextDate = stepData ? addDays(new Date(), stepData.delay_days).toISOString() : null;
    const { error } = await supabase.from("followup_status").update({
      current_step: nextStep,
      next_followup_date: nextDate,
      updated_at: new Date().toISOString(),
      ...(nextDate ? {} : { status: "completed" }),
    }).eq("id", item.id);

    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: nextDate ? "Step skipped" : "Sequence completed" }); fetchAll();
  };

  const handleReschedule = async () => {
    if (!rescheduleId || !newDate) return;
    const { error } = await supabase.from("followup_status").update({
      next_followup_date: new Date(newDate).toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", rescheduleId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Rescheduled" }); setRescheduleId(null); setNewDate(""); fetchAll();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("followup_status").delete().eq("id", deleteId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Deleted" }); setDeleteId(null); fetchAll();
  };

  const handleCreate = async (data: CreateFollowUpData) => {
    if (!user) return;

    let sequenceId = data.sequence_id;

    // If custom steps, create a new sequence first
    if (!sequenceId && data.custom_steps.length > 0) {
      const seqName = `${data.client_name || "Custom"} - ${data.followup_type.replace(/_/g, " ")}`;
      const { data: newSeq, error: seqErr } = await supabase
        .from("followup_sequences")
        .insert({
          user_id: user.id,
          name: seqName,
          followup_type: data.followup_type,
        })
        .select()
        .single();
      if (seqErr || !newSeq) {
        toast({ title: "Error creating sequence", description: seqErr?.message, variant: "destructive" });
        return;
      }
      sequenceId = newSeq.id;

      // Insert steps
      const { error: stepsErr } = await supabase.from("followup_steps").insert(
        data.custom_steps.map((s, i) => ({
          sequence_id: sequenceId,
          step_number: i + 1,
          delay_days: s.delay_days,
          channel: s.channel,
          subject_override: s.subject_override,
          body_override: s.body_override,
          action_type: s.action_type,
          notes: s.notes,
          content_asset_id: s.content_asset_id || null,
          template_id: s.template_id || null,
          script_id: s.script_id || null,
        }))
      );
      if (stepsErr) {
        toast({ title: "Error saving steps", description: stepsErr.message, variant: "destructive" });
        return;
      }
    }

    if (!sequenceId) {
      toast({ title: "Select a sequence or create custom steps", variant: "destructive" });
      return;
    }

    const startDate = data.start_date ? new Date(data.start_date).toISOString() : new Date().toISOString();

    const { error } = await supabase.from("followup_status").insert({
      user_id: user.id,
      lead_id: data.lead_id || null,
      sequence_id: sequenceId,
      followup_type: data.followup_type,
      category: data.category,
      purpose: data.purpose,
      sender_name: data.sender_name,
      sender_email: data.sender_email,
      next_followup_date: startDate,
      scheduled_date: data.start_date ? new Date(data.start_date).toISOString() : null,
      end_date: data.end_date ? new Date(data.end_date).toISOString() : null,
      condition_stop_on: data.condition_stop_on === "none" ? null : data.condition_stop_on,
      notes: data.notes,
      client_name: data.client_name,
      client_email: data.client_email,
      client_company: data.client_company,
      status: "active",
      current_step: 0,
    } as any);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Follow-up created!" });
    fetchAll();
  };

  const renderList = (items: FollowUpItemData[], emptyMsg: string) => {
    if (items.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>{emptyMsg}</p>
        </div>
      );
    }
    return (
      <div className="space-y-2">
        {items.map(item => (
          <FollowUpItemCard
            key={item.id}
            item={item}
            onPause={handlePause}
            onResume={handleResume}
            onSkip={handleSkip}
            onReschedule={setRescheduleId}
            onDelete={setDeleteId}
          />
        ))}
      </div>
    );
  };

  const stats = [
    { label: "Today", count: todayItems.length, icon: CalendarClock, color: "text-primary", tab: "today" },
    { label: "Overdue", count: overdueItems.length, icon: AlertCircle, color: "text-destructive", tab: "overdue" },
    { label: "Upcoming", count: upcomingItems.length, icon: Clock, color: "text-muted-foreground", tab: "upcoming" },
    { label: "Paused", count: pausedItems.length, icon: Pause, color: "text-warning", tab: "paused" },
    { label: "Completed", count: completedItems.length, icon: CheckCircle2, color: "text-success", tab: "completed" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Follow-Ups</h1>
          <p className="text-muted-foreground">Manage outreach, nurturing, payments, and client relationships</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Follow-Up
        </Button>
      </div>

      {/* Lead vs Client Toggle */}
      <Tabs value={mainTab} onValueChange={(v) => { setMainTab(v); setSubTab("today"); setSearch(""); }}>
        <div className="flex items-center gap-4 flex-wrap">
          <TabsList>
            <TabsTrigger value="lead" className="gap-2">
              <Users className="h-4 w-4" />
              Lead Follow-Ups
            </TabsTrigger>
            <TabsTrigger value="client" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Client Follow-Ups
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or company..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <TabsContent value="lead" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {stats.map(s => (
              <Card key={s.label} className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => setSubTab(s.tab)}>
                <CardContent className="p-4 flex items-center gap-3">
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                  <div>
                    <p className="text-2xl font-bold">{s.count}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
            </div>
          ) : (
            <Tabs value={subTab} onValueChange={setSubTab}>
              <TabsList>
                <TabsTrigger value="today">Today ({todayItems.length})</TabsTrigger>
                <TabsTrigger value="overdue">Overdue ({overdueItems.length})</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming ({upcomingItems.length})</TabsTrigger>
                <TabsTrigger value="paused">Paused ({pausedItems.length})</TabsTrigger>
                <TabsTrigger value="completed">Completed ({completedItems.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="today" className="mt-4">{renderList(todayItems, "No lead follow-ups for today")}</TabsContent>
              <TabsContent value="overdue" className="mt-4">{renderList(overdueItems, "No overdue lead follow-ups")}</TabsContent>
              <TabsContent value="upcoming" className="mt-4">{renderList(upcomingItems, "No upcoming lead follow-ups")}</TabsContent>
              <TabsContent value="paused" className="mt-4">{renderList(pausedItems, "No paused lead follow-ups")}</TabsContent>
              <TabsContent value="completed" className="mt-4">{renderList(completedItems, "No completed lead follow-ups")}</TabsContent>
            </Tabs>
          )}
        </TabsContent>

        <TabsContent value="client" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {stats.map(s => (
              <Card key={s.label} className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => setSubTab(s.tab)}>
                <CardContent className="p-4 flex items-center gap-3">
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                  <div>
                    <p className="text-2xl font-bold">{s.count}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
            </div>
          ) : (
            <Tabs value={subTab} onValueChange={setSubTab}>
              <TabsList>
                <TabsTrigger value="today">Today ({todayItems.length})</TabsTrigger>
                <TabsTrigger value="overdue">Overdue ({overdueItems.length})</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming ({upcomingItems.length})</TabsTrigger>
                <TabsTrigger value="paused">Paused ({pausedItems.length})</TabsTrigger>
                <TabsTrigger value="completed">Completed ({completedItems.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="today" className="mt-4">{renderList(todayItems, "No client follow-ups for today")}</TabsContent>
              <TabsContent value="overdue" className="mt-4">{renderList(overdueItems, "No overdue client follow-ups")}</TabsContent>
              <TabsContent value="upcoming" className="mt-4">{renderList(upcomingItems, "No upcoming client follow-ups")}</TabsContent>
              <TabsContent value="paused" className="mt-4">{renderList(pausedItems, "No paused client follow-ups")}</TabsContent>
              <TabsContent value="completed" className="mt-4">{renderList(completedItems, "No completed client follow-ups")}</TabsContent>
        <TabsContent value="analytics" className="mt-4">
          <FollowUpAnalytics />
        </TabsContent>
      </Tabs>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <CreateFollowUpDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        leads={leads}
        sequences={sequences}
        assets={assets}
        templates={templates}
        defaultCategory={mainTab}
        onSubmit={handleCreate}
      />

      {/* Reschedule Dialog */}
      <Dialog open={!!rescheduleId} onOpenChange={open => !open && setRescheduleId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Reschedule Follow-Up</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <Label>New Date</Label>
            <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleId(null)}>Cancel</Button>
            <Button onClick={handleReschedule} disabled={!newDate}>Reschedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete follow-up?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this follow-up.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
