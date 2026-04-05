import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Globe, Save, Loader2, Palette } from "lucide-react";

const timezones = [
  "UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "Europe/London", "Europe/Paris", "Europe/Berlin", "Asia/Dubai", "Asia/Kolkata",
  "Asia/Shanghai", "Asia/Tokyo", "Australia/Sydney",
];

const dateFormats = ["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"];
const currencies = ["USD", "EUR", "GBP", "INR", "AED", "CAD", "AUD", "JPY", "CNY"];
const languages = [
  { value: "en", label: "English" },
  { value: "ar", label: "Arabic" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "hi", label: "Hindi" },
];

export function GeneralSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    company_name: "Aivants",
    timezone: "UTC",
    date_format: "MM/DD/YYYY",
    currency: "USD",
    language: "en",
    brand_primary_color: "#3b82f6",
    brand_secondary_color: "#6366f1",
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("general_settings" as any)
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data) {
          setSettings({
            company_name: data.company_name || "Aivants",
            timezone: data.timezone || "UTC",
            date_format: data.date_format || "MM/DD/YYYY",
            currency: data.currency || "USD",
            language: data.language || "en",
            brand_primary_color: data.brand_primary_color || "#3b82f6",
            brand_secondary_color: data.brand_secondary_color || "#6366f1",
          });
        }
        setLoading(false);
      });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("general_settings" as any).upsert({
        user_id: user.id,
        ...settings,
        updated_at: new Date().toISOString(),
      } as any, { onConflict: "user_id" });
      if (error) throw error;
      toast({ title: "General settings saved!" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  if (loading) return <div className="flex items-center gap-2 text-muted-foreground py-8"><Loader2 className="h-4 w-4 animate-spin" />Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Globe className="h-6 w-6 text-primary" />General Settings</h1>
        <p className="text-muted-foreground text-sm">Configure your company profile and display preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Profile</CardTitle>
          <CardDescription>Basic information about your organization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Company Name</Label>
            <Input value={settings.company_name} onChange={e => setSettings({ ...settings, company_name: e.target.value })} placeholder="Your company name" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select value={settings.timezone} onValueChange={v => setSettings({ ...settings, timezone: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{timezones.map(tz => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date Format</Label>
              <Select value={settings.date_format} onValueChange={v => setSettings({ ...settings, date_format: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{dateFormats.map(df => <SelectItem key={df} value={df}>{df}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={settings.currency} onValueChange={v => setSettings({ ...settings, currency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{currencies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={settings.language} onValueChange={v => setSettings({ ...settings, language: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{languages.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5" />Brand Colors</CardTitle>
          <CardDescription>Customize the portal appearance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Primary Color</Label>
              <div className="flex gap-2 items-center">
                <input type="color" value={settings.brand_primary_color} onChange={e => setSettings({ ...settings, brand_primary_color: e.target.value })} className="h-10 w-12 rounded border border-input cursor-pointer" />
                <Input value={settings.brand_primary_color} onChange={e => setSettings({ ...settings, brand_primary_color: e.target.value })} className="font-mono text-sm" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Secondary Color</Label>
              <div className="flex gap-2 items-center">
                <input type="color" value={settings.brand_secondary_color} onChange={e => setSettings({ ...settings, brand_secondary_color: e.target.value })} className="h-10 w-12 rounded border border-input cursor-pointer" />
                <Input value={settings.brand_secondary_color} onChange={e => setSettings({ ...settings, brand_secondary_color: e.target.value })} className="font-mono text-sm" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
        Save General Settings
      </Button>
    </div>
  );
}
