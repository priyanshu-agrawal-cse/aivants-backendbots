import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, MessageSquare, Linkedin, Loader2, Sparkles, Plus, Send, Bell } from "lucide-react";
import { useToast as useSonnerToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const CHANNELS = [
  { value: "email", label: "Email", icon: Mail },
  { value: "phone", label: "Phone", icon: Phone },
  { value: "linkedin", label: "LinkedIn", icon: Linkedin },
  { value: "sms", label: "SMS", icon: MessageSquare },
];

function getChannelIcon(channel: string) {
  const ch = CHANNELS.find((c) => c.value === channel);
  if (!ch) return <Mail className="h-4 w-4" />;
  return <ch.icon className="h-4 w-4" />;
}

interface Activity {
  id: string;
  lead_id: string | null;
  campaign_id: string | null;
  channel: string;
  activity_type: string;
  notes: string;
  created_at: string;
  lead_name?: string;
}

interface EmailLog {
  id: string;
  lead_id: string | null;
  campaign_id: string | null;
  status: string;
  sent_at: string;
  reply_classification: string | null;
  reply_sentiment: string | null;
  reply_body: string | null;
  lead_name?: string;
}

export default function Orchestrator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [classifyDialog, setClassifyDialog] = useState(false);
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [classifying, setClassifying] = useState(false);
  const [logActivityDialog, setLogActivityDialog] = useState(false);
  const [activityForm, setActivityForm] = useState({ lead_id: "", channel: "phone", activity_type: "call", notes: "" });
  const [leads, setLeads] = useState<{ id: string; name: string }[]>([]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    const [{ data: acts }, { data: logs }, { data: leadsData }] = await Promise.all([
      supabase.from("channel_activities").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
      supabase.from("email_logs").select("*").eq("user_id", user.id).order("sent_at", { ascending: false }).limit(50),
      supabase.from("leads").select("id, first_name, last_name").eq("user_id", user.id),
    ]);

    const leadMap = new Map((leadsData || []).map((l) => [l.id, `${l.first_name} ${l.last_name || ""}`.trim()]));
    setLeads((leadsData || []).map((l) => ({ id: l.id, name: `${l.first_name} ${l.last_name || ""}`.trim() })));

    setActivities(
      (acts || []).map((a) => ({ ...a, lead_name: a.lead_id ? leadMap.get(a.lead_id) || "Unknown" : "—" }))
    );
    setEmailLogs(
      (logs || []).map((l) => ({
        ...l,
        reply_classification: (l as any).reply_classification,
        reply_sentiment: (l as any).reply_sentiment,
        reply_body: (l as any).reply_body,
        lead_name: l.lead_id ? leadMap.get(l.lead_id) || "Unknown" : "—",
      }))
    );
    setLoading(false);
  };

  const [realtimeCount, setRealtimeCount] = useState(0);

  useEffect(() => { fetchData(); }, [user]);

  // Realtime subscription for new/updated email_logs
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("email-logs-realtime")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "email_logs",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new as any;
          // Only notify if a reply was just classified
          if (updated.reply_classification && updated.replied_at) {
            setRealtimeCount((c) => c + 1);
            toast({
              title: "🔔 New Reply Classified",
              description: `${updated.reply_classification.replace(/_/g, " ")} — ${updated.reply_sentiment} sentiment`,
            });
            // Update the log in-place
            setEmailLogs((prev) =>
              prev.map((l) =>
                l.id === updated.id
                  ? {
                      ...l,
                      reply_classification: updated.reply_classification,
                      reply_sentiment: updated.reply_sentiment,
                      reply_body: updated.reply_body,
                      status: updated.status,
                    }
                  : l
              )
            );
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "email_logs",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Refetch on new inserts to keep list current
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleClassify = async () => {
    if (!selectedLog || !replyBody.trim()) return;
    setClassifying(true);

    try {
      const { data, error } = await supabase.functions.invoke("classify-reply", {
        body: { email_log_id: selectedLog.id, reply_body: replyBody },
      });

      if (error) throw error;

      toast({
        title: "Reply Classified",
        description: `${data.classification} (${data.sentiment}) — ${data.suggested_action}`,
      });
      setClassifyDialog(false);
      setReplyBody("");
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setClassifying(false);
    }
  };

  const handleLogActivity = async () => {
    if (!user || !activityForm.lead_id) return;

    const { error } = await supabase.from("channel_activities").insert({
      user_id: user.id,
      lead_id: activityForm.lead_id,
      channel: activityForm.channel,
      activity_type: activityForm.activity_type,
      notes: activityForm.notes,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Activity Logged" });
      setLogActivityDialog(false);
      setActivityForm({ lead_id: "", channel: "phone", activity_type: "call", notes: "" });
      fetchData();
    }
  };

  function sentimentBadge(sentiment: string | null) {
    if (!sentiment) return null;
    const colors: Record<string, string> = {
      positive: "bg-success/10 text-success border-success/20",
      neutral: "bg-muted text-muted-foreground",
      negative: "bg-destructive/10 text-destructive border-destructive/20",
    };
    return <Badge variant="outline" className={colors[sentiment] || ""}>{sentiment}</Badge>;
  }

  function classificationBadge(cls: string | null) {
    if (!cls) return <Badge variant="outline">Unclassified</Badge>;
    const colors: Record<string, string> = {
      interested: "bg-success/10 text-success",
      meeting_request: "bg-primary/10 text-primary",
      objection: "bg-warning/10 text-warning",
      not_interested: "bg-destructive/10 text-destructive",
    };
    return <Badge variant="outline" className={colors[cls] || ""}>{cls.replace(/_/g, " ")}</Badge>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orchestrator</h1>
          <p className="text-muted-foreground">Multi-channel outreach & AI deal assistant</p>
        </div>
        <div className="flex items-center gap-3">
          {realtimeCount > 0 && (
            <Badge variant="default" className="animate-pulse gap-1">
              <Bell className="h-3 w-3" />
              {realtimeCount} new
            </Badge>
          )}
          <Button onClick={() => setLogActivityDialog(true)}>
            <Plus className="h-4 w-4 mr-2" /> Log Activity
          </Button>
        </div>
      </div>

      <Tabs defaultValue="replies" className="space-y-4">
        <TabsList>
          <TabsTrigger value="replies">AI Deal Assistant</TabsTrigger>
          <TabsTrigger value="activities">Channel Activities</TabsTrigger>
        </TabsList>

        <TabsContent value="replies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Email Replies — Classify with AI
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Loading…</p>
              ) : emailLogs.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No email logs yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lead</TableHead>
                        <TableHead>Sent</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Classification</TableHead>
                        <TableHead>Sentiment</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {emailLogs.slice(0, 20).map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">{log.lead_name}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {format(new Date(log.sent_at), "MMM d, h:mm a")}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{log.status}</Badge>
                          </TableCell>
                          <TableCell>{classificationBadge(log.reply_classification)}</TableCell>
                          <TableCell>{sentimentBadge(log.reply_sentiment)}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedLog(log);
                                setReplyBody(log.reply_body || "");
                                setClassifyDialog(true);
                              }}
                            >
                              <Sparkles className="h-3 w-3 mr-1" /> Classify
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Recent Channel Activities</CardTitle></CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Loading…</p>
              ) : activities.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No activities logged yet. Click "Log Activity" to add one.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Channel</TableHead>
                        <TableHead>Lead</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activities.map((act) => (
                        <TableRow key={act.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getChannelIcon(act.channel)}
                              <span className="capitalize">{act.channel}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{act.lead_name}</TableCell>
                          <TableCell><Badge variant="secondary" className="capitalize">{act.activity_type}</Badge></TableCell>
                          <TableCell className="text-muted-foreground max-w-[200px] truncate">{act.notes}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(act.created_at), "MMM d, h:mm a")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Classify Reply Dialog */}
      <Dialog open={classifyDialog} onOpenChange={setClassifyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Classify Reply with AI
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Lead</Label>
              <p className="text-sm text-muted-foreground">{selectedLog?.lead_name}</p>
            </div>
            <div>
              <Label>Reply Text</Label>
              <Textarea
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                placeholder="Paste the reply email content here…"
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClassifyDialog(false)}>Cancel</Button>
            <Button onClick={handleClassify} disabled={classifying || !replyBody.trim()}>
              {classifying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Classify
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log Activity Dialog */}
      <Dialog open={logActivityDialog} onOpenChange={setLogActivityDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Log Channel Activity</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Lead</Label>
              <Select value={activityForm.lead_id} onValueChange={(v) => setActivityForm((f) => ({ ...f, lead_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select lead" /></SelectTrigger>
                <SelectContent>
                  {leads.map((l) => (
                    <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Channel</Label>
                <Select value={activityForm.channel} onValueChange={(v) => setActivityForm((f) => ({ ...f, channel: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CHANNELS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Activity Type</Label>
                <Select value={activityForm.activity_type} onValueChange={(v) => setActivityForm((f) => ({ ...f, activity_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">Call</SelectItem>
                    <SelectItem value="message">Message</SelectItem>
                    <SelectItem value="connection">Connection</SelectItem>
                    <SelectItem value="follow_up">Follow-up</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={activityForm.notes}
                onChange={(e) => setActivityForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Activity notes…"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogActivityDialog(false)}>Cancel</Button>
            <Button onClick={handleLogActivity} disabled={!activityForm.lead_id}>
              <Send className="h-4 w-4 mr-2" /> Log Activity
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
