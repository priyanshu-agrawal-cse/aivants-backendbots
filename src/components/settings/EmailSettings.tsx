import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Save, Loader2, Send, CheckCircle2, Eye, EyeOff, ShieldCheck } from "lucide-react";

// In production point VITE_EMAIL_API_URL at your deployed email server
// e.g. https://your-email-server.railway.app
// In dev the Vite proxy forwards /api → localhost:3001
const EMAIL_API = (import.meta.env.VITE_EMAIL_API_URL ?? "").replace(/\/$/, "");

/** Fetch wrapper that gives a helpful error when the server returns HTML (not running) */
async function apiFetch(path: string, init: RequestInit) {
  const url = `${EMAIL_API}${path}`;
  const res = await fetch(url, init);
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) {
    throw new Error(
      res.status === 404 || res.status === 502
        ? "Email server not reachable. Make sure it is deployed and VITE_EMAIL_API_URL is set."
        : `Server returned ${res.status} (non-JSON). Email server may not be running.`
    );
  }
  return res;
}

export function EmailSettings() {
  const { user } = useAuth();
  const { toast } = useToast();

  // SMTP credentials
  const [smtpEmail, setSmtpEmail] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [fromName, setFromName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // UI state
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [sending, setSending] = useState(false);

  // Test email form
  const [testEmail, setTestEmail] = useState({
    to: "",
    subject: "Test Email from Aivants CRM",
    body: "<h2>Hello!</h2><p>This is a test email sent from your Aivants CRM. If you're reading this, your email configuration is working! 🎉</p>",
  });

  // Load saved credentials on mount
  useEffect(() => {
    if (!user) return;

    // Load password & display name from localStorage (not yet in Supabase schema)
    const savedPassword = localStorage.getItem(`smtp_password_${user.id}`) || "";
    const savedFromName = localStorage.getItem(`from_name_${user.id}`) || "";
    setSmtpPassword(savedPassword);
    setFromName(savedFromName);

    supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!error && data) {
          const d = data as any;
          setSmtpEmail(d.from_email || "");
          setSettingsId(d.id);
          setIsSaved(!!(d.from_email && savedPassword));
        }
        setLoading(false);
      });
  }, [user]);

  // Save credentials — only existing Supabase columns; password goes to localStorage
  const handleSave = async () => {
    if (!user || !smtpEmail.trim() || !smtpPassword.trim()) {
      toast({
        title: "Missing fields",
        description: "Please enter both your Gmail address and App Password.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Persist password & display name locally
      localStorage.setItem(`smtp_password_${user.id}`, smtpPassword.trim());
      localStorage.setItem(`from_name_${user.id}`, fromName.trim());

      // Only save columns that exist in the user_settings table
      const payload: any = {
        from_email: smtpEmail.trim(),
        email_provider: "nodemailer",
        updated_at: new Date().toISOString(),
      };

      if (settingsId) {
        const { error } = await supabase
          .from("user_settings")
          .update(payload)
          .eq("id", settingsId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("user_settings")
          .insert({ user_id: user.id, ...payload } as any)
          .select()
          .single();
        if (error) throw error;
        setSettingsId((data as any).id);
      }

      // Mirror to ai_memory for the AI Voice Agent to access on the backend
      try {
        const { data: existingMemory } = await supabase
          .from("ai_memory")
          .select("id")
          .eq("user_id", user.id)
          .eq("key", "smtp_config")
          .maybeSingle();

        const memoryPayload = {
          user_id: user.id,
          key: "smtp_config",
          value: JSON.stringify({
            from_email: smtpEmail.trim(),
            smtp_password: smtpPassword.trim(),
            from_name: fromName.trim(),
          }),
          memory_type: "integration_settings",
          updated_at: new Date().toISOString(),
        };

        if (existingMemory) {
          await supabase
            .from("ai_memory")
            .update(memoryPayload)
            .eq("id", existingMemory.id);
        } else {
          await supabase
            .from("ai_memory")
            .insert(memoryPayload);
        }
      } catch (memoryError) {
        console.error("AI Memory Sync Error:", memoryError);
      }

      setIsSaved(true);
      toast({ title: "✅ Email config saved!", description: "Your credentials are stored and synced with AI Assistant." });
    } catch (e: any) {
      toast({ title: "Error saving", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  // Verify SMTP without sending a full email
  const handleVerify = async () => {
    if (!smtpEmail.trim() || !smtpPassword.trim()) {
      toast({
        title: "Missing credentials",
        description: "Enter your email and App Password first.",
        variant: "destructive",
      });
      return;
    }
    setVerifying(true);
    try {
      const res = await apiFetch("/api/test-smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ smtp_email: smtpEmail.trim(), smtp_password: smtpPassword.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");
      toast({ title: "✅ Credentials verified!", description: "Your Gmail SMTP is working correctly." });
    } catch (e: any) {
      toast({ title: "Verification failed", description: e.message, variant: "destructive" });
    }
    setVerifying(false);
  };

  // Send a test email using saved credentials
  const handleSendTest = async () => {
    if (!testEmail.to) {
      toast({ title: "Missing recipient", description: "Please enter a To email address.", variant: "destructive" });
      return;
    }
    if (!smtpEmail.trim() || !smtpPassword.trim()) {
      toast({ title: "No credentials", description: "Save your email and App Password first.", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      const res = await apiFetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smtp_email: smtpEmail.trim(),
          smtp_password: smtpPassword.trim(),
          from_name: fromName.trim() || undefined,
          to: testEmail.to,
          subject: testEmail.subject,
          body: testEmail.body,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");
      toast({ title: "📧 Test email sent!", description: `Delivered to ${testEmail.to}` });
    } catch (e: any) {
      toast({ title: "Failed to send", description: e.message, variant: "destructive" });
    }
    setSending(false);
  };

  if (loading)
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-8">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Mail className="h-6 w-6 text-primary" /> Email &amp; Messaging
        </h1>
        <p className="text-muted-foreground text-sm">
          Enter your Gmail address and App Password to send emails directly from your account
        </p>
      </div>

      {/* Credentials Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Gmail / SMTP Configuration
            {isSaved && (
              <Badge variant="secondary" className="text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Saved
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Use your Gmail address with a{" "}
            <a
              href="https://myaccount.google.com/apppasswords"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-primary hover:opacity-80"
            >
              Gmail App Password
            </a>{" "}
            (not your regular Gmail password)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sender Name */}
          <div className="space-y-2">
            <Label>Display Name (optional)</Label>
            <Input
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              placeholder="e.g. Aivants CRM"
            />
            <p className="text-xs text-muted-foreground">
              Shown as the sender name in recipients' inboxes
            </p>
          </div>

          {/* Gmail address */}
          <div className="space-y-2">
            <Label>Gmail Address *</Label>
            <Input
              type="email"
              value={smtpEmail}
              onChange={(e) => {
                setSmtpEmail(e.target.value);
                setIsSaved(false);
              }}
              placeholder="yourname@gmail.com"
            />
          </div>

          {/* App Password */}
          <div className="space-y-2">
            <Label>Gmail App Password *</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={smtpPassword}
                onChange={(e) => {
                  setSmtpPassword(e.target.value);
                  setIsSaved(false);
                }}
                placeholder="xxxx xxxx xxxx xxxx"
                className="pr-10 font-mono tracking-widest"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Generate at:{" "}
              <a
                href="https://myaccount.google.com/apppasswords"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                myaccount.google.com/apppasswords
              </a>{" "}
              (requires 2-Step Verification to be enabled)
            </p>
          </div>

          {/* Saved indicator */}
          {isSaved && smtpEmail && (
            <div className="flex items-center gap-2 text-sm text-accent-foreground bg-accent/10 p-2 rounded-md">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Sending as: <span className="font-mono font-medium">{smtpEmail}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Email Config
            </Button>
            <Button variant="outline" onClick={handleVerify} disabled={verifying}>
              {verifying ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4 mr-2" />
              )}
              Verify Credentials
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Email Card */}
      <Card>
        <CardHeader>
          <CardTitle>Send Test Email</CardTitle>
          <CardDescription>Verify your configuration by sending a test message</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>To Email *</Label>
            <Input
              type="email"
              value={testEmail.to}
              onChange={(e) => setTestEmail({ ...testEmail, to: e.target.value })}
              placeholder="recipient@example.com"
            />
          </div>
          <div>
            <Label>Subject *</Label>
            <Input
              value={testEmail.subject}
              onChange={(e) => setTestEmail({ ...testEmail, subject: e.target.value })}
            />
          </div>
          <div>
            <Label>Body (HTML) *</Label>
            <Textarea
              value={testEmail.body}
              onChange={(e) => setTestEmail({ ...testEmail, body: e.target.value })}
              rows={4}
            />
          </div>
          <Button onClick={handleSendTest} disabled={sending || !smtpEmail || !smtpPassword}>
            {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            Send Test Email
          </Button>
          {(!smtpEmail || !smtpPassword) && (
            <p className="text-xs text-muted-foreground">
              ⚠ Save your Gmail credentials above before sending a test email.
            </p>
          )}
        </CardContent>
      </Card>

      {/* How-to guide */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">How to get a Gmail App Password</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
            <li>Go to your Google Account → Security</li>
            <li>Make sure <strong>2-Step Verification</strong> is enabled</li>
            <li>Search for <strong>App Passwords</strong> in the search bar</li>
            <li>Create a new app password — name it "Aivants CRM"</li>
            <li>Copy the 16-character code and paste it in the field above</li>
            <li>
              Also make sure to{" "}
              <a
                href="https://myaccount.google.com/lesssecureapps"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-primary"
              >
                allow less secure apps
              </a>{" "}
              or use App Passwords (preferred)
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
