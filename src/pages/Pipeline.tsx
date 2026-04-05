import { useEffect, useState, DragEvent } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface PipelineLead {
  id: string;
  pipeline_id: string;
  first_name: string;
  last_name: string | null;
  company_name: string | null;
  score: number | null;
  stage: string;
  meeting_booked: boolean;
  client_won: boolean;
}

const stages = [
  "New Lead",
  "Contacted",
  "Interested",
  "Meeting Scheduled",
  "Proposal Sent",
  "Client Won",
  "Client Lost",
];

const stageToLeadStatus: Record<string, string> = {
  "New Lead": "new",
  "Contacted": "contacted",
  "Interested": "interested",
  "Meeting Scheduled": "meeting",
  "Proposal Sent": "meeting",
  "Client Won": "meeting",
  "Client Lost": "meeting",
};

function getScoreColor(score: number | null) {
  if (!score) return "bg-muted text-muted-foreground";
  if (score >= 90) return "bg-success text-success-foreground";
  if (score >= 70) return "bg-warning text-warning-foreground";
  return "bg-muted text-muted-foreground";
}

const stageColors: Record<string, string> = {
  "New Lead": "border-t-primary",
  "Contacted": "border-t-chart-3",
  "Interested": "border-t-accent",
  "Meeting Scheduled": "border-t-chart-4",
  "Proposal Sent": "border-t-chart-1",
  "Client Won": "border-t-success",
  "Client Lost": "border-t-destructive",
};

export default function Pipeline() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [leads, setLeads] = useState<PipelineLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  const fetchPipeline = async () => {
    if (!user) return;
    setLoading(true);

    // Get all leads with their pipeline stages
    const { data: leadsData } = await supabase
      .from("leads")
      .select("id, first_name, last_name, company_name, score")
      .eq("user_id", user.id);

    const { data: pipelineData } = await supabase
      .from("pipeline_stages")
      .select("*")
      .eq("user_id", user.id);

    const allLeads = leadsData || [];
    const allPipeline = pipelineData || [];

    // Map pipeline entries to leads
    const pipelineMap = new Map(allPipeline.map((p) => [p.lead_id, p]));

    const mapped: PipelineLead[] = allLeads.map((lead) => {
      const p = pipelineMap.get(lead.id);
      return {
        id: lead.id,
        pipeline_id: p?.id || "",
        first_name: lead.first_name,
        last_name: lead.last_name,
        company_name: lead.company_name,
        score: lead.score,
        stage: p?.stage || "New Lead",
        meeting_booked: p?.meeting_booked || false,
        client_won: p?.client_won || false,
      };
    });

    setLeads(mapped);
    setLoading(false);
  };

  useEffect(() => { fetchPipeline(); }, [user]);

  const moveToStage = async (leadId: string, newStage: string) => {
    if (!user) return;

    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.stage === newStage) return;

    // Optimistic update
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? {
              ...l,
              stage: newStage,
              meeting_booked: newStage === "Meeting Scheduled" || ["Proposal Sent", "Client Won"].includes(newStage),
              client_won: newStage === "Client Won",
            }
          : l
      )
    );

    const pipelinePayload = {
      stage: newStage,
      meeting_booked: ["Meeting Scheduled", "Proposal Sent", "Client Won"].includes(newStage),
      client_won: newStage === "Client Won",
      updated_at: new Date().toISOString(),
    };

    if (lead.pipeline_id) {
      // Update existing pipeline entry
      const { error } = await supabase
        .from("pipeline_stages")
        .update(pipelinePayload)
        .eq("id", lead.pipeline_id);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        fetchPipeline();
        return;
      }
    } else {
      // Create new pipeline entry
      const { error } = await supabase
        .from("pipeline_stages")
        .insert({ ...pipelinePayload, user_id: user.id, lead_id: leadId });
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        fetchPipeline();
        return;
      }
    }

    // Also update the lead status
    const newStatus = stageToLeadStatus[newStage] || "new";
    await supabase.from("leads").update({ status: newStatus, updated_at: new Date().toISOString() }).eq("id", leadId);

    // Refresh to get updated pipeline_id
    fetchPipeline();
  };

  // Drag handlers
  const handleDragStart = (e: DragEvent, leadId: string) => {
    setDraggedId(leadId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", leadId);
  };

  const handleDragOver = (e: DragEvent, stage: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStage(stage);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (e: DragEvent, stage: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("text/plain");
    setDraggedId(null);
    setDragOverStage(null);
    if (leadId) moveToStage(leadId, stage);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverStage(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pipeline</h1>
        <p className="text-muted-foreground">Drag leads between stages to update their status</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center"><Loader2 className="h-5 w-5 animate-spin" /> Loading pipeline…</div>
      ) : leads.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No leads yet. Add leads first to see them in the pipeline.</p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="w-full">
          <div className="flex gap-4 pb-4" style={{ minWidth: stages.length * 260 }}>
            {stages.map((stage) => {
              const stageLeads = leads.filter((l) => l.stage === stage);
              const isOver = dragOverStage === stage;
              return (
                <div
                  key={stage}
                  className="w-[250px] flex-shrink-0"
                  onDragOver={(e) => handleDragOver(e, stage)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, stage)}
                >
                  <div
                    className={`rounded-lg border border-t-4 ${stageColors[stage]} bg-card transition-colors ${
                      isOver ? "ring-2 ring-primary/40 bg-primary/5" : ""
                    }`}
                  >
                    <div className="p-3 border-b">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm">{stage}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {stageLeads.length}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-2 space-y-2 min-h-[200px]">
                      {stageLeads.map((lead) => (
                        <Card
                          key={lead.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, lead.id)}
                          onDragEnd={handleDragEnd}
                          className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${
                            draggedId === lead.id ? "opacity-40 scale-95" : ""
                          }`}
                        >
                          <CardContent className="p-3">
                            <div className="font-medium text-sm">
                              {lead.first_name} {lead.last_name || ""}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {lead.company_name || "No company"}
                            </div>
                            {lead.score != null && (
                              <div className="mt-2">
                                <Badge className={`text-xs ${getScoreColor(lead.score)}`}>
                                  Score: {lead.score}
                                </Badge>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
    </div>
  );
}
