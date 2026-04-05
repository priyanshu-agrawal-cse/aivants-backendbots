import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Send, Loader2, Flame, AlertTriangle, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Opportunity = {
  title: string;
  description: string;
  type: "revenue" | "risk" | "action";
};

type Props = {
  businessContext: string;
};

export function AIOpportunityScanner({ businessContext }: Props) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function scan() {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-command-center", {
        body: { action: "scan_opportunities", context: businessContext },
      });
      if (error) throw error;
      if (data?.opportunities) setOpportunities(data.opportunities);
    } catch (e: any) {
      toast({ title: "AI Error", description: e.message, variant: "destructive" });
    }
    setLoading(false);
  }

  const iconMap = {
    revenue: <TrendingUp className="h-3.5 w-3.5 text-success" />,
    risk: <AlertTriangle className="h-3.5 w-3.5 text-warning" />,
    action: <Flame className="h-3.5 w-3.5 text-destructive" />,
  };

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" /> AI Opportunity Scanner
        </CardTitle>
        <Button size="sm" variant="outline" onClick={scan} disabled={loading} className="gap-1 text-xs">
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          Scan
        </Button>
      </CardHeader>
      <CardContent>
        {opportunities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Click "Scan" to find hidden revenue opportunities
          </p>
        ) : (
          <div className="space-y-2">
            {opportunities.map((o, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50">
                {iconMap[o.type]}
                <div>
                  <p className="text-sm font-medium">{o.title}</p>
                  <p className="text-xs text-muted-foreground">{o.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AIAssistant({ businessContext }: Props) {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function ask() {
    if (!query.trim()) return;
    setLoading(true);
    setResponse("");
    try {
      const { data, error } = await supabase.functions.invoke("ai-command-center", {
        body: { action: "assistant", query, context: businessContext },
      });
      if (error) throw error;
      setResponse(data?.answer || "No response");
    } catch (e: any) {
      toast({ title: "AI Error", description: e.message, variant: "destructive" });
    }
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" /> AI Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="Ask: Show high value leads, overdue payments..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && ask()}
            className="text-sm"
          />
          <Button size="icon" onClick={ask} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        {response && (
          <ScrollArea className="max-h-[200px]">
            <div className="text-sm bg-muted/50 rounded-lg p-3 whitespace-pre-wrap">{response}</div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
