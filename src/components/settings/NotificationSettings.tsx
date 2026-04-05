import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Loader2, Mail, MessageCircle, Monitor } from "lucide-react";

const channels = [
  { id: "email", label: "Email", icon: Mail },
  { id: "telegram", label: "Telegram", icon: MessageCircle },
  { id: "in_app", label: "In-App", icon: Monitor },
];

const events = [
  { id: "new_lead", label: "New Lead", desc: "When a new lead is added to the system" },
  { id: "lead_reply", label: "Lead Reply", desc: "When a lead replies to an email" },
  { id: "proposal_opened", label: "Proposal Opened", desc: "When a client opens a proposal" },
  { id: "project_deadline", label: "Project Deadline", desc: "Approaching project deadlines" },
  { id: "payment_reminder", label: "Payment Reminder", desc: "Upcoming or overdue payments" },
  { id: "system_error", label: "System Error", desc: "Critical system errors" },
  { id: "campaign_complete", label: "Campaign Complete", desc: "When a campaign finishes sending" },
  { id: "meeting_booked", label: "Meeting Booked", desc: "When a meeting is scheduled" },
];

type NotifMap = Record<string, Record<string, boolean>>;

export function NotificationSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState<NotifMap>({});

  useEffect(() => {
    if (!user) return;
    supabase.from("notification_settings" as any).select("*").eq("user_id", user.id).then(({ data }: any) => {
      const map: NotifMap = {};
      channels.forEach(ch => { map[ch.id] = {}; events.forEach(ev => { map[ch.id][ev.id] = true; }); });
      if (data) {
        (data as any[]).forEach((row: any) => {
          if (map[row.channel]) map[row.channel][row.event_type] = row.enabled;
        });
      }
      setPrefs(map);
      setLoading(false);
    });
  }, [user]);

  const toggle = async (channel: string, event: string, enabled: boolean) => {
    if (!user) return;
    setPrefs(prev => ({ ...prev, [channel]: { ...prev[channel], [event]: enabled } }));
    try {
      const { error } = await supabase.from("notification_settings" as any).upsert({
        user_id: user.id,
        channel,
        event_type: event,
        enabled,
        updated_at: new Date().toISOString(),
      } as any, { onConflict: "user_id,channel,event_type" });
      if (error) throw error;
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  if (loading) return <div className="flex items-center gap-2 text-muted-foreground py-8"><Loader2 className="h-4 w-4 animate-spin" />Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Bell className="h-6 w-6 text-primary" />Notifications</h1>
        <p className="text-muted-foreground text-sm">Control which events trigger alerts across each channel</p>
      </div>

      {channels.map(channel => {
        const Icon = channel.icon;
        return (
          <Card key={channel.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Icon className="h-5 w-5" />{channel.label} Notifications</CardTitle>
              <CardDescription>Configure {channel.label.toLowerCase()} alerts for system events</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {events.map(event => (
                <div key={event.id} className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="text-sm font-medium">{event.label}</p>
                    <p className="text-xs text-muted-foreground">{event.desc}</p>
                  </div>
                  <Switch checked={prefs[channel.id]?.[event.id] ?? true} onCheckedChange={v => toggle(channel.id, event.id, v)} />
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
