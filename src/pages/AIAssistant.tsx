import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import {
  PaperPlaneRight, SpinnerGap, Plus, ChatTeardropText, Trash, Sparkle,
  ChartBar, Users, CreditCard, FolderOpen, Envelope, Lightning, Brain, Robot,
  Microphone
} from "@phosphor-icons/react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { VoiceAssistant } from "@/components/agent/VoiceAssistant";

type Message = { role: "user" | "assistant"; content: string };
type Conversation = { id: string; title: string; updated_at: string };

export default function AIAssistant() {
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [voiceMode, setVoiceMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("chat_conversations")
        .select("id, title, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(50);
      setConversations((data as any) || []);
      setLoadingConvs(false);
    })();
  }, [user]);

  useEffect(() => {
    if (!activeConvId) { setMessages([]); return; }
    (async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("role, content")
        .eq("conversation_id", activeConvId)
        .order("created_at", { ascending: true });
      setMessages((data as any as Message[]) || []);
    })();
  }, [activeConvId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const createConversation = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("chat_conversations")
      .insert({ user_id: user.id, title: "New Chat" })
      .select().single();
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    const conv = data as any as Conversation;
    setConversations(prev => [conv, ...prev]);
    setActiveConvId(conv.id);
    setMessages([]);
    if (isMobile) setSidebarOpen(false);
  };

  const deleteConversation = async (id: string) => {
    await supabase.from("chat_conversations").delete().eq("id", id);
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConvId === id) { setActiveConvId(null); setMessages([]); }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    setInput("");

    let convId = activeConvId;
    let isNewConv = false;
    if (!convId && user) {
      const { data } = await supabase
        .from("chat_conversations")
        .insert({ user_id: user.id, title: userMessage.slice(0, 60) })
        .select().single();
      if (data) {
        convId = (data as any).id;
        isNewConv = true;
        setConversations(prev => [(data as any as Conversation), ...prev]);
        setActiveConvId(convId);
      }
    }

    const newMessages: Message[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: { messages: newMessages, conversation_id: convId, page_context: location.pathname },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setMessages(prev => [...prev, { role: "assistant", content: data.answer }]);

      if (newMessages.length === 1 && convId) {
        await supabase.from("chat_conversations").update({ title: userMessage.slice(0, 60) }).eq("id", convId);
        setConversations(prev => prev.map(c => c.id === convId ? { ...c, title: userMessage.slice(0, 60) } : c));
      }
    } catch (e: any) {
      toast({ title: "AI Error", description: e.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const quickCommands = [
    { label: "Revenue Overview", cmd: "/show_revenue", icon: ChartBar, color: "text-blue-500" },
    { label: "Top Leads", cmd: "Show my highest priority leads", icon: Lightning, color: "text-yellow-500" },
    { label: "Pending Payments", cmd: "Which clients have pending payments?", icon: CreditCard, color: "text-emerald-500" },
    { label: "Near Deadline", cmd: "Which projects are near deadline?", icon: FolderOpen, color: "text-orange-500" },
    { label: "Pipeline Status", cmd: "/show_pipeline", icon: Users, color: "text-indigo-500" },
    { label: "Email Stats", cmd: "Show my email sending statistics", icon: Envelope, color: "text-rose-500" },
  ];

  return (
    <div className="flex h-[calc(100vh-5rem)] gap-0 overflow-hidden rounded-xl border bg-card shadow-sm relative">
      {/* Sidebar */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: isMobile ? "100%" : 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`shrink-0 flex flex-col border-r overflow-hidden bg-background ${isMobile ? "absolute inset-y-0 left-0 z-30 shadow-2xl" : "relative bg-muted/30"}`}
          >
            <div className="p-4 border-b flex items-center justify-between">
              <span className="font-semibold text-sm">Conversations</span>
              <Button size="icon" variant="ghost" onClick={createConversation} className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors">
                <Plus weight="bold" className="h-4 w-4" />
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1 mt-1">
                {loadingConvs ? (
                  <div className="flex justify-center py-8">
                    <SpinnerGap weight="bold" className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="text-center py-8 space-y-2">
                    <ChatTeardropText weight="duotone" className="h-8 w-8 mx-auto text-muted-foreground/30" />
                    <p className="text-xs text-muted-foreground">No conversations yet</p>
                  </div>
                ) : (
                  conversations.map(c => (
                    <div
                      key={c.id}
                      className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer text-sm transition-all duration-150 ${
                        activeConvId === c.id
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted text-foreground"
                      }`}
                      onClick={() => {
                        setActiveConvId(c.id);
                        if (isMobile) setSidebarOpen(false);
                      }}
                    >
                      <ChatTeardropText weight="duotone" className={`h-4 w-4 shrink-0 ${activeConvId === c.id ? "text-primary" : "opacity-60"}`} />
                      <span className="truncate flex-1">{c.title}</span>
                      <Button
                        size="icon" variant="ghost"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
                        onClick={(e) => { e.stopPropagation(); deleteConversation(c.id); }}
                      >
                        <Trash weight="duotone" className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="px-5 py-4 border-b flex items-center gap-3 bg-card/50 backdrop-blur-sm z-10 sticky top-0">
          <Button
            size="icon" variant="ghost" className="h-8 w-8 shrink-0 hover:bg-primary/10 hover:text-primary transition-colors"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <ChatTeardropText weight="duotone" className="h-5 w-5" />
          </Button>
          <div className="h-10 w-10 rounded-xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center shadow-md border border-zinc-800 dark:border-zinc-200 text-zinc-100 dark:text-zinc-900">
            <Sparkle weight="duotone" className="h-5 w-5 drop-shadow-sm" />
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-sm leading-tight">Aivants AI Assistant</h2>
            <p className="text-xs text-muted-foreground truncate">Query your business data in natural language</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVoiceMode(true)}
              className="gap-2 border-primary/20 hover:bg-primary/10 hover:text-primary transition-all rounded-xl"
            >
              <Microphone weight="duotone" className="h-4 w-4" />
              Voice Mode
            </Button>
            <Badge variant="outline" className="text-xs gap-1.5 px-2 py-0.5 border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
              Online
            </Badge>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 bg-gradient-to-b from-transparent to-muted/10">
          <div className="max-w-3xl mx-auto px-4 py-6">
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center gap-8 py-16"
              >
                <div className="relative">
                  <div className="h-24 w-24 rounded-3xl bg-zinc-100 dark:bg-zinc-800/50 flex items-center justify-center shadow-sm ring-1 ring-black/5 dark:ring-white/10 backdrop-blur-xl transition-all duration-500 hover:scale-105">
                    <Sparkle weight="duotone" className="h-12 w-12 text-zinc-900 dark:text-zinc-100 drop-shadow-sm" />
                  </div>
                  <div className="absolute -top-1.5 -right-1.5 h-7 w-7 rounded-full bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center shadow-lg border-2 border-background">
                    <Lightning weight="fill" className="h-3.5 w-3.5 text-zinc-100 dark:text-zinc-900" />
                  </div>
                </div>

                <div className="text-center space-y-2 max-w-md">
                  <h3 className="text-2xl font-semibold tracking-tight">How can I help you today?</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    I can analyze your leads, clients, revenue, projects, and pipeline data. Ask me anything or try one of the suggestions below.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-2xl mt-4">
                  {quickCommands.map(q => {
                    const Icon = q.icon;
                    return (
                      <button
                        key={q.label}
                        onClick={() => setInput(q.cmd)}
                        className="flex items-center gap-3 p-3.5 rounded-2xl border bg-card/50 backdrop-blur-sm hover:bg-muted/80 hover:border-primary/30 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200 text-left group"
                      >
                        <div className={`p-1.5 rounded-lg bg-background shadow-sm border border-border/50 group-hover:scale-110 transition-transform ${q.color}`}>
                          <Icon weight="duotone" className="h-4.5 w-4.5" />
                        </div>
                        <span className="text-xs font-semibold leading-tight text-foreground/80 group-hover:text-foreground transition-colors">{q.label}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              <div className="space-y-6">
                <AnimatePresence initial={false}>
                  {messages.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {m.role === "assistant" && (
                        <div className="h-8 w-8 rounded-xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center shrink-0 mt-0.5 shadow-md border border-zinc-800 dark:border-zinc-200">
                          <Sparkle weight="duotone" className="h-4 w-4 text-zinc-100 dark:text-zinc-900" />
                        </div>
                      )}
                      <div className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-sm shadow-sm ${
                        m.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-background border rounded-bl-sm"
                      }`}>
                        {m.role === "assistant" ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 leading-relaxed [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:px-3 [&_th]:py-1.5 [&_th]:bg-muted [&_th]:text-left [&_th]:text-xs [&_th]:font-semibold [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-1.5 [&_td]:text-xs">
                            <ReactMarkdown>{m.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap leading-relaxed font-medium">{m.content}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3"
                  >
                    <div className="h-8 w-8 rounded-xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center shrink-0 shadow-md border border-zinc-800 dark:border-zinc-200">
                      <Sparkle weight="duotone" className="h-4 w-4 text-zinc-100 dark:text-zinc-900" />
                    </div>
                    <div className="bg-background border rounded-2xl rounded-bl-sm px-5 py-4 shadow-sm">
                      <div className="flex gap-1.5 items-center h-full">
                        <span className="h-2 w-2 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.3s]" />
                        <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.15s]" />
                        <span className="h-2 w-2 rounded-full bg-primary animate-bounce" />
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={scrollRef} />
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t bg-card/50 backdrop-blur-xl p-4 shrink-0">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-3 items-end relative">
              <div className="flex-1 relative shadow-sm rounded-2xl group focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <Input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder="Ask about leads, clients, revenue, projects..."
                  className="pr-12 h-14 text-[15px] rounded-2xl border-muted-foreground/20 bg-background/50 backdrop-blur-sm focus-visible:ring-0 focus-visible:border-primary/50"
                  disabled={loading}
                />
              </div>
              <Button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                size="icon"
                className="h-12 w-12 rounded-xl shrink-0 absolute right-1 bottom-1 shadow-md bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
              >
                {loading ? <SpinnerGap weight="bold" className="h-5 w-5 animate-spin text-white" /> : <PaperPlaneRight weight="fill" className="h-5 w-5 text-white ml-0.5" />}
              </Button>
            </div>
            <p className="text-[11px] font-medium text-muted-foreground/70 text-center mt-3 flex items-center justify-center gap-1.5">
              <Sparkle weight="duotone" className="h-3.5 w-3.5" />
              AI responses may not always be accurate. Verify important data.
            </p>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {voiceMode && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <VoiceAssistant onClose={() => setVoiceMode(false)} />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
