import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PipelineStage } from "@/hooks/useCommandCenterData";

const stageLabels: Record<string, string> = {
  prospect: "Leads",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  closed: "Closed",
};

const stageColors = [
  "bg-primary/20 text-primary border-primary/30",
  "bg-accent/20 text-accent border-accent/30",
  "bg-warning/20 text-warning border-warning/30",
  "bg-[hsl(280,65%,55%)]/20 text-[hsl(280,65%,55%)] border-[hsl(280,65%,55%)]/30",
  "bg-success/20 text-success border-success/30",
];

const fmt = (v: number) => `₹${v.toLocaleString("en-IN")}`;

export function DealPipelineVisual({ stages }: { stages: PipelineStage[] }) {
  const maxCount = Math.max(...stages.map(s => s.count), 1);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Deal Pipeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2">
          {stages.map((stage, i) => {
            const height = stage.count > 0 ? Math.max(20, (stage.count / maxCount) * 100) : 8;
            return (
              <div key={stage.stage} className="flex-1 flex flex-col items-center gap-2">
                <div className="text-center">
                  <p className="text-lg font-bold">{stage.count}</p>
                  <p className="text-[10px] text-muted-foreground">{fmt(stage.value)}</p>
                </div>
                <div
                  className={`w-full rounded-t-md border ${stageColors[i]}`}
                  style={{ height: `${height}px` }}
                />
                <p className="text-[10px] font-medium text-center">{stageLabels[stage.stage] || stage.stage}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
