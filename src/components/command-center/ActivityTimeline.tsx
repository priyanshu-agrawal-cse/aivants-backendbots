import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, parseISO } from "date-fns";
import type { ActivityItem } from "@/hooks/useCommandCenterData";
import { Users, Mail, CalendarCheck, FileText, Briefcase, FolderKanban } from "lucide-react";

const typeConfig: Record<string, { icon: any; color: string }> = {
  lead: { icon: Users, color: "text-primary" },
  email: { icon: Mail, color: "text-accent" },
  meeting: { icon: CalendarCheck, color: "text-warning" },
  proposal: { icon: FileText, color: "text-chart-4" },
  client: { icon: Briefcase, color: "text-success" },
  project: { icon: FolderKanban, color: "text-muted-foreground" },
};

export function ActivityTimeline({ items }: { items: ActivityItem[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Live Activity</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[320px] px-4 pb-4">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {items.map(item => {
                const config = typeConfig[item.type] || typeConfig.lead;
                const Icon = config.icon;
                let timeStr = "";
                try { timeStr = format(parseISO(item.time), "HH:mm"); } catch {}
                return (
                  <div key={item.id} className="flex items-start gap-3">
                    <div className={`mt-0.5 ${config.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate" title={item.description}>{item.description}</p>
                      <p className="text-xs text-muted-foreground">{timeStr}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
