import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Code, Loader2, RefreshCw, Download, AlertTriangle, CheckCircle2, XCircle, Activity } from "lucide-react";

interface LogEntry {
  id: string;
  action: string;
  category: string;
  status: string;
  error_message: string | null;
  details: any;
  created_at: string;
}

export function DeveloperSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [debugMode, setDebugMode] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadLogs = async () => {
    if (!user) return;
    setLoading(true);
    let query = supabase.from("system_logs").select("*").order("created_at", { ascending: false }).limit(100);
    if (categoryFilter !== "all") query = query.eq("category", categoryFilter);
    if (statusFilter !== "all") query = query.eq("status", statusFilter);
    const { data } = await query;
    setLogs((data as LogEntry[]) || []);
    setLoading(false);
  };

  useEffect(() => { loadLogs(); }, [user, categoryFilter, statusFilter]);

  const exportLogs = () => {
    const csv = [
      "timestamp,category,action,status,error",
      ...logs.map(l => `"${l.created_at}","${l.category}","${l.action}","${l.status}","${l.error_message || ""}"`)
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aivants-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Logs exported!" });
  };

  const getStatusIcon = (status: string) => {
    if (status === "success") return <CheckCircle2 className="h-3.5 w-3.5 text-success" />;
    if (status === "error") return <XCircle className="h-3.5 w-3.5 text-destructive" />;
    return <Activity className="h-3.5 w-3.5 text-warning" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Code className="h-6 w-6 text-primary" />Developer Mode</h1>
        <p className="text-muted-foreground text-sm">System logs, debugging tools, and advanced configuration</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Debug Controls</CardTitle>
          <CardDescription>Advanced settings for development and troubleshooting</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-md border p-3">
            <div><p className="text-sm font-medium">Debug Mode</p><p className="text-xs text-muted-foreground">Enable verbose logging and diagnostic information</p></div>
            <Switch checked={debugMode} onCheckedChange={setDebugMode} />
          </div>
          <div className="space-y-2">
            <Label>API Base URL</Label>
            <Input value={import.meta.env.VITE_SUPABASE_URL || ""} disabled className="font-mono text-xs" />
          </div>
          <div className="space-y-2">
            <Label>Project ID</Label>
            <Input value={import.meta.env.VITE_SUPABASE_PROJECT_ID || ""} disabled className="font-mono text-xs" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>System Logs</CardTitle>
              <CardDescription>Recent system activity and event log</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={loadLogs}><RefreshCw className="h-3.5 w-3.5 mr-1" />Refresh</Button>
              <Button variant="outline" size="sm" onClick={exportLogs} disabled={logs.length === 0}><Download className="h-3.5 w-3.5 mr-1" />Export CSV</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 mb-4">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="api">API</SelectItem>
                <SelectItem value="automation">Automation</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="ai">AI</SelectItem>
                <SelectItem value="auth">Auth</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center"><Loader2 className="h-4 w-4 animate-spin" />Loading logs…</div>
          ) : logs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No logs found.</p>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-1">
                {logs.map(log => (
                  <div key={log.id} className="flex items-start gap-3 p-2.5 rounded-md border text-sm hover:bg-accent/50 transition-colors">
                    {getStatusIcon(log.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{log.action}</span>
                        <Badge variant="outline" className="text-[10px] shrink-0">{log.category}</Badge>
                      </div>
                      {log.error_message && (
                        <p className="text-xs text-destructive flex items-center gap-1 mt-0.5"><AlertTriangle className="h-3 w-3" />{log.error_message}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
