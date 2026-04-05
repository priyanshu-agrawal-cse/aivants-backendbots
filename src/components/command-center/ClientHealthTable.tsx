import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ClientHealth } from "@/hooks/useCommandCenterData";

const healthColors = {
  good: "bg-success/15 text-success border-success/30",
  warning: "bg-warning/15 text-warning border-warning/30",
  critical: "bg-destructive/15 text-destructive border-destructive/30",
};

const fmt = (v: number) => `₹${v.toLocaleString("en-IN")}`;

export function ClientHealthTable({ clients }: { clients: ClientHealth[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Client Health</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[280px]">
          {clients.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8 px-4">No clients yet</p>
          ) : (
            <div className="divide-y">
              {clients.map(c => (
                <div key={c.id} className="flex items-center justify-between px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.company || "—"}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className={`text-[10px] ${healthColors[c.healthScore]}`}>
                      {c.healthScore}
                    </Badge>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {c.lastContact !== null ? `${c.lastContact}d ago` : "—"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{fmt(c.lifetimeValue)} LTV</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
