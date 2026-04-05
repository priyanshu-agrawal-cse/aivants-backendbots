import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Save, Loader2 } from "lucide-react";

const providers = [
  { value: "lovable", label: "Lovable AI", description: "Built-in, no API key needed" },
  { value: "openai", label: "OpenAI", description: "GPT-5, GPT-5-mini" },
  { value: "anthropic", label: "Claude", description: "Claude models" },
  { value: "gemini", label: "Gemini", description: "Google Gemini models" },
  { value: "groq", label: "Groq", description: "Fast inference" },
  { value: "custom", label: "Custom API", description: "Self-hosted / custom endpoint" },
];

export function AISettingsSection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    provider: "lovable",
    api_key: "",
    model_name: "google/gemini-3-flash-preview",
    temperature: 0.7,
    max_tokens: 4096,
    widget_enabled: true,
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("ai_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const d = data as any;
          setSettings({
            provider: d.provider || "lovable",
            api_key: d.api_key || "",
            model_name: d.model_name || "google/gemini-3-flash-preview",
            temperature: Number(d.temperature) || 0.7,
            max_tokens: d.max_tokens || 4096,
            widget_enabled: d.widget_enabled ?? true,
          });
        }
        setLoading(false);
      });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        provider: settings.provider,
        api_key: settings.provider === "lovable" ? null : settings.api_key || null,
        model_name: settings.model_name,
        temperature: settings.temperature,
        max_tokens: settings.max_tokens,
        widget_enabled: settings.widget_enabled,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from("ai_settings").upsert(payload as any, { onConflict: "user_id" });
      if (error) throw error;
      toast({ title: "AI Settings saved!" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  if (loading) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          AI Settings
        </CardTitle>
        <CardDescription>Configure the AI assistant provider, model, and behavior. Changing provider preserves all your data and history.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label>Provider</Label>
          <Select value={settings.provider} onValueChange={v => setSettings({ ...settings, provider: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {providers.map(p => (
                <SelectItem key={p.value} value={p.value}>
                  <div className="flex items-center gap-2">
                    {p.label}
                    {p.value === "lovable" && <Badge variant="secondary" className="text-xs">Recommended</Badge>}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {settings.provider !== "lovable" && (
          <div className="space-y-2">
            <Label>API Key</Label>
            <Input
              type="password"
              value={settings.api_key}
              onChange={e => setSettings({ ...settings, api_key: e.target.value })}
              placeholder="Enter your API key"
            />
          </div>
        )}

        <div className="space-y-2">
          <Label>Model Name</Label>
          <Input
            value={settings.model_name}
            onChange={e => setSettings({ ...settings, model_name: e.target.value })}
            placeholder="e.g. google/gemini-3-flash-preview"
          />
        </div>

        <div className="space-y-2">
          <Label>Temperature: {settings.temperature.toFixed(1)}</Label>
          <Slider
            value={[settings.temperature]}
            onValueChange={([v]) => setSettings({ ...settings, temperature: v })}
            min={0}
            max={2}
            step={0.1}
          />
          <p className="text-xs text-muted-foreground">Lower = more focused, Higher = more creative</p>
        </div>

        <div className="space-y-2">
          <Label>Max Tokens</Label>
          <Input
            type="number"
            value={settings.max_tokens}
            onChange={e => setSettings({ ...settings, max_tokens: Number(e.target.value) })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Floating AI Widget</Label>
            <p className="text-xs text-muted-foreground">Show assistant bubble on all pages</p>
          </div>
          <Switch
            checked={settings.widget_enabled}
            onCheckedChange={v => setSettings({ ...settings, widget_enabled: v })}
          />
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save AI Settings
        </Button>
      </CardContent>
    </Card>
  );
}
