import { useState } from "react";
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { QrCode, MessageCircle, AlertTriangle, ShieldCheck, Database, Power, Phone, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export default function WhatsAppIntegration() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [botStatus, setBotStatus] = useState<"offline" | "initializing" | "qr" | "online">("offline");
  const [liveQr, setLiveQr] = useState<string>("");

  useEffect(() => {
    let interval: any;
    if (botStatus === "qr" || botStatus === "initializing") {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/qr`);
          const data = await res.json();
          if (data.ready) {
            setBotStatus("online");
            setLiveQr("");
            toast({ title: "Connected!", description: "WhatsApp Agent is now verified and active." });
          } else if (data.qr) {
            if (liveQr !== data.qr) {
              setLiveQr(data.qr);
              setBotStatus("qr");
            }
          }
        } catch (error) {
          // Backend not running yet or starting up
        }
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [botStatus, liveQr, toast]);

  const handleSavePrompt = () => {
    toast({ title: "Configuration Saved", description: "Your company details have been updated." });
  };

  const toggleBot = () => {
    if (botStatus === "offline") {
      setBotStatus("initializing");
      setLiveQr("");
      toast({ title: "Polling local bot host...", description: "Connecting to secure local WhatsApp node port 3001." });
    } else {
      setBotStatus("offline");
      setLiveQr("");
      toast({ title: "Bot Interface Disconnected", description: "Stopped polling local node." });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">WhatsApp AI Agent</h1>
        <p className="text-muted-foreground mt-2">
          Connect your WhatsApp account to automatically reply to leads and customers using AI.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Configuration */}
        <div className="col-span-1 lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Company Details
              </CardTitle>
              <CardDescription>Configure the brain of your AI agent</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>System Prompt & Business Info</Label>
                <Textarea 
                  placeholder="e.g., You are an assistant for Aivants. Our pricing starts at ₹3,999/mo..."
                  className="min-h-[220px] resize-none text-sm leading-relaxed"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>
              <Alert className="bg-primary/5 border-primary/20">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <AlertTitle className="text-sm font-medium text-foreground">Database Connection</AlertTitle>
                <AlertDescription className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  If you want to connect your website DB to the AI for dynamic responses, please contact admin.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSavePrompt} className="w-full shadow-sm">Save Configuration</Button>
            </CardFooter>
          </Card>
        </div>

        {/* Right Column: Connection Methods */}
        <div className="col-span-1 lg:col-span-2">
          <Tabs defaultValue="api" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 h-11">
              <TabsTrigger value="api" className="flex items-center gap-2 h-full rounded-md shadow-sm">
                <MessageCircle className="h-4 w-4" /> Official API
              </TabsTrigger>
              <TabsTrigger value="qr" className="flex items-center gap-2 h-full rounded-md shadow-sm">
                <QrCode className="h-4 w-4" /> QR Automation
              </TabsTrigger>
            </TabsList>

            <TabsContent value="api" className="space-y-4 mt-0">
              <Alert className="bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-sm">
                <ShieldCheck className="h-5 w-5" />
                <AlertTitle className="font-semibold">Safe & Official</AlertTitle>
                <AlertDescription className="text-sm mt-1 leading-relaxed opacity-90">
                  This method uses the official WhatsApp Cloud API. There is zero risk of getting banned as long as you follow Meta's commerce policies.
                </AlertDescription>
              </Alert>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Cloud API Configuration</CardTitle>
                  <CardDescription>Enter your Meta developer credentials to connect.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Access Token</Label>
                    <Input type="password" placeholder="EAAL..." className="font-mono text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Phone Number ID</Label>
                      <Input placeholder="e.g. 10239485..." className="font-mono text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label>WhatsApp Business Account ID</Label>
                      <Input placeholder="e.g. 10928374..." className="font-mono text-sm" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Webhook Verify Token</Label>
                    <Input placeholder="Your custom verify token" className="font-mono text-sm" />
                  </div>
                </CardContent>
                <CardFooter className="border-t bg-muted/10 p-5">
                  <Button className="w-full shadow-sm">
                    <Phone className="h-4 w-4 mr-2" /> Save Connection
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="qr" className="space-y-4 mt-0">
              <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive shadow-sm">
                <AlertTriangle className="h-5 w-5" />
                <AlertTitle className="font-semibold">High Risk of Account Ban</AlertTitle>
                <AlertDescription className="text-sm mt-1 leading-relaxed text-destructive/90">
                  This method uses web scraping (whatsapp-web.js) to automate a standard WhatsApp account. Meta actively bans numbers using unofficial automation methods. Only use a secondary dummy number for this method.
                </AlertDescription>
              </Alert>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>QR Code Deployment</CardTitle>
                  <CardDescription>Deploy your bot in seconds by scanning a QR code.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed rounded-xl bg-muted/20 min-h-[300px]">
                    {botStatus === "online" ? (
                      <div className="space-y-4 text-center animate-in zoom-in duration-300">
                        <div className="h-32 w-32 mx-auto bg-emerald-500/10 rounded-3xl flex items-center justify-center border border-emerald-500/20 shadow-inner relative overflow-hidden">
                          <div className="absolute inset-0 bg-emerald-500/20 animate-ping opacity-20" />
                          <Power className="h-12 w-12 text-emerald-500 relative z-10" />
                        </div>
                        <div>
                          <p className="font-semibold text-emerald-600 dark:text-emerald-400">Agent is Online</p>
                          <p className="text-xs text-muted-foreground mt-1">Listening and responding to incoming messages</p>
                        </div>
                      </div>
                    ) : botStatus === "qr" ? (
                      <div className="space-y-6 text-center animate-in fade-in zoom-in duration-500">
                        <div className="bg-white p-4 rounded-xl shadow-sm border mx-auto inline-block min-w-[190px] min-h-[190px] flex items-center justify-center">
                          {liveQr ? (
                            <img 
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(liveQr)}`} 
                              alt="WhatsApp Web QR Code"
                              width={160}
                              height={160}
                              className="w-[160px] h-[160px]"
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">Generating...</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">Scan Live QR Code</p>
                          <p className="text-xs text-muted-foreground mt-1 mb-4">Open WhatsApp &gt; Settings &gt; Linked Devices</p>
                        </div>
                      </div>
                    ) : botStatus === "initializing" ? (
                      <div className="space-y-4 text-center animate-in fade-in">
                        <div className="h-32 w-32 mx-auto bg-muted rounded-3xl flex items-center justify-center border shadow-inner">
                          <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Generating Secure QR Code...</p>
                          <p className="text-xs text-muted-foreground mt-1">Starting local node cluster</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 text-center animate-in zoom-in duration-300">
                        <div className="h-32 w-32 mx-auto bg-muted rounded-3xl flex items-center justify-center border shadow-inner">
                          <QrCode className="h-12 w-12 text-muted-foreground/40" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Click "Start Bot" to generate QR code</p>
                          <p className="text-xs text-muted-foreground mt-1">Open WhatsApp on your phone to link a device</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t bg-muted/10 p-5">
                  <div className="text-[13px] text-muted-foreground flex items-center gap-2">
                    System Status: 
                    {botStatus === "online" ? <span className="text-emerald-500 font-semibold tracking-tight">Active</span> : 
                     botStatus === "qr" ? <span className="text-amber-500 font-semibold tracking-tight">Awaiting Scan</span> : 
                     botStatus === "initializing" ? <span className="text-blue-500 font-semibold tracking-tight">Booting...</span> : 
                     <span className="font-medium">Offline</span>}
                  </div>
                  <Button 
                    variant={botStatus !== "offline" ? "destructive" : "default"} 
                    onClick={toggleBot}
                    className="w-32 shadow-sm"
                    disabled={botStatus === "initializing"}
                  >
                    {botStatus !== "offline" ? "Stop Bot" : "Start Bot"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

          </Tabs>
        </div>
      </div>
    </div>
  );
}
