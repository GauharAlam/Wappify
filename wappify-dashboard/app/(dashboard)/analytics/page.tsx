"use client";

import { useEffect, useState } from "react";
import { DollarSign, Users, ShoppingCart, Zap, BarChart3, PieChart, ArrowUpRight, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AnalyticsSummary {
  totalRevenue: number;
  totalCustomers: number;
  paidOrdersCount: number;
  aov: number;
}

interface AnalyticsData {
  summary: AnalyticsSummary;
  chartData: { date: string; revenue: number; orders: number }[];
  orderDistribution: { status: string; count: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setData(json);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground italic">Crunching the numbers...</p>
      </div>
    );
  }

  if (!data) return <p>Failed to load analytics.</p>;

  const maxRevenue = Math.max(...data.chartData.map((d) => d.revenue), 100);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
      {/* ── Page Header ───────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Business Insights</h1>
        <p className="text-sm text-muted-foreground">Performance metrics for the last 30 days.</p>
      </div>

      {/* ── Summary Grid ──────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Revenue", value: `₹${data.summary.totalRevenue}`, icon: DollarSign, trend: "+12.5%", trendUp: true },
          { label: "Total Customers", value: data.summary.totalCustomers, icon: Users, trend: "+45", trendUp: true },
          { label: "Paid Orders", value: data.summary.paidOrdersCount, icon: ShoppingCart, trend: "+8.2%", trendUp: true },
          { label: "Avg. Order Value", value: `₹${Math.round(data.summary.aov)}`, icon: Zap, trend: "+2.1%", trendUp: true },
        ].map((card, idx) => (
          <Card key={idx} className="relative overflow-hidden border-none bg-card/60 shadow-sm backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {card.label}
              </CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <card.icon className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <div className="mt-1 flex items-center gap-1.5">
                <span className={cn("flex items-center text-[10px] font-bold", card.trendUp ? "text-green-600" : "text-red-600")}>
                  {card.trendUp ? <TrendingUp className="mr-1 h-2.5 w-2.5" /> : <TrendingDown className="mr-1 h-2.5 w-2.5" />}
                  {card.trend}
                </span>
                <span className="text-[10px] text-muted-foreground/60 font-medium">from last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Revenue Chart (CSS Bars) ─────────── */}
        <Card className="border-none shadow-sm bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold">Revenue Trend (30d)</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground">Daily revenue performance in INR.</p>
          </CardHeader>
          <CardContent>
            <div className="flex h-56 items-end justify-between gap-1 pt-4">
              {data.chartData.map((d, i) => {
                const height = (d.revenue / maxRevenue) * 100;
                return (
                  <div key={i} className="group relative flex h-full grow flex-col justify-end">
                    <div
                      className="w-full rounded-t-sm bg-primary/20 transition-all duration-300 group-hover:bg-primary"
                      style={{ height: `${height}%`, minHeight: d.revenue > 0 ? '4px' : '0' }}
                    />
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 rounded border bg-popover px-2 py-1 text-[10px] font-bold shadow-sm opacity-0 transition-opacity group-hover:opacity-100 whitespace-nowrap z-10">
                      ₹{d.revenue}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex justify-between border-t pt-2 text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
              <span>{data.chartData[0]?.date}</span>
              <span>{data.chartData[29]?.date}</span>
            </div>
          </CardContent>
        </Card>

        {/* ── Top Products ─────────────────────── */}
        <Card className="border-none shadow-sm bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold">Top Selling Products</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground">Bestsellers by quantity sold.</p>
          </CardHeader>
          <CardContent className="px-0">
            <div className="divide-y divide-border/50">
              {data.topProducts.map((p, i) => (
                <div key={i} className="flex items-center justify-between px-6 py-4 hover:bg-primary/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold ring-2 ring-background">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold truncate max-w-[180px]">{p.name}</p>
                      <p className="text-[10px] font-medium text-muted-foreground">{p.quantity} units sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">₹{p.revenue}</p>
                    <p className="text-[10px] font-medium text-muted-foreground">Revenue</p>
                  </div>
                </div>
              ))}
              {data.topProducts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground italic">
                  <p className="text-xs">No sales data yet.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
         {/* ── Order Distribution ────────────────── */}
         <Card className="border-none shadow-sm bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <PieChart className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold">Order Distribution</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground">Breakdown of orders by current status.</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.orderDistribution.map((s, idx) => {
                const colors: Record<string, string> = {
                  PAID: "bg-green-500",
                  PENDING: "bg-orange-500",
                  SHIPPED: "bg-blue-500",
                  DELIVERED: "bg-indigo-500",
                  CANCELLED: "bg-red-500",
                };
                const total = data.orderDistribution.reduce((acc, curr) => acc + curr.count, 0);
                const percent = Math.round((s.count / total) * 100);

                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider">
                      <span>{s.status}</span>
                      <span className="text-muted-foreground">{s.count} Orders ({percent}%)</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted/40">
                      <div
                        className={cn("h-full transition-all duration-1000", colors[s.status as keyof typeof colors] || "bg-primary")}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {data.orderDistribution.length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-8">No orders to display.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── System Health ─────────────────────── */}
        <Card className="border-none shadow-sm bg-card/60 border-primary/10 bg-gradient-to-br from-primary/10 to-transparent backdrop-blur-sm">
          <CardHeader>
             <CardTitle className="text-sm font-semibold">Merchant Goal Status</CardTitle>
             <p className="text-xs text-muted-foreground">Current monthly targets vs performance.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl bg-background/50 p-4 border border-border/50">
               <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Growth Phase</p>
                  <Badge variant="success" className="text-[9px]">ON TRACK</Badge>
               </div>
               <div className="text-2xl font-bold mb-1">Accelerating 🚀</div>
               <p className="text-[10px] leading-relaxed text-muted-foreground">Your customer base grew by 45 this month. Suggest sending a catalog update to re-engage past customers!</p>
            </div>
            <div className="flex flex-col gap-2">
               <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  <span>Conversion Rate</span>
                  <span>4.2%</span>
               </div>
               <div className="h-1.5 w-full bg-muted/50 rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[42%] rounded-full shadow-[0_0_8px_rgba(var(--primary),0.5)]"></div>
               </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
