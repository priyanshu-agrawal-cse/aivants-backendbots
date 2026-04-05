import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Link2, Loader2, Save, ExternalLink } from "lucide-react";

const integrations = [
  { id: "google_sheets", name: "Google Sheets", desc: "Sync leads and data with Google Sheets", category: "Productivity" },
  { id: "slack", name: "Slack", desc: "Send notifications to Slack channels", category: "Messaging" },
  { id: "whatsapp", name: "WhatsApp API", desc: "Send messages via WhatsApp Business", category: "Messaging" },
  { id: "zapier", name: "Zapier", desc: "Connect to 5000+ apps via Zapier", category: "Automation" },
  { id: "make", name: "Make.com", desc: "Advanced automation workflows", category: "Automation" },
  { id: "firecrawl", name: "Firecrawl", desc: "AI-powered web scraping and research", category: "Data" },
];

interface IntegrationRow {
  id?: string;
  integration_name: string;
  api_key: string;
  is_connected: boolean;
}

export function IntegrationSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Record<string, IntegrationRow>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("integration_settings" as any).select("*").eq("user_id", user.id).then(({ data: rows }: any) => {
      const map: Record<string, IntegrationRow> = {};
      (rows || []).forEach((r: any) => { map[r.integration_name] = r; });
      setData(map);
      setLoading(false);
    });
  }, [user]);

  const handleSave = async (integrationId: string) => {
    if (!user) return;
    setSavingId(integrationId);
    const current = data[integrationId] || { integration_name: integrationId, api_key: "", is_connected: false };
    try {
      const { error } = await supabase.from("integration_settings" as any).upsert({
        user_id: user.id,
        integration_name: integrationId,
        api_key: current.api_key || null,
        is_connected: current.is_connected,
        connected_at: current.is_connected ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      } as any, { onConflict: "user_id,integration_name" });
      if (error) throw error;
      toast({ title: `${integrations.find(i => i.id === integrationId)?.name} saved!` });
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    setSavingId(null);
  };

  const updateField = (id: string, field: string, value: any) => {
    setData(prev => ({
      ...prev,
      [id]: { ...(prev[id] || { integration_name: id, api_key: "", is_connected: false }), [field]: value },
    }));
  };

  if (loading) return <div className="flex items-center gap-2 text-muted-foreground py-8"><Loader2 className="h-4 w-4 animate-spin" />Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Link2 className="h-6 w-6 text-primary" />Integrations</h1>
        <p className="text-muted-foreground text-sm">Connect third-party services to extend Aivants</p>
      </div>

      {integrations.map(integration => {
        const row = data[integration.id];
        return (
          <Card key={integration.id}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{integration.name}</p>
                      <Badge variant="outline" className="text-xs">{integration.category}</Badge>
                      {row?.is_connected && <Badge variant="default" className="text-xs">Connected</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{integration.desc}</p>
                  </div>
                </div>
                <Switch checked={row?.is_connected || false} onCheckedChange={v => { updateField(integration.id, "is_connected", v); }} />
              </div>
              {(row?.is_connected || row?.api_key) && (
                <div className="space-y-3 pt-2 border-t">
                  <div className="space-y-1">
                    <Label className="text-xs">API Key</Label>
                    <Input type="password" value={row?.api_key || ""} onChange={e => updateField(integration.id, "api_key", e.target.value)} placeholder="Enter API key" className="text-sm" />
                  </div>
                  <Button size="sm" onClick={() => handleSave(integration.id)} disabled={savingId === integration.id}>
                    {savingId === integration.id ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
                    Save
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
