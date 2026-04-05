import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

type KPIProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
  subtext?: string;
};

export function KPICard({ label, value, icon: Icon, color = "text-primary", subtext }: KPIProps) {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="text-2xl font-semibold tracking-tight">{value}</p>
            {subtext && <p className="text-[11px] text-muted-foreground">{subtext}</p>}
          </div>
          <div className={`rounded-lg p-2 ${color} opacity-40`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function KPISection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      {title && (
        <h3 className="text-sm font-medium text-muted-foreground mb-4">{title}</h3>
      )}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {children}
      </div>
    </div>
  );
}
