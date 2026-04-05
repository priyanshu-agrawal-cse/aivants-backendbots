import { useEffect, useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, Send, Loader2, Users, Mail, Search, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Lead {
  id: string;
  first_name: string;
  last_name: string | null;
  company_name: string | null;
  email: string;
}

interface CampaignDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string | null;
  onRefresh: () => void;
}

export function CampaignDetailDialog({ open, onOpenChange, campaignId, onRefresh }: CampaignDetailDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [campaign, setCampaign] = useState<any>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [campaignLeads, setCampaignLeads] = useState<Lead[]>([]);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [leadSearch, setLeadSearch] = useState("");
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addLeadsOpen, setAddLeadsOpen] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  const fetchCampaignData = useCallback(async () => {
    if (!campaignId || !user) return;

    const [campaignRes, leadsRes] = await Promise.all([
      supabase.from("campaigns").select("*").eq("id", campaignId).single(),
      supabase.from("campaign_leads").select("lead_id").eq("campaign_id", campaignId),
    ]);

    if (campaignRes.data) {
      setCampaign(campaignRes.data);
      setSubject(campaignRes.data.subject || "");
      setBody((campaignRes.data as any).body || "");
      setSelectedTemplateId(campaignRes.data.template_id || "");
    }

    if (leadsRes.data && leadsRes.data.length > 0) {
      const leadIds = leadsRes.data.map((cl: any) => cl.lead_id);
      const { data: leadDetails } = await supabase
        .from("leads")
        .select("id, first_name, last_name, company_name, email")
        .in("id", leadIds);
      setCampaignLeads(leadDetails || []);
    } else {
      setCampaignLeads([]);
    }

    // Fetch templates
    const { data: tData } = await supabase
      .from("email_templates")
      .select("id, name, subject, body")
      .eq("user_id", user.id);
    setTemplates(tData || []);
  }, [campaignId, user]);

  useEffect(() => {
    if (open && campaignId) {
      fetchCampaignData();
    }
  }, [open, campaignId, fetchCampaignData]);

  const fetchAllLeads = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("leads")
      .select("id, first_name, last_name, company_name, email")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(500);
    setAllLeads(data || []);
  };

  const openAddLeads = () => {
    fetchAllLeads();
    setSelectedLeadIds(new Set());
    setLeadSearch("");
    setAddLeadsOpen(true);
  };

  const handleAddLeads = async () => {
    if (!campaignId || !user || selectedLeadIds.size === 0) return;

    const existingIds = new Set(campaignLeads.map(l => l.id));
    const newIds = [...selectedLeadIds].filter(id => !existingIds.has(id));

    if (newIds.length === 0) {
      toast({ title: "All selected leads are already in this campaign" });
      return;
    }

    const rows = newIds.map(lead_id => ({
      campaign_id: campaignId,
      lead_id,
      user_id: user.id,
    }));

    const { error } = await supabase.from("campaign_leads").insert(rows);
    if (error) {
      toast({ title: "Error adding leads", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: `${newIds.length} lead(s) added` });
    setAddLeadsOpen(false);
    fetchCampaignData();
    onRefresh();
  };

  const handleRemoveLead = async (leadId: string) => {
    if (!campaignId) return;
    const { error } = await supabase
      .from("campaign_leads")
      .delete()
      .eq("campaign_id", campaignId)
      .eq("lead_id", leadId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setCampaignLeads(prev => prev.filter(l => l.id !== leadId));
    onRefresh();
  };

  const handleSaveEmail = async () => {
    if (!campaignId) return;
    setSaving(true);
    const { error } = await supabase
      .from("campaigns")
      .update({ 
        subject: subject || null, 
        body, 
        template_id: selectedTemplateId || null,
        updated_at: new Date().toISOString() 
      } as any)
      .eq("id", campaignId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Campaign email saved" });
      onRefresh();
    }
    setSaving(false);
  };

  const handleStartCampaign = async () => {
    if (!campaignId || !user) return;
    if (!subject.trim() || !body.trim()) {
      toast({ title: "Set subject and body first", variant: "destructive" });
      return;
    }
    if (campaignLeads.length === 0) {
      toast({ title: "Add leads to this campaign first", variant: "destructive" });
      return;
    }

    // Filter out placeholder emails
    const validLeads = campaignLeads.filter(l => !l.email.includes("@placeholder.local"));
    if (validLeads.length === 0) {
      toast({ title: "No leads with valid emails", description: "All leads have placeholder emails", variant: "destructive" });
      return;
    }

    setSending(true);
    let successCount = 0;
    let failCount = 0;

    // Save email content first
    await supabase
      .from("campaigns")
      .update({ subject, body, status: "active", updated_at: new Date().toISOString() } as any)
      .eq("id", campaignId);

    // Send to each lead with valid email
    for (const lead of validLeads) {
      // Simple variable replacement
      const personalizedBody = body
        .replace(/\{first_name\}/gi, lead.first_name)
        .replace(/\{last_name\}/gi, lead.last_name || "")
        .replace(/\{company_name\}/gi, lead.company_name || "")
        .replace(/\{email\}/gi, lead.email);

      const personalizedSubject = subject
        .replace(/\{first_name\}/gi, lead.first_name)
        .replace(/\{last_name\}/gi, lead.last_name || "")
        .replace(/\{company_name\}/gi, lead.company_name || "");

      try {
        const { data, error } = await supabase.functions.invoke("send-email", {
          body: {
            to: lead.email,
            subject: personalizedSubject,
            body: personalizedBody,
            lead_id: lead.id,
            campaign_id: campaignId,
          },
        });

        if (error || data?.error) {
          failCount++;
        } else {
          successCount++;
        }
      } catch {
        failCount++;
      }
    }

    setSending(false);
    toast({
      title: `Campaign sent`,
      description: `${successCount} sent, ${failCount} failed out of ${validLeads.length} leads`,
    });

    onRefresh();
    fetchCampaignData();
  };

  const handleApplyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setBody(template.body);
      setSelectedTemplateId(templateId);
    } else if (templateId === "none") {
      setSelectedTemplateId("");
    }
  };

  const filteredAllLeads = allLeads.filter(l => {
    const term = leadSearch.toLowerCase();
    if (!term) return true;
    return (
      l.first_name.toLowerCase().includes(term) ||
      (l.last_name || "").toLowerCase().includes(term) ||
      (l.company_name || "").toLowerCase().includes(term) ||
      l.email.toLowerCase().includes(term)
    );
  });

  const toggleLeadSelection = (id: string) => {
    setSelectedLeadIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  if (!campaign) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">{campaign.name}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="email" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="email" className="gap-1.5">
              <Mail className="h-3.5 w-3.5" /> Email Content
            </TabsTrigger>
            <TabsTrigger value="leads" className="gap-1.5">
              <Users className="h-3.5 w-3.5" /> Leads ({campaignLeads.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="flex-1 overflow-auto space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Email Template</Label>
              <Select value={selectedTemplateId || "none"} onValueChange={handleApplyTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template to apply..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No template (custom)</SelectItem>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Subject Line</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Hi {first_name}, quick question about {company_name}"
              />
              <p className="text-xs text-muted-foreground">
                Use {"{first_name}"}, {"{last_name}"}, {"{company_name}"} for personalization
              </p>
            </div>
            <div className="space-y-2">
              <Label>Email Body</Label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your email body here..."
                rows={10}
                className="text-sm"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={handleSaveEmail} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Save Draft
              </Button>
              <Button onClick={handleStartCampaign} disabled={sending || campaignLeads.length === 0}>
                {sending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...</>
                ) : (
                  <><Send className="h-4 w-4 mr-2" /> Start Campaign ({campaignLeads.filter(l => !l.email.includes("@placeholder.local")).length} emails)</>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="leads" className="flex-1 overflow-hidden flex flex-col pt-2">
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm text-muted-foreground">
                {campaignLeads.length} lead{campaignLeads.length !== 1 ? "s" : ""} in this campaign
              </p>
              <Button size="sm" onClick={openAddLeads}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Leads
              </Button>
            </div>

            {campaignLeads.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>No leads added yet</p>
                <p className="text-xs mt-1">Add leads to start sending emails</p>
              </div>
            ) : (
              <ScrollArea className="flex-1">
                <div className="space-y-1.5">
                  {campaignLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm"
                    >
                      <div className="min-w-0">
                        <div className="font-medium truncate">
                          {lead.first_name} {lead.last_name || ""}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {lead.email}
                          {lead.company_name && ` · ${lead.company_name}`}
                        </div>
                        {lead.email.includes("@placeholder.local") && (
                          <Badge variant="outline" className="text-[10px] mt-1 text-warning border-warning/30">
                            No valid email
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveLead(lead.id)}
                        className="shrink-0 h-7 w-7 p-0"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>

        {/* Add Leads Sub-Dialog */}
        <Dialog open={addLeadsOpen} onOpenChange={setAddLeadsOpen}>
          <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Add Leads to Campaign</DialogTitle>
            </DialogHeader>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search leads..."
                value={leadSearch}
                onChange={(e) => setLeadSearch(e.target.value)}
              />
            </div>
            {/* Select All */}
            {(() => {
              const selectableLeads = filteredAllLeads.filter(l => !campaignLeads.some(cl => cl.id === l.id));
              const allSelected = selectableLeads.length > 0 && selectableLeads.every(l => selectedLeadIds.has(l.id));
              return selectableLeads.length > 0 ? (
                <label className="flex items-center gap-2 px-1 py-1.5 text-sm cursor-pointer">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={() => {
                      if (allSelected) {
                        setSelectedLeadIds(new Set());
                      } else {
                        setSelectedLeadIds(new Set(selectableLeads.map(l => l.id)));
                      }
                    }}
                  />
                  <span className="font-medium">Select All ({selectableLeads.length})</span>
                </label>
              ) : null;
            })()}
            <ScrollArea className="flex-1 max-h-[50vh]">
              <div className="space-y-1">
                {filteredAllLeads.map((lead) => {
                  const alreadyAdded = campaignLeads.some(cl => cl.id === lead.id);
                  return (
                    <label
                      key={lead.id}
                      className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm cursor-pointer hover:bg-accent/50 transition-colors ${
                        alreadyAdded ? "opacity-50" : ""
                      }`}
                    >
                      <Checkbox
                        checked={selectedLeadIds.has(lead.id) || alreadyAdded}
                        disabled={alreadyAdded}
                        onCheckedChange={() => toggleLeadSelection(lead.id)}
                      />
                      <div className="min-w-0">
                        <div className="font-medium truncate">
                          {lead.first_name} {lead.last_name || ""}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {lead.email}{lead.company_name ? ` · ${lead.company_name}` : ""}
                        </div>
                      </div>
                      {alreadyAdded && (
                        <Badge variant="secondary" className="ml-auto text-[10px] shrink-0">Added</Badge>
                      )}
                    </label>
                  );
                })}
                {filteredAllLeads.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-8">No leads found</p>
                )}
              </div>
            </ScrollArea>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setAddLeadsOpen(false)}>Cancel</Button>
              <Button onClick={handleAddLeads} disabled={selectedLeadIds.size === 0}>
                Add {selectedLeadIds.size} Lead{selectedLeadIds.size !== 1 ? "s" : ""}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
