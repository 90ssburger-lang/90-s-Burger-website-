import { CreditCard } from "lucide-react";
import { format, parseISO } from "date-fns";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
} from "recharts";
import { useCardSalesMetrics } from "@/hooks/useCardSalesMetrics";
import { formatCurrency } from "@/lib/utils";

export function VisaSalesCard() {
  const { data, isLoading, error } = useCardSalesMetrics();

  const totalCents = data?.totalCardSalesCents ?? 0;
  const totalOrders = data?.totalCardOrders ?? 0;
  const totalAmount = totalCents / 100;
  const series = data?.timeseries ?? [];

  return (
    <div className="min-w-0 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex min-w-0 items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-5 text-muted-foreground">VISA Sales</p>
          <p className="mt-3 whitespace-nowrap font-display text-[clamp(1.5rem,2vw,1.875rem)] font-bold leading-tight tracking-tight text-foreground">
            {isLoading ? "..." : formatCurrency(totalAmount)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {totalOrders.toLocaleString()} orders
          </p>
          {error && (
            <p className="text-xs text-destructive mt-2">Unable to load card sales.</p>
          )}
        </div>
        <div className="shrink-0 rounded-xl bg-muted p-3 text-amber-600">
          <CreditCard className="h-6 w-6" />
        </div>
      </div>

      <div className="mt-4 h-16">
        {series.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series}>
              <XAxis
                dataKey="date"
                hide
                tickFormatter={(value) => format(parseISO(value), "MMM d")}
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [formatCurrency(value / 100), "Sales"]}
                labelFormatter={(label) => format(parseISO(label as string), "MMM d, yyyy")}
              />
              <Line
                type="monotone"
                dataKey="salesCents"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
            {isLoading ? "Loading..." : "No card sales yet"}
          </div>
        )}
      </div>
    </div>
  );
}
