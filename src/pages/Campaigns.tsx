import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { CampaignCard } from "@/components/campaigns/CampaignCard";
import { CampaignDetailDialog } from "@/components/campaigns/CampaignDetailDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
}

interface CampaignRow {
  id: string;
  name: string;
  status: string;
  subject: string | null;
  created_at: string;
  updated_at: string;
  leadCount: number;
  emailStats?: { sent: number; openRate: number; replyRate: number; bounceRate: number };
}

export default function Campaigns() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<CampaignRow | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [form, setForm] = useState({ name: "", template_id: "" });
  const [detailCampaignId, setDetailCampaignId] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    if (!user) return;
    setLoading(true);

    const [campaignsRes, logsRes, clRes] = await Promise.all([
      supabase.from("campaigns").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("email_logs").select("campaign_id, opened_at, replied_at, bounced").eq("user_id", user.id),
      supabase.from("campaign_leads").select("campaign_id").eq("user_id", user.id),
    ]);

    if (campaignsRes.error) {
      toast({ title: "Error", description: campaignsRes.error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Count leads per campaign
    const leadCountMap = new Map<string, number>();
    (clRes.data || []).forEach((cl: any) => {
      leadCountMap.set(cl.campaign_id, (leadCountMap.get(cl.campaign_id) || 0) + 1);
    });

    // Email stats
    const statsMap = new Map<string, { sent: number; opened: number; replied: number; bounced: number }>();
    (logsRes.data || []).forEach((log: any) => {
      if (!log.campaign_id) return;
      if (!statsMap.has(log.campaign_id)) statsMap.set(log.campaign_id, { sent: 0, opened: 0, replied: 0, bounced: 0 });
      const s = statsMap.get(log.campaign_id)!;
      s.sent++;
      if (log.opened_at) s.opened++;
      if (log.replied_at) s.replied++;
      if (log.bounced) s.bounced++;
    });

    const mapped: CampaignRow[] = (campaignsRes.data || []).map((c: any) => {
      const s = statsMap.get(c.id);
      return {
        ...c,
        leadCount: leadCountMap.get(c.id) || 0,
        emailStats: s ? {
          sent: s.sent,
          openRate: s.sent > 0 ? Math.round((s.opened / s.sent) * 1000) / 10 : 0,
          replyRate: s.sent > 0 ? Math.round((s.replied / s.sent) * 1000) / 10 : 0,
          bounceRate: s.sent > 0 ? Math.round((s.bounced / s.sent) * 1000) / 10 : 0,
        } : undefined,
      };
    });

    setCampaigns(mapped);
    setLoading(false);

    // Fetch templates
    const { data: tData } = await supabase
      .from("email_templates")
      .select("id, name, subject, body")
      .eq("user_id", user.id);
    setTemplates(tData || []);
  };

  useEffect(() => { fetchCampaigns(); }, [user]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", template_id: "" });
    setDialogOpen(true);
  };

  const openEdit = (c: CampaignRow) => {
    setEditing(c);
    setForm({ name: c.name, template_id: c.template_id || "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user || !form.name.trim()) return;

    if (editing) {
      const { error } = await supabase
        .from("campaigns")
        .update({ name: form.name, updated_at: new Date().toISOString() })
        .eq("id", editing.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Campaign updated" });
    } else {
      const selectedT = templates.find(t => t.id === form.template_id);
      const { error } = await supabase
        .from("campaigns")
        .insert({ 
          user_id: user.id, 
          name: form.name,
          template_id: form.template_id || null,
          subject: selectedT?.subject || null,
          body: selectedT?.body || null
        });
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Campaign created" });
    }

    setDialogOpen(false);
    fetchCampaigns();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("campaigns").delete().eq("id", deleteId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Campaign deleted" });
    setDeleteId(null);
    fetchCampaigns();
  };

  const toggleStatus = async (c: CampaignRow) => {
    const newStatus = c.status === "active" ? "paused" : "active";
    const { error } = await supabase
      .from("campaigns")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", c.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    fetchCampaigns();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground">Create campaigns, add leads, compose emails, and send</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Campaign
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading campaigns…</p>
      ) : campaigns.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No campaigns yet. Create your first campaign to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onEdit={() => openEdit(campaign)}
              onDelete={() => setDeleteId(campaign.id)}
              onToggleStatus={() => toggleStatus(campaign)}
              onOpen={() => setDetailCampaignId(campaign.id)}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Name Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Rename Campaign" : "New Campaign"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ name: e.target.value })}
                placeholder="e.g. Q1 Real Estate Outreach"
                autoFocus
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="template">Template (Optional)</Label>
              <Select 
                value={form.template_id} 
                onValueChange={(v) => setForm({ ...form, template_id: v })}
              >
                <SelectTrigger id="template">
                  <SelectValue placeholder="Select a starting template..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No template</SelectItem>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">
                Initializing with a template will pre-fill the email subject and body.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name.trim()}>
              {editing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Campaign Detail Dialog */}
      <CampaignDetailDialog
        open={!!detailCampaignId}
        onOpenChange={(open) => !open && setDetailCampaignId(null)}
        campaignId={detailCampaignId}
        onRefresh={fetchCampaigns}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete campaign?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this campaign, its leads, and all associated email logs.</AlertDialogDescription>
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
