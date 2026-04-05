import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IndianRupee, TrendingUp, TrendingDown, Timer } from "lucide-react";

const fmt = (v: number) => `₹${v.toLocaleString("en-IN")}`;

type Props = {
  totalRevenue: number;
  totalExpenses: number;
  profit: number;
  cashRunway: number;
};

export function FinancialHealth({ totalRevenue, totalExpenses, profit, cashRunway }: Props) {
  const items = [
    { label: "Revenue", value: fmt(totalRevenue), icon: IndianRupee, color: "text-success" },
    { label: "Expenses", value: fmt(totalExpenses), icon: TrendingDown, color: "text-destructive" },
    { label: "Profit", value: fmt(profit), icon: TrendingUp, color: profit >= 0 ? "text-success" : "text-destructive" },
    { label: "Cash Runway", value: `${cashRunway} mo`, icon: Timer, color: "text-primary" },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Financial Health</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {items.map(i => (
            <div key={i.label} className="flex items-center gap-2">
              <i.icon className={`h-4 w-4 ${i.color}`} />
              <div>
                <p className="text-xs text-muted-foreground">{i.label}</p>
                <p className="text-sm font-semibold">{i.value}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
