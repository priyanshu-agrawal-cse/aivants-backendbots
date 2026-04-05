import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus, Trash2, Play, Pause, GripVertical, Mail, Linkedin, MessageSquare,
  Phone, Clock, FileText, ScrollText, Paperclip, ArrowDown, Users, Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Sequence {
  id: string;
  name: string;
  campaign_id: string | null;
  is_active: boolean;
  created_at: string;
  steps?: Step[];
  _enrolledCount?: number;
}

interface Step {
  id: string;
  sequence_id?: string;
  step_number: number;
  delay_days: number;
  script_id: string | null;
  template_id: string | null;
  content_asset_id: string | null;
  subject_override: string;
  body_override: string;
  channel: string;
}

interface Campaign { id: string; name: string; }
interface Script { id: string; name: string; category: string; }
interface Template { id: string; name: string; subject: string; }
interface Asset { id: string; title: string; type: string; }

const CHANNEL_ICONS: Record<string, React.ElementType> = {
  email: Mail,
  linkedin: Linkedin,
  whatsapp: MessageSquare,
  sms: MessageSquare,
  phone_reminder: Phone,
};

const CHANNEL_LABELS: Record<string, string> = {
  email: "Email",
  linkedin: "LinkedIn",
  whatsapp: "WhatsApp",
  sms: "SMS",
  phone_reminder: "Phone Reminder",
};

export default function Sequences() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingSequence, setEditingSequence] = useState<Sequence | null>(null);
  const [seqName, setSeqName] = useState("");
  const [seqCampaignId, setSeqCampaignId] = useState<string>("none");
  const [steps, setSteps] = useState<Omit<Step, "id">[]>([]);

  // Enroll dialog
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [enrollSequenceId, setEnrollSequenceId] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);

    const [seqRes, campRes, scriptRes, tmplRes, assetRes, statusRes] = await Promise.all([
      supabase.from("followup_sequences").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("campaigns").select("id, name").eq("user_id", user.id),
      supabase.from("outreach_scripts").select("id, name, category").eq("user_id", user.id),
      supabase.from("email_templates").select("id, name, subject").eq("user_id", user.id),
      supabase.from("content_assets").select("id, title, type").eq("user_id", user.id),
      supabase.from("followup_status").select("sequence_id, status").eq("user_id", user.id).eq("status", "active"),
    ]);

    setCampaigns((campRes.data as Campaign[]) || []);
    setScripts((scriptRes.data as Script[]) || []);
    setTemplates((tmplRes.data as Template[]) || []);
    setAssets((assetRes.data as Asset[]) || []);

    // Count enrolled leads per sequence
    const enrollCounts = new Map<string, number>();
    (statusRes.data || []).forEach((s: any) => {
      enrollCounts.set(s.sequence_id, (enrollCounts.get(s.sequence_id) || 0) + 1);
    });

    // Fetch steps for each sequence
    const seqs = (seqRes.data || []) as Sequence[];
    if (seqs.length > 0) {
      const seqIds = seqs.map((s) => s.id);
      const { data: allSteps } = await supabase
        .from("followup_steps")
        .select("*")
        .in("sequence_id", seqIds)
        .order("step_number", { ascending: true });

      seqs.forEach((seq) => {
        seq.steps = ((allSteps || []) as Step[]).filter((s) => s.sequence_id === seq.id);
        seq._enrolledCount = enrollCounts.get(seq.id) || 0;
      });
    }

    setSequences(seqs);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [user]);

  const openCreate = () => {
    setEditingSequence(null);
    setSeqName("");
    setSeqCampaignId("none");
    setSteps([{
      step_number: 1, delay_days: 0, script_id: null, template_id: null,
      content_asset_id: null, subject_override: "", body_override: "", channel: "email",
    }]);
    setDialogOpen(true);
  };

  const openEdit = (seq: Sequence) => {
    setEditingSequence(seq);
    setSeqName(seq.name);
    setSeqCampaignId(seq.campaign_id || "none");
    setSteps(
      (seq.steps || []).map((s) => ({
        step_number: s.step_number,
        delay_days: s.delay_days,
        script_id: s.script_id,
        template_id: s.template_id,
        content_asset_id: s.content_asset_id,
        subject_override: s.subject_override,
        body_override: s.body_override,
        channel: s.channel,
      }))
    );
    setDialogOpen(true);
  };

  const addStep = () => {
    setSteps((prev) => [
      ...prev,
      {
        step_number: prev.length + 1,
        delay_days: prev.length === 0 ? 0 : 3,
        script_id: null,
        template_id: null,
        content_asset_id: null,
        subject_override: "",
        body_override: "",
        channel: "email",
      },
    ]);
  };

  const removeStep = (index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, step_number: i + 1 })));
  };

  const updateStep = (index: number, field: string, value: any) => {
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const handleSave = async () => {
    if (!user || !seqName.trim() || steps.length === 0) return;

    const campaignId = seqCampaignId === "none" ? null : seqCampaignId;

    if (editingSequence) {
      // Update sequence
      const { error } = await supabase
        .from("followup_sequences")
        .update({ name: seqName, campaign_id: campaignId, updated_at: new Date().toISOString() })
        .eq("id", editingSequence.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }

      // Delete old steps and insert new
      await supabase.from("followup_steps").delete().eq("sequence_id", editingSequence.id);
      const { error: stepsError } = await supabase.from("followup_steps").insert(
        steps.map((s) => ({
          ...s,
          sequence_id: editingSequence.id,
          script_id: s.script_id || null,
          template_id: s.template_id || null,
          content_asset_id: s.content_asset_id || null,
        }))
      );
      if (stepsError) { toast({ title: "Error saving steps", description: stepsError.message, variant: "destructive" }); return; }
      toast({ title: "Sequence updated" });
    } else {
      // Create sequence
      const { data: newSeq, error } = await supabase
        .from("followup_sequences")
        .insert({ user_id: user.id, name: seqName, campaign_id: campaignId })
        .select()
        .single();
      if (error || !newSeq) { toast({ title: "Error", description: error?.message, variant: "destructive" }); return; }

      const { error: stepsError } = await supabase.from("followup_steps").insert(
        steps.map((s) => ({
          ...s,
          sequence_id: newSeq.id,
          script_id: s.script_id || null,
          template_id: s.template_id || null,
          content_asset_id: s.content_asset_id || null,
        }))
      );
      if (stepsError) { toast({ title: "Error saving steps", description: stepsError.message, variant: "destructive" }); return; }
      toast({ title: "Sequence created" });
    }

    setDialogOpen(false);
    fetchAll();
  };

  const toggleActive = async (seq: Sequence) => {
    const { error } = await supabase
      .from("followup_sequences")
      .update({ is_active: !seq.is_active, updated_at: new Date().toISOString() })
      .eq("id", seq.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    fetchAll();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("followup_sequences").delete().eq("id", deleteId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Sequence deleted" });
    setDeleteId(null);
    fetchAll();
  };

  const enrollAllLeads = async () => {
    if (!user || !enrollSequenceId) return;
    setEnrolling(true);

    const seq = sequences.find((s) => s.id === enrollSequenceId);
    if (!seq) { setEnrolling(false); return; }

    // Get all leads
    const { data: leads, error: leadsErr } = await supabase
      .from("leads")
      .select("id")
      .eq("user_id", user.id);

    if (leadsErr || !leads) {
      toast({ title: "Error", description: leadsErr?.message || "No leads found", variant: "destructive" });
      setEnrolling(false);
      return;
    }

    // Get already enrolled lead IDs
    const { data: existing } = await supabase
      .from("followup_status")
      .select("lead_id")
      .eq("sequence_id", enrollSequenceId)
      .in("status", ["active", "paused"]);

    const enrolledIds = new Set((existing || []).map((e: any) => e.lead_id));
    const newLeads = leads.filter((l) => !enrolledIds.has(l.id));

    if (newLeads.length === 0) {
      toast({ title: "All leads already enrolled" });
      setEnrolling(false);
      setEnrollDialogOpen(false);
      return;
    }

    // Get first step delay
    const firstStep = seq.steps?.[0];
    const firstDelay = firstStep?.delay_days || 0;
    const nextDate = new Date(Date.now() + firstDelay * 86400000).toISOString();

    const inserts = newLeads.map((l) => ({
      user_id: user.id,
      lead_id: l.id,
      campaign_id: seq.campaign_id,
      sequence_id: enrollSequenceId,
      current_step: 0,
      next_followup_date: nextDate,
      status: "active",
    }));

    // Insert in batches of 100
    for (let i = 0; i < inserts.length; i += 100) {
      const batch = inserts.slice(i, i + 100);
      const { error } = await supabase.from("followup_status").insert(batch);
      if (error) {
        toast({ title: "Error enrolling", description: error.message, variant: "destructive" });
        setEnrolling(false);
        return;
      }
    }

    toast({ title: "Leads enrolled!", description: `${newLeads.length} leads added to sequence.` });
    setEnrolling(false);
    setEnrollDialogOpen(false);
    fetchAll();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Follow-Up Sequences</h1>
          <p className="text-muted-foreground">Automated multi-step outreach sequences</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Sequence
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading sequences…</p>
      ) : sequences.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">No sequences yet. Create an automated follow-up sequence to nurture your leads.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sequences.map((seq) => (
            <Card key={seq.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{seq.name}</h3>
                      <Badge variant={seq.is_active ? "default" : "secondary"}>
                        {seq.is_active ? "Active" : "Paused"}
                      </Badge>
                      {(seq._enrolledCount || 0) > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <Users className="h-3 w-3 mr-1" />
                          {seq._enrolledCount} enrolled
                        </Badge>
                      )}
                    </div>

                    {/* Visual step timeline */}
                    <div className="flex items-center gap-1 mt-3 flex-wrap">
                      {(seq.steps || []).map((step, i) => {
                        const Icon = CHANNEL_ICONS[step.channel] || Mail;
                        return (
                          <div key={i} className="flex items-center gap-1">
                            {i > 0 && (
                              <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
                                <ArrowDown className="h-3 w-3" />
                                <span>{step.delay_days}d</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs">
                              <Icon className="h-3 w-3" />
                              <span>Step {step.step_number}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex gap-1 ml-4">
                    <Button variant="outline" size="sm" onClick={() => {
                      setEnrollSequenceId(seq.id);
                      setEnrollDialogOpen(true);
                    }}>
                      <Users className="h-4 w-4 mr-1" />
                      Enroll
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => toggleActive(seq)}>
                      {seq.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(seq)}>
                      <ScrollText className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(seq.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Sequence Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSequence ? "Edit Sequence" : "New Sequence"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Sequence Name *</Label>
                <Input value={seqName} onChange={(e) => setSeqName(e.target.value)} placeholder="e.g. Cold Outreach - 5 Step" />
              </div>
              <div className="space-y-2">
                <Label>Campaign (optional)</Label>
                <Select value={seqCampaignId} onValueChange={setSeqCampaignId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No campaign</SelectItem>
                    {campaigns.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base">Steps</Label>
                <Button variant="outline" size="sm" onClick={addStep}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add Step
                </Button>
              </div>

              {steps.map((step, index) => {
                const Icon = CHANNEL_ICONS[step.channel] || Mail;
                return (
                  <Card key={index} className="border-dashed">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <Badge variant="outline">Step {index + 1}</Badge>
                        </div>
                        {steps.length > 1 && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeStep(index)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        )}
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Delay (days)</Label>
                          <Input
                            type="number"
                            min={0}
                            value={step.delay_days}
                            onChange={(e) => updateStep(index, "delay_days", parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Channel</Label>
                          <Select value={step.channel} onValueChange={(v) => updateStep(index, "channel", v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {Object.entries(CHANNEL_LABELS).map(([k, v]) => (
                                <SelectItem key={k} value={k}>{v}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Attach Asset</Label>
                          <Select value={step.content_asset_id || "none"} onValueChange={(v) => updateStep(index, "content_asset_id", v === "none" ? null : v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {assets.map((a) => (
                                <SelectItem key={a.id} value={a.id}>
                                  <span className="flex items-center gap-1">
                                    <Paperclip className="h-3 w-3" />
                                    {a.title}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Use Script</Label>
                          <Select value={step.script_id || "none"} onValueChange={(v) => updateStep(index, "script_id", v === "none" ? null : v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {scripts.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  <span className="flex items-center gap-1">
                                    <ScrollText className="h-3 w-3" />
                                    {s.name}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Use Template</Label>
                          <Select value={step.template_id || "none"} onValueChange={(v) => updateStep(index, "template_id", v === "none" ? null : v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {templates.map((t) => (
                                <SelectItem key={t.id} value={t.id}>
                                  <span className="flex items-center gap-1">
                                    <FileText className="h-3 w-3" />
                                    {t.name}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Subject Override</Label>
                        <Input
                          value={step.subject_override}
                          onChange={(e) => updateStep(index, "subject_override", e.target.value)}
                          placeholder="Leave blank to use script/template subject"
                          className="text-sm"
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!seqName.trim() || steps.length === 0}>
              {editingSequence ? "Save Changes" : "Create Sequence"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enroll Leads Dialog */}
      <AlertDialog open={enrollDialogOpen} onOpenChange={(open) => !open && setEnrollDialogOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enroll all leads?</AlertDialogTitle>
            <AlertDialogDescription>
              This will enroll all your leads (that aren't already enrolled) into this sequence. They will start receiving follow-up emails according to the step schedule.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={enrollAllLeads} disabled={enrolling}>
              {enrolling ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enrolling…</> : "Enroll All Leads"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete sequence?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this sequence and all its steps.</AlertDialogDescription>
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
