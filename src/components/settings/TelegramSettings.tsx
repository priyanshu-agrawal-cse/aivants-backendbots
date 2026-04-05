import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, Link2, Unlink, Loader2, Bell, CheckCircle2 } from "lucide-react";

export function TelegramSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [telegramChatId, setTelegramChatId] = useState("");
  const [telegramLinked, setTelegramLinked] = useState(false);
  const [telegramUsername, setTelegramUsername] = useState<string | null>(null);
  const [savingTelegram, setSavingTelegram] = useState(false);
  const [unlinkingTelegram, setUnlinkingTelegram] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState({ replies: true, meetings: true, campaigns: true });
  const [savingNotifPrefs, setSavingNotifPrefs] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("telegram_users" as any).select("*").eq("user_id", user.id).maybeSingle().then(({ data }: any) => {
      if (data) {
        setTelegramLinked(true);
        setTelegramChatId(String(data.telegram_chat_id || ""));
        setTelegramUsername(data.telegram_username || null);
        if (data.notification_prefs) setNotifPrefs({ replies: data.notification_prefs.replies ?? true, meetings: data.notification_prefs.meetings ?? true, campaigns: data.notification_prefs.campaigns ?? true });
      }
      setLoading(false);
    });
  }, [user]);

  const handleLink = async () => {
    if (!user || !telegramChatId.trim()) return;
    const chatIdNum = Number(telegramChatId.trim());
    if (!chatIdNum || isNaN(chatIdNum)) { toast({ title: "Invalid Chat ID", variant: "destructive" }); return; }
    setSavingTelegram(true);
    try {
      const { error } = await supabase.from("telegram_users" as any).insert({ user_id: user.id, telegram_chat_id: chatIdNum } as any);
      if (error) throw error;
      setTelegramLinked(true);
      toast({ title: "Telegram Linked!" });
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    setSavingTelegram(false);
  };

  const handleSaveNotifPrefs = async (prefs: typeof notifPrefs) => {
    if (!user) return;
    setSavingNotifPrefs(true);
    try {
      const { error } = await supabase.from("telegram_users" as any).update({ notification_prefs: prefs } as any).eq("user_id", user.id);
      if (error) throw error;
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    setSavingNotifPrefs(false);
  };

  const handleUnlink = async () => {
    if (!user) return;
    setUnlinkingTelegram(true);
    try {
      const { error } = await supabase.from("telegram_users" as any).delete().eq("user_id", user.id);
      if (error) throw error;
      setTelegramLinked(false);
      setTelegramChatId("");
      setTelegramUsername(null);
      toast({ title: "Telegram Unlinked" });
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    setUnlinkingTelegram(false);
  };

  if (loading) return <div className="flex items-center gap-2 text-muted-foreground py-8"><Loader2 className="h-4 w-4 animate-spin" />Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><MessageCircle className="h-6 w-6 text-primary" />Telegram Bot</h1>
        <p className="text-muted-foreground text-sm">Link your Telegram account for notifications and AI commands</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
          <CardDescription>Manage your Telegram bot integration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {telegramLinked ? (
            <>
              <div className="flex items-center gap-2 text-sm bg-success/10 text-success p-3 rounded-md">
                <CheckCircle2 className="h-4 w-4" />
                <span>Telegram is <b>linked</b>!</span>
                {telegramUsername && <span className="text-muted-foreground">(@{telegramUsername})</span>}
              </div>
              <div><Label>Chat ID</Label><Input value={telegramChatId} disabled className="font-mono text-sm" /></div>
              <Separator />
              <div className="space-y-3">
                <Label className="flex items-center gap-2"><Bell className="h-4 w-4" />Notification Preferences</Label>
                {([
                  { key: "replies" as const, label: "Reply Alerts", desc: "Get notified when a lead replies" },
                  { key: "meetings" as const, label: "Meeting Alerts", desc: "Meeting bookings and pipeline updates" },
                  { key: "campaigns" as const, label: "Campaign Alerts", desc: "Campaign status changes" },
                ]).map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between rounded-md border p-3">
                    <div><p className="text-sm font-medium">{label}</p><p className="text-xs text-muted-foreground">{desc}</p></div>
                    <Switch checked={notifPrefs[key]} onCheckedChange={checked => { const u = { ...notifPrefs, [key]: checked }; setNotifPrefs(u); handleSaveNotifPrefs(u); }} />
                  </div>
                ))}
                {savingNotifPrefs && <p className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" />Saving…</p>}
              </div>
              <Separator />
              <Button variant="destructive" size="sm" onClick={handleUnlink} disabled={unlinkingTelegram}>
                {unlinkingTelegram ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Unlink className="h-4 w-4 mr-2" />}
                Unlink Telegram
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  <b>How to link:</b><br/>1. Open Telegram and search for your Aivants bot<br/>2. Send <code>/start</code> to the bot<br/>3. Copy the Chat ID<br/>4. Paste it below
                </p>
                <div><Label>Telegram Chat ID</Label><Input value={telegramChatId} onChange={e => setTelegramChatId(e.target.value)} placeholder="e.g. 123456789" className="font-mono" /></div>
              </div>
              <Button onClick={handleLink} disabled={savingTelegram || !telegramChatId.trim()}>
                {savingTelegram ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Link2 className="h-4 w-4 mr-2" />}
                Link Account
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
