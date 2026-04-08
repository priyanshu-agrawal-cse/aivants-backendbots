import React, { useState, useEffect } from "react";
import { 
  Phone, 
  Plus, 
  Activity, 
  Users, 
  BarChart3, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  ExternalLink,
  Search,
  Filter,
  MessageSquare,
  Settings,
  Bot,
  TrendingUp,
  Hash,
  ArrowRight,
  Info,
  LayoutDashboard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableRow, 
  TableHeader 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NumberPurchaseModal } from "./NumberPurchaseModal";
import { VoiceSettings } from "@/components/settings/VoiceSettings";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export function VoiceDashboard() {
  const { user } = useAuth();
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [numbers, setNumbers] = useState<any[]>([]);
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasConfig, setHasConfig] = useState(false);
  const [selectedCall, setSelectedCall] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: numData } = await supabase
        .from('voice_numbers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setNumbers(numData || []);

      const { data: callData } = await supabase
        .from('voice_calls')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setCalls(callData || []);
      
      const { data: configData } = await supabase
        .from('ai_memory')
        .select('id')
        .eq('user_id', user.id)
        .eq('key', 'vobiz_config')
        .maybeSingle();
      setHasConfig(!!configData);

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getInterestColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'high': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'medium': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'low': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-8 p-0 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">AI Calling Agent Hub</h1>
          <p className="text-muted-foreground mt-1">
            Real-time automated outreach management.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-11 rounded-xl glass-effect" onClick={() => setIsPurchaseModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Buy Number
          </Button>
          <Button className="h-11 rounded-xl shadow-lg shadow-primary/20">
            <Activity className="w-4 h-4 mr-2" />
            New Campaign
          </Button>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="w-full space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="bg-muted/30 backdrop-blur-xl p-1 h-11 rounded-xl border border-border/40">
            <TabsTrigger value="dashboard" className="rounded-lg px-6 h-9 transition-all flex items-center gap-2">
              <LayoutDashboard className="w-3.5 h-3.5" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="calls" className="rounded-lg px-6 h-9 transition-all">Recent Calls</TabsTrigger>
            <TabsTrigger value="numbers" className="rounded-lg px-6 h-9 transition-all">Numbers</TabsTrigger>
            <TabsTrigger value="settings" className="rounded-lg px-6  h-9 transition-all flex items-center gap-2">
              <Settings className="w-3.5 h-3.5" />
              Settings
            </TabsTrigger>
          </TabsList>

          <div className="hidden md:flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search logs..." className="pl-9 h-11 w-[300px] border-border/40 bg-background/40" />
            </div>
          </div>
        </div>

        {/* --- DASHBOARD TAB CONTENT --- */}
        <TabsContent value="dashboard" className="m-0 space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
           {/* QUICK SETUP GUIDE */}
            {!hasConfig ? (
              <Card className="border-primary/20 bg-primary/5 rounded-2xl p-6 mb-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Bot className="w-5 h-5 text-primary" /> Setup Required: Integration Guide
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-xl">
                      To start making AI calls, you must connect your Vobiz account. Follow these steps:
                    </p>
                    <ol className="text-sm space-y-2 mt-4">
                      <li className="flex gap-2">
                        <Badge variant="secondary" className="h-5 w-5 rounded-full p-0 flex items-center justify-center min-w-[20px]">1</Badge>
                        <span>Go to the <strong>Settings</strong> tab and paste your Vobiz Auth ID.</span>
                      </li>
                      <li className="flex gap-2">
                        <Badge variant="secondary" className="h-5 w-5 rounded-full p-0 flex items-center justify-center min-w-[20px]">2</Badge>
                        <span>Visit the <strong>Numbers</strong> tab to procure a voice-ready number.</span>
                      </li>
                    </ol>
                  </div>
                  <Button 
                    onClick={() => {
                        const tabs = document.querySelectorAll('[role="tab"]');
                        const settingsTab = Array.from(tabs).find(t => t.textContent?.includes("Settings")) as HTMLElement;
                        settingsTab?.click();
                    }} 
                    className="rounded-xl px-8 h-12 shadow-lg shadow-primary/20"
                  >
                    Go to Settings
                  </Button>
                </div>
              </Card>
            ) : numbers.length === 0 && (
              <Card className="border-indigo-500/20 bg-indigo-500/5 rounded-2xl p-6 mb-0">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="font-bold text-indigo-700 dark:text-indigo-400">Step 2: Get a Voice Number</p>
                      <p className="text-sm text-indigo-600 dark:text-indigo-400/80">Account connected! Now buy a number to start making calls.</p>
                    </div>
                    <Button variant="outline" onClick={() => setIsPurchaseModalOpen(true)} className="border-indigo-500/30 text-indigo-600 hover:bg-indigo-500/10">
                      Procure Number
                    </Button>
                  </div>
              </Card>
            )}

            {/* STATS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="rounded-2xl border-border/40 bg-background/40 backdrop-blur-md shadow-xl transition-all hover:shadow-2xl hover:border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Live Calls</CardTitle>
                  <BarChart3 className="w-4 h-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{calls.length}</div>
                </CardContent>
              </Card>
              
              <Card className="rounded-2xl border-border/40 bg-background/40 backdrop-blur-md shadow-xl transition-all hover:shadow-2xl hover:border-emerald-500/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">High Interest</CardTitle>
                  <Users className="w-4 h-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{calls.filter(c => c.interest_level?.toLowerCase() === 'high').length}</div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-border/40 bg-background/40 backdrop-blur-md shadow-xl transition-all hover:shadow-2xl hover:border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Active Numbers</CardTitle>
                  <Phone className="w-4 h-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{numbers.length}</div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-border/40 bg-background/40 backdrop-blur-md shadow-xl transition-all hover:shadow-2xl hover:border-amber-500/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">AI Status</CardTitle>
                  <div className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Voice Model Interface</div>
                  <p className="text-xs text-muted-foreground mt-1 text-emerald-500">Live & Listening</p>
                </CardContent>
              </Card>
            </div>
        </TabsContent>

        <TabsContent value="calls" className="m-0 border-none animate-in slide-in-from-right-4 duration-500">
          <Card className="rounded-2xl border-border/40 bg-background/40 backdrop-blur-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[180px]">Contact Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Interest Level</TableHead>
                  <TableHead className="max-w-[300px]">AI Summary</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calls.length > 0 ? calls.map((call) => (
                  <TableRow key={call.id} className="hover:bg-primary/5 transition-colors group">
                    <TableCell className="font-semibold">{call.to_number}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {call.status === "completed" ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Activity className="w-4 h-4 text-amber-500 animate-pulse" />
                        )}
                        <span className="capitalize">{call.status}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${getInterestColor(call.interest_level)} rounded-lg border px-2 py-0.5 font-medium`}>
                        {call.interest_level || "No Data"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm truncate max-w-[300px]">
                      {call.summary || "No summary transcribed yet."}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(call.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2"
                        onClick={() => {
                          setSelectedCall(call);
                          setIsDetailsOpen(true);
                        }}
                      >
                        <ExternalLink className="w-4 h-4" />
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                        <Phone className="w-8 h-8 opacity-20" />
                        <p className="font-medium">No real call data synchronized yet.</p>
                        <p className="text-xs max-w-xs mx-auto">Visit the Dashboard tab to finish setting up.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="numbers" className="m-0 border-none animate-in slide-in-from-right-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {numbers.length > 0 ? numbers.map((num) => (
              <Card key={num.phone_number} className="rounded-2xl border-border/40 bg-background/40 hover:border-primary/40 transition-all group overflow-hidden">
                <div className="h-1 w-full bg-primary" />
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge className="bg-emerald-500 text-white border-none">Active</Badge>
                    <span className="text-xs text-muted-foreground">{num.provider}</span>
                  </div>
                  <CardTitle className="text-2xl mt-2 font-bold tabular-nums">{num.phone_number}</CardTitle>
                  <CardDescription>Created: {new Date(num.created_at).toLocaleDateString()}</CardDescription>
                </CardHeader>
                <CardFooter className="flex justify-between border-t border-border/40 py-4 bg-muted/20">
                  <Button variant="ghost" size="sm" className="group-hover:text-primary">Settings</Button>
                  <Button variant="ghost" size="sm" className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 text-xs">Release</Button>
                </CardFooter>
              </Card>
            )) : (
                <div className="col-span-1 md:col-span-2">
                    <Card className="border-dashed border-border/60 bg-muted/5 flex flex-col items-center justify-center p-12 h-full text-center">
                        <Hash className="w-10 h-10 text-muted-foreground opacity-20 mb-4" />
                        <p className="font-semibold text-muted-foreground">No phone numbers assigned.</p>
                        <p className="text-xs text-muted-foreground mt-2 max-w-sm">
                            Click 'Add Number' to purchase a professional number for your AI campaigns.
                        </p>
                    </Card>
                </div>
            )}
            
            <Card 
              className="rounded-2xl border-dashed border-border/60 bg-transparent flex flex-col items-center justify-center p-8 cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-all group h-[200px]"
              onClick={() => setIsPurchaseModalOpen(true)}
            >
              <div className="w-12 h-12 rounded-full border border-dashed border-border/60 flex items-center justify-center group-hover:border-primary/60 transition-all">
                <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-all" />
              </div>
              <span className="mt-4 font-semibold text-muted-foreground group-hover:text-primary transition-all">Add Number</span>
              <p className="text-xs text-muted-foreground mt-1">Procure from Vobiz inventory</p>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="m-0 border-none animate-in slide-in-from-right-4 duration-500">
           <VoiceSettings />
        </TabsContent>
      </Tabs>

      <NumberPurchaseModal 
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        onSuccess={(num) => {
          fetchData();
          toast.success(`Number ${num} is ready for use.`);
        }}
      />

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden border-border/40 bg-background/95 backdrop-blur-3xl shadow-2xl rounded-2xl">
          <DialogHeader className="p-6 pb-2 border-b border-border/40">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                  Call with {selectedCall?.to_number}
                </DialogTitle>
                <DialogDescription className="mt-1 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  {selectedCall?.created_at && new Date(selectedCall.created_at).toLocaleString()}
                </DialogDescription>
              </div>
              <Badge variant="outline" className={`${getInterestColor(selectedCall?.interest_level)} px-3 py-1 rounded-full uppercase tracking-wider text-[10px] font-bold`}>
                {selectedCall?.interest_level || "Unknown"} Interest
              </Badge>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 p-6">
            <div className="space-y-8">
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 uppercase tracking-tight">
                  <Bot className="w-4 h-4 text-primary" /> AI Summary
                </h3>
                <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 text-sm leading-relaxed text-foreground shadow-sm italic">
                  "{selectedCall?.summary || "No summary available for this call."}"
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 uppercase tracking-tight">
                  <MessageSquare className="w-4 h-4 text-indigo-500" /> Full Transcript
                </h3>
                <div className="space-y-4">
                  {selectedCall?.transcript ? (
                    selectedCall.transcript.split('\n').map((line: string, i: number) => {
                      const isAI = line.toLowerCase().startsWith('ai:') || line.toLowerCase().startsWith('assistant:');
                      const content = line.includes(':') ? line.split(':').slice(1).join(':').trim() : line;
                      const speaker = line.includes(':') ? line.split(':')[0] : 'Participant';
                      
                      return (
                        <div key={i} className={`flex ${isAI ? 'justify-start' : 'justify-end'}`}>
                          <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                            isAI 
                              ? 'bg-muted/50 border border-border/40 rounded-tl-none text-muted-foreground' 
                              : 'bg-primary text-primary-foreground rounded-tr-none shadow-md shadow-primary/10'
                          }`}>
                            <div className={`text-[10px] font-bold uppercase mb-1 opacity-70 ${isAI ? 'text-primary' : 'text-primary-foreground'}`}>
                              {speaker}
                            </div>
                            {content}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-10 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border/60">
                      Transcript not yet processed.
                    </div>
                  )}
                </div>
              </section>

              {selectedCall?.response_data && Object.keys(selectedCall.response_data).length > 0 && (
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 uppercase tracking-tight">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Captured Responses
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {Object.entries(selectedCall.response_data).map(([key, val]: [string, any]) => (
                      <div key={key} className="flex items-center justify-between bg-muted/30 border border-border/40 rounded-xl px-4 py-3 shadow-sm">
                        <span className="text-sm font-medium capitalize text-muted-foreground">{key.replace(/_/g, ' ')}</span>
                        <span className="text-sm font-bold text-foreground">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="p-4 border-t border-border/40 bg-muted/5 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)} className="rounded-xl border-border/40">Close</Button>
            <Button className="rounded-xl shadow-lg shadow-primary/20 flex items-center gap-2">
              <Phone className="w-4 h-4" /> Follow Up Call
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
