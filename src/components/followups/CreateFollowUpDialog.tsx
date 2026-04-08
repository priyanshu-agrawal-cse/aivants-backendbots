import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, CalendarClock, Loader2, GripVertical, Paperclip, Phone, Bot } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

interface Lead { id: string; first_name: string; last_name: string | null; email: string; company_name: string | null; }
interface Sequence { id: string; name: string; followup_type: string; }
interface Asset { id: string; title: string; type: string; }
interface Template { id: string; name: string; subject: string; body: string; }

interface StepDraft {
  delay_days: number;
  channel: string;
  subject_override: string;
  body_override: string;
  action_type: string;
  notes: string;
  content_asset_id: string | null;
  template_id: string | null;
  script_id: string | null;
  voice_persona_id: string | null;
  voice_from_number: string | null;
}

const FOLLOWUP_TYPES = [
  { value: "cold_outreach", label: "Cold Outreach" },
  { value: "proposal_followup", label: "Proposal Follow-Up" },
  { value: "meeting_reminder", label: "Meeting Reminder" },
  { value: "payment_reminder", label: "Payment Reminder" },
  { value: "contract_renewal", label: "Contract Renewal" },
  { value: "client_checkin", label: "Client Check-In" },
  { value: "custom", label: "Custom" },
];

const STOP_CONDITIONS = [
  { value: "none", label: "No condition" },
  { value: "reply", label: "Stop on reply" },
  { value: "meeting_booked", label: "Stop on meeting booked" },
  { value: "payment_completed", label: "Stop on payment completed" },
  { value: "manual", label: "Stop manually only" },
];

interface CreateFollowUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leads: Lead[];
  sequences: Sequence[];
  assets: Asset[];
  templates: Template[];
  defaultCategory: string;
  onSubmit: (data: CreateFollowUpData) => Promise<void>;
}

export interface CreateFollowUpData {
  category: string;
  lead_id: string;
  sequence_id: string;
  followup_type: string;
  purpose: string;
  sender_name: string;
  sender_email: string;
  start_date: string;
  end_date: string;
  condition_stop_on: string;
  notes: string;
  // Manual client fields
  client_name: string;
  client_email: string;
  client_company: string;
  // Custom steps (when no sequence selected)
  custom_steps: StepDraft[];
}

const emptyStep: StepDraft = {
  delay_days: 1,
  channel: "email",
  subject_override: "",
  body_override: "",
  action_type: "email",
  notes: "",
  content_asset_id: null,
  template_id: null,
  script_id: null,
  voice_persona_id: null,
  voice_from_number: null,
};

export function CreateFollowUpDialog({
  open, onOpenChange, leads, sequences, assets, templates, defaultCategory, onSubmit,
}: CreateFollowUpDialogProps) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [voiceNumbers, setVoiceNumbers] = useState<any[]>([]);
  const [leadSource, setLeadSource] = useState<"existing" | "manual">("existing");
  const [form, setForm] = useState<CreateFollowUpData>({
    category: defaultCategory,
    lead_id: "",
    sequence_id: "",
    followup_type: defaultCategory === "client" ? "payment_reminder" : "cold_outreach",
    purpose: "",
    sender_name: "",
    sender_email: "",
    start_date: "",
    end_date: "",
    condition_stop_on: "none",
    notes: "",
    client_name: "",
    client_email: "",
    client_company: "",
    custom_steps: [{ ...emptyStep }],
  });

  useEffect(() => {
    const fetchVoiceNumbers = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("voice_numbers")
        .select("phone_number")
        .eq("user_id", user.id)
        .eq("status", "active");
      setVoiceNumbers(data || []);
    };
    fetchVoiceNumbers();
  }, [user]);

  const [useCustomSteps, setUseCustomSteps] = useState(false);

  const updateForm = (field: keyof CreateFollowUpData, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const addStep = () => {
    const lastDay = form.custom_steps.length > 0 ? form.custom_steps[form.custom_steps.length - 1].delay_days : 0;
    setForm(prev => ({
      ...prev,
      custom_steps: [...prev.custom_steps, { ...emptyStep, delay_days: lastDay + 3 }],
    }));
  };

  const removeStep = (index: number) => {
    setForm(prev => ({
      ...prev,
      custom_steps: prev.custom_steps.filter((_, i) => i !== index),
    }));
  };

  const updateStep = (index: number, field: keyof StepDraft, value: any) => {
    setForm(prev => ({
      ...prev,
      custom_steps: prev.custom_steps.map((s, i) => i === index ? { ...s, [field]: value } : s),
    }));
  };

  const handleApplyTemplateToStep = (index: number, templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setForm(prev => ({
        ...prev,
        custom_steps: prev.custom_steps.map((s, i) => i === index ? { 
          ...s, 
          template_id: templateId,
          subject_override: template.subject,
          body_override: template.body
        } : s),
      }));
    } else if (templateId === "none") {
      updateStep(index, "template_id", null);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onSubmit({ ...form, category: defaultCategory });
      onOpenChange(false);
      // Reset
      setForm({
        category: defaultCategory,
        lead_id: "",
        sequence_id: "",
        followup_type: defaultCategory === "client" ? "payment_reminder" : "cold_outreach",
        purpose: "",
        sender_name: "",
        sender_email: "",
        start_date: "",
        end_date: "",
        condition_stop_on: "none",
        notes: "",
        client_name: "",
        client_email: "",
        client_company: "",
        custom_steps: [{ ...emptyStep }],
      });
      setLeadSource("existing");
      setUseCustomSteps(false);
    } finally {
      setSaving(false);
    }
  };

  const canSubmit = (leadSource === "existing" ? !!form.lead_id : !!form.client_name && !!form.client_email)
    && (!!form.sequence_id || (useCustomSteps && form.custom_steps.length > 0));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Create {defaultCategory === "client" ? "Client" : "Lead"} Follow-Up
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Contact Source */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Contact</Label>
            <Tabs value={leadSource} onValueChange={(v) => setLeadSource(v as any)}>
              <TabsList className="w-full">
                <TabsTrigger value="existing" className="flex-1">Select Existing Lead</TabsTrigger>
                <TabsTrigger value="manual" className="flex-1">+ Add Manually</TabsTrigger>
              </TabsList>
              <TabsContent value="existing" className="mt-3">
                <Select value={form.lead_id} onValueChange={(v) => updateForm("lead_id", v)}>
                  <SelectTrigger><SelectValue placeholder="Search and select a lead..." /></SelectTrigger>
                  <SelectContent>
                    {leads.map(l => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.first_name} {l.last_name || ""} {l.company_name ? `(${l.company_name})` : ""} — {l.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TabsContent>
              <TabsContent value="manual" className="mt-3 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Client Name *</Label>
                    <Input value={form.client_name} onChange={e => updateForm("client_name", e.target.value)} placeholder="John Smith" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Company</Label>
                    <Input value={form.client_company} onChange={e => updateForm("client_company", e.target.value)} placeholder="Alpha Realty" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Email *</Label>
                  <Input type="email" value={form.client_email} onChange={e => updateForm("client_email", e.target.value)} placeholder="john@example.com" />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Follow-Up Details */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Follow-Up Type *</Label>
              <Select value={form.followup_type} onValueChange={(v) => updateForm("followup_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FOLLOWUP_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Purpose</Label>
              <Input value={form.purpose} onChange={e => updateForm("purpose", e.target.value)} placeholder="e.g. Payment reminder for Q2 invoice" />
            </div>
          </div>

          {/* Sender */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Sender Name</Label>
              <Input value={form.sender_name} onChange={e => updateForm("sender_name", e.target.value)} placeholder="Rahul" />
            </div>
            <div className="space-y-2">
              <Label>Sender Email</Label>
              <Input type="email" value={form.sender_email} onChange={e => updateForm("sender_email", e.target.value)} placeholder="rahul@company.com" />
            </div>
          </div>

          {/* Dates */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" value={form.start_date} onChange={e => updateForm("start_date", e.target.value)} />
              <p className="text-xs text-muted-foreground">Leave blank to start immediately</p>
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input type="date" value={form.end_date} onChange={e => updateForm("end_date", e.target.value)} />
              <p className="text-xs text-muted-foreground">Optional deadline for the sequence</p>
            </div>
          </div>

          {/* Sequence Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Sequence</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUseCustomSteps(!useCustomSteps)}
                className="text-xs"
              >
                {useCustomSteps ? "Use existing sequence" : "Create custom steps"}
              </Button>
            </div>

            {!useCustomSteps ? (
              <Select value={form.sequence_id} onValueChange={(v) => updateForm("sequence_id", v)}>
                <SelectTrigger><SelectValue placeholder="Select a sequence..." /></SelectTrigger>
                <SelectContent>
                  {sequences.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Define your follow-up schedule</p>
                  <Button variant="outline" size="sm" onClick={addStep}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Step
                  </Button>
                </div>
                {form.custom_steps.map((step, index) => (
                  <Card key={index} className="border-dashed">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <Badge variant="outline">Step {index + 1}</Badge>
                        </div>
                        {form.custom_steps.length > 1 && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeStep(index)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        )}
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Day</Label>
                          <Input
                            type="number"
                            min={0}
                            max={360}
                            value={step.delay_days}
                            onChange={e => updateStep(index, "delay_days", parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Action Type</Label>
                          <Select value={step.action_type} onValueChange={v => updateStep(index, "action_type", v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="email">Send Email</SelectItem>
                              <SelectItem value="voice">AI Voice Call</SelectItem>
                              <SelectItem value="reminder">Task Reminder</SelectItem>
                              <SelectItem value="telegram">Telegram Alert</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Attach Asset</Label>
                          <Select
                            value={step.content_asset_id || "none"}
                            onValueChange={v => updateStep(index, "content_asset_id", v === "none" ? null : v)}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {assets.map(a => (
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

                      {step.action_type === "email" && (
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Use Template</Label>
                            <Select 
                              value={step.template_id || "none"} 
                              onValueChange={v => handleApplyTemplateToStep(index, v)}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Optional: Select a template" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Custom content</SelectItem>
                                {templates.map(t => (
                                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Email Subject</Label>
                            <Input
                              value={step.subject_override}
                              onChange={e => updateStep(index, "subject_override", e.target.value)}
                              placeholder="e.g. Just checking in, {first_name}"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Email Body</Label>
                            <Textarea
                              value={step.body_override}
                              onChange={e => updateStep(index, "body_override", e.target.value)}
                              placeholder={"Hi {first_name},\n\nJust wanted to check if you had a chance to review...\n\nBest regards"}
                              rows={4}
                              className="font-mono text-xs"
                            />
                            <p className="text-xs text-muted-foreground">
                              Variables: {"{first_name}"} {"{company_name}"} {"{industry}"}
                            </p>
                          </div>
                        </div>
                      )}

                      {step.action_type === "voice" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-in fade-in duration-300">
                          <div className="space-y-1">
                            <Label className="text-xs">AI Agent Voice</Label>
                            <Select 
                              value={step.voice_persona_id || "none"} 
                              onValueChange={v => updateStep(index, "voice_persona_id", v === "none" ? null : v)}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Select Voice Profile" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Pick Voice Profile...</SelectItem>
                                <SelectItem value="sales_executive">Sales Executive</SelectItem>
                                <SelectItem value="customer_support">Customer Support</SelectItem>
                                <SelectItem value="appointment_setter">Appointment Setter</SelectItem>
                                <SelectItem value="technical_advisor">Technical Advisor</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">From Number (Optional)</Label>
                            <Select 
                              value={step.voice_from_number || "fallback"} 
                              onValueChange={v => updateStep(index, "voice_from_number", v === "fallback" ? null : v)}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="fallback">Use Campaign Default</SelectItem>
                                {voiceNumbers.map((v) => (
                                  <SelectItem key={v.phone_number} value={v.phone_number}>{v.phone_number}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="md:col-span-2 space-y-1">
                            <Label className="text-xs font-semibold flex items-center gap-2">
                              <Bot className="w-3 h-3 text-primary" /> Call Transcript/Context
                            </Label>
                            <Textarea
                              value={step.body_override}
                              onChange={e => updateStep(index, "body_override", e.target.value)}
                              placeholder={"Explain what the AI should talk about...\ne.g. Hi {first_name}, I'm calling from Aivants regarding..."}
                              rows={3}
                              className="text-xs"
                            />
                          </div>
                        </div>
                      )}

                      <div className="space-y-1">
                        <Label className="text-xs">Step Notes</Label>
                        <Input
                          value={step.notes}
                          onChange={e => updateStep(index, "notes", e.target.value)}
                          placeholder="Internal notes for this step"
                          className="text-xs"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Auto-Stop Condition */}
          <div className="space-y-2">
            <Label>Auto-Stop Condition</Label>
            <Select value={form.condition_stop_on} onValueChange={(v) => updateForm("condition_stop_on", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STOP_CONDITIONS.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={form.notes}
              onChange={e => updateForm("notes", e.target.value)}
              placeholder="Any additional context for this follow-up..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving || !canSubmit}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CalendarClock className="h-4 w-4 mr-2" />}
            Create Follow-Up
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
