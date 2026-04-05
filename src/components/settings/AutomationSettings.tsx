import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Zap, Plus, Loader2, Trash2, Save } from "lucide-react";

const triggerEvents = [
  { value: "lead_created", label: "Lead Created" },
  { value: "proposal_opened", label: "Proposal Opened" },
  { value: "email_replied", label: "Email Replied" },
  { value: "project_deadline", label: "Project Deadline Approaching" },
  { value: "payment_overdue", label: "Payment Overdue" },
  { value: "campaign_completed", label: "Campaign Completed" },
  { value: "meeting_booked", label: "Meeting Booked" },
];

const actionTypes = [
  { value: "send_followup", label: "Send Follow-up Email" },
  { value: "send_notification", label: "Send Notification" },
  { value: "create_task", label: "Create Task" },
  { value: "update_status", label: "Update Lead Status" },
  { value: "send_telegram", label: "Send Telegram Message" },
  { value: "trigger_campaign", label: "Trigger Campaign" },
];

interface Rule {
  id?: string;
  name: string;
  trigger_event: string;
  action_type: string;
  delay_hours: number;
  is_active: boolean;
}

export function AutomationSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<Rule[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newRule, setNewRule] = useState<Rule>({ name: "", trigger_event: "lead_created", action_type: "send_followup", delay_hours: 0, is_active: true });
  const [saving, setSaving] = useState(false);

  const loadRules = async () => {
    if (!user) return;
    const { data } = await supabase.from("automation_rules" as any).select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setRules((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { loadRules(); }, [user]);

  const handleCreate = async () => {
    if (!user || !newRule.name.trim()) { toast({ title: "Name required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from("automation_rules" as any).insert({ ...newRule, user_id: user.id } as any);
      if (error) throw error;
      toast({ title: "Rule created!" });
      setDialogOpen(false);
      setNewRule({ name: "", trigger_event: "lead_created", action_type: "send_followup", delay_hours: 0, is_active: true });
      loadRules();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    setSaving(false);
  };

  const toggleRule = async (id: string, active: boolean) => {
    try {
      const { error } = await supabase.from("automation_rules" as any).update({ is_active: active, updated_at: new Date().toISOString() } as any).eq("id", id);
      if (error) throw error;
      setRules(prev => prev.map(r => r.id === id ? { ...r, is_active: active } : r));
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const deleteRule = async (id: string) => {
    try {
      const { error } = await supabase.from("automation_rules" as any).delete().eq("id", id);
      if (error) throw error;
      setRules(prev => prev.filter(r => r.id !== id));
      toast({ title: "Rule deleted" });
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  if (loading) return <div className="flex items-center gap-2 text-muted-foreground py-8"><Loader2 className="h-4 w-4 animate-spin" />Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Zap className="h-6 w-6 text-primary" />Automation Rules</h1>
          <p className="text-muted-foreground text-sm">Create rules to automate actions based on triggers</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />New Rule</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Automation Rule</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2"><Label>Rule Name</Label><Input value={newRule.name} onChange={e => setNewRule({ ...newRule, name: e.target.value })} placeholder="e.g. Follow up on new leads" /></div>
              <div className="space-y-2">
                <Label>Trigger Event</Label>
                <Select value={newRule.trigger_event} onValueChange={v => setNewRule({ ...newRule, trigger_event: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{triggerEvents.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Action</Label>
                <Select value={newRule.action_type} onValueChange={v => setNewRule({ ...newRule, action_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{actionTypes.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Delay (hours)</Label><Input type="number" value={newRule.delay_hours} onChange={e => setNewRule({ ...newRule, delay_hours: Number(e.target.value) })} min={0} /></div>
              <Button onClick={handleCreate} disabled={saving} className="w-full">
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Create Rule
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {rules.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No automation rules yet. Create one to get started.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {rules.map(rule => (
            <Card key={rule.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{rule.name}</p>
                    <Badge variant={rule.is_active ? "default" : "secondary"}>{rule.is_active ? "Active" : "Paused"}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    When <span className="font-medium">{triggerEvents.find(t => t.value === rule.trigger_event)?.label}</span>
                    {rule.delay_hours > 0 && <> → wait {rule.delay_hours}h</>}
                    {" → "}<span className="font-medium">{actionTypes.find(a => a.value === rule.action_type)?.label}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={rule.is_active} onCheckedChange={v => toggleRule(rule.id!, v)} />
                  <Button variant="ghost" size="icon" onClick={() => deleteRule(rule.id!)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
