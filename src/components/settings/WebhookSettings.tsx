import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Webhook, Save, Loader2, Copy, RefreshCw, Shield } from "lucide-react";
import { useEffect } from "react";

export function WebhookSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [webhookSecret, setWebhookSecret] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settingsId, setSettingsId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data) { setWebhookSecret(data.webhook_secret || ""); setSettingsId(data.id); }
      setLoading(false);
    });
  }, [user]);

  const generateSecret = () => {
    const arr = new Uint8Array(32);
    crypto.getRandomValues(arr);
    return Array.from(arr, b => b.toString(16).padStart(2, "0")).join("");
  };

  const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text); toast({ title: "Copied!" }); };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      if (settingsId) {
        const { error } = await supabase.from("user_settings").update({ webhook_secret: webhookSecret || null, updated_at: new Date().toISOString() }).eq("id", settingsId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("user_settings").insert({ user_id: user.id, webhook_secret: webhookSecret || null } as any).select().single();
        if (error) throw error;
        setSettingsId(data.id);
      }
      toast({ title: "Webhook secret saved!" });
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    setSaving(false);
  };

  if (loading) return <div className="flex items-center gap-2 text-muted-foreground py-8"><Loader2 className="h-4 w-4 animate-spin" />Loading…</div>;

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/inbound-reply-webhook`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Webhook className="h-6 w-6 text-primary" />Webhooks</h1>
        <p className="text-muted-foreground text-sm">Secure your inbound webhooks and manage external connections</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Webhook Security</CardTitle>
          <CardDescription>External services must include the secret as an <code className="text-xs bg-muted px-1 rounded">x-webhook-secret</code> header</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Webhook Secret</Label>
            <div className="flex gap-2">
              <Input value={webhookSecret} onChange={e => setWebhookSecret(e.target.value)} placeholder="Enter or generate a webhook secret" className="font-mono text-sm" />
              <Button variant="outline" size="icon" onClick={() => setWebhookSecret(generateSecret())} title="Generate"><RefreshCw className="h-4 w-4" /></Button>
              {webhookSecret && <Button variant="outline" size="icon" onClick={() => copyToClipboard(webhookSecret)} title="Copy"><Copy className="h-4 w-4" /></Button>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Webhook URL</Label>
            <div className="flex gap-2">
              <Input value={webhookUrl} disabled className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={() => copyToClipboard(webhookUrl)} title="Copy"><Copy className="h-4 w-4" /></Button>
            </div>
            <p className="text-xs text-muted-foreground">Use this URL in SendGrid Inbound Parse or other webhook providers.</p>
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Webhook Secret
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Supported Webhook Events</CardTitle>
          <CardDescription>Events that external systems can subscribe to</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {["lead_created", "client_created", "proposal_sent", "email_opened", "email_replied", "payment_received", "meeting_booked", "campaign_completed"].map(evt => (
              <div key={evt} className="flex items-center gap-2 p-2 rounded border text-sm"><code className="text-xs font-mono text-primary">{evt}</code></div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
