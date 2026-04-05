import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Loader2, Save, Clock, Key } from "lucide-react";

export function SecuritySettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    two_factor_enabled: false,
    session_timeout_minutes: 60,
    ip_whitelist: "",
  });

  useEffect(() => {
    if (!user) return;
    supabase.from("security_settings" as any).select("*").eq("user_id", user.id).maybeSingle().then(({ data }: any) => {
      if (data) {
        setSettings({
          two_factor_enabled: data.two_factor_enabled || false,
          session_timeout_minutes: data.session_timeout_minutes || 60,
          ip_whitelist: (data.ip_whitelist || []).join(", "),
        });
      }
      setLoading(false);
    });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const ips = settings.ip_whitelist.split(",").map(s => s.trim()).filter(Boolean);
      const { error } = await supabase.from("security_settings" as any).upsert({
        user_id: user.id,
        two_factor_enabled: settings.two_factor_enabled,
        session_timeout_minutes: settings.session_timeout_minutes,
        ip_whitelist: ips,
        updated_at: new Date().toISOString(),
      } as any, { onConflict: "user_id" });
      if (error) throw error;
      toast({ title: "Security settings saved!" });
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    setSaving(false);
  };

  if (loading) return <div className="flex items-center gap-2 text-muted-foreground py-8"><Loader2 className="h-4 w-4 animate-spin" />Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Shield className="h-6 w-6 text-primary" />Security</h1>
        <p className="text-muted-foreground text-sm">Manage authentication and access security controls</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Authentication</CardTitle><CardDescription>Two-factor and session controls</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-md border p-3">
            <div><p className="text-sm font-medium">Two-Factor Authentication</p><p className="text-xs text-muted-foreground">Add an extra layer of security to your account</p></div>
            <Switch checked={settings.two_factor_enabled} onCheckedChange={v => setSettings({ ...settings, two_factor_enabled: v })} />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Clock className="h-4 w-4" />Session Timeout (minutes)</Label>
            <Input type="number" value={settings.session_timeout_minutes} onChange={e => setSettings({ ...settings, session_timeout_minutes: Number(e.target.value) })} min={5} max={1440} />
            <p className="text-xs text-muted-foreground">Auto-logout after period of inactivity (5–1440 min)</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Key className="h-5 w-5" />Access Control</CardTitle><CardDescription>IP restrictions and API key management</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>IP Whitelist</Label>
            <Input value={settings.ip_whitelist} onChange={e => setSettings({ ...settings, ip_whitelist: e.target.value })} placeholder="e.g. 192.168.1.1, 10.0.0.0/8" />
            <p className="text-xs text-muted-foreground">Comma-separated IPs. Leave empty to allow all.</p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
        Save Security Settings
      </Button>
    </div>
  );
}
