import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Phone, Save, Loader2, ShieldCheck, Eye, EyeOff, Key, ExternalLink, Info } from "lucide-react";

export function VoiceSettings() {
  const { user } = useAuth();
  const [vobizId, setVobizId] = useState("");
  const [vobizToken, setVobizToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchSettings();
  }, [user]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("ai_memory")
        .select("value")
        .eq("user_id", user?.id)
        .eq("key", "vobiz_config")
        .maybeSingle();

      if (data?.value) {
        const config = JSON.parse(data.value);
        setVobizId(config.vobiz_auth_id || "");
        setVobizToken(config.vobiz_auth_token || "");
        setIsSaved(true);
      }
    } catch (err) {
      console.error("Error loading voice settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!vobizId || !vobizToken) {
      toast.error("Please fill in both Auth ID and Token.");
      return;
    }

    setSaving(true);
    try {
      const config = {
        vobiz_auth_id: vobizId.trim(),
        vobiz_auth_token: vobizToken.trim()
      };

      const { data: existing } = await supabase
        .from("ai_memory")
        .select("id")
        .eq("user_id", user.id)
        .eq("key", "vobiz_config")
        .maybeSingle();

      const payload = {
        user_id: user.id,
        key: "vobiz_config",
        value: JSON.stringify(config),
        memory_type: "integration_settings",
        updated_at: new Date().toISOString()
      };

      if (existing) {
        await supabase.from("ai_memory").update(payload).eq("id", existing.id);
      } else {
        await supabase.from("ai_memory").insert(payload);
      }

      setIsSaved(true);
      toast.success("Voice settings saved successfully!");
    } catch (err) {
      toast.error("Failed to save settings.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
      return <div className="flex items-center gap-2 p-8 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin"/> Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Key className="h-6 w-6 text-primary" /> Voice AI Integrations
          </h2>
          <p className="text-muted-foreground text-sm">
            Connect your own Vobiz account to purchase numbers and deploy custom voice AI agents.
          </p>
        </div>
        <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/5" asChild>
           <a href="https://vobiz.ai/dashboard/api-settings" target="_blank" rel="noreferrer">
             <ExternalLink className="w-4 h-4 mr-2" />
             Vobiz API Dashboard
           </a>
        </Button>
      </div>

      {/* SETUP INSTRUCTIONS */}
      <Card className="border-primary/20 bg-primary/5 rounded-2xl overflow-hidden">
        <CardHeader className="bg-primary/10 pb-4">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Info className="w-4 h-4" /> 4 Steps to Connect Vobiz
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
           <div className="space-y-2">
              <p className="font-semibold flex items-center gap-2">
                <Badge variant="secondary" className="h-5 w-5 rounded-full p-0 flex items-center justify-center">1</Badge>
                Login to Vobiz
              </p>
              <p className="text-muted-foreground pl-7">Sign in to your account at <a href="https://vobiz.ai" className="underline text-primary">vobiz.ai</a>.</p>
           </div>
           <div className="space-y-2">
              <p className="font-semibold flex items-center gap-2">
                <Badge variant="secondary" className="h-5 w-5 rounded-full p-0 flex items-center justify-center">2</Badge>
                Get Auth ID
              </p>
              <p className="text-muted-foreground pl-7">Navigate to Settings → API. Copy your <strong>Auth ID</strong> and paste it below.</p>
           </div>
           <div className="space-y-2">
              <p className="font-semibold flex items-center gap-2">
                <Badge variant="secondary" className="h-5 w-5 rounded-full p-0 flex items-center justify-center">3</Badge>
                Generate Token
              </p>
              <p className="text-muted-foreground pl-7">Click 'Generate Token' if you don't have one. Copy and paste it into the Token field.</p>
           </div>
           <div className="space-y-2">
              <p className="font-semibold flex items-center gap-2">
                <Badge variant="secondary" className="h-5 w-5 rounded-full p-0 flex items-center justify-center">4</Badge>
                Save & Verify
              </p>
              <p className="text-muted-foreground pl-7">Click 'Save Integration Settings' at the bottom to link your account.</p>
           </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/40 bg-background/40 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Vobiz Configuration
            {isSaved && <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Configured</Badge>}
          </CardTitle>
          <CardDescription>
            Find these in your Vobiz Developer Dashboard under API Settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vobiz_id">Vobiz Auth ID</Label>
            <Input 
              id="vobiz_id"
              value={vobizId}
              onChange={(e) => { setVobizId(e.target.value); setIsSaved(false); }}
              placeholder="e.g. VOB-XXXXXX"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vobiz_token">Vobiz Auth Token</Label>
            <div className="relative">
              <Input 
                id="vobiz_token"
                type={showToken ? "text" : "password"}
                value={vobizToken}
                onChange={(e) => { setVobizToken(e.target.value); setIsSaved(false); }}
                placeholder="Your secret API token"
                className="h-11 pr-10 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showToken ? <EyeOff className="h-4 h-4" /> : <Eye className="h-4 h-4" />}
              </button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t border-border/40 mt-4 pt-6">
          <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto h-11 px-8 rounded-xl">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Integration Settings
          </Button>
        </CardFooter>
      </Card>

      <Card className="border-dashed border-primary/20 bg-primary/5 rounded-2xl">
        <CardContent className="pt-6 flex gap-4">
           <ShieldCheck className="w-6 h-6 text-primary shrink-0" />
           <div className="text-sm text-primary/80">
             <p className="font-semibold mb-1">Security Note</p>
             <p>Your API keys are encrypted at rest and only used by the AI Agent when you initiate a voice task. Never share these tokens with anyone.</p>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
