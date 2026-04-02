"use client";

import * as React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { TrendingUp, ShoppingBag } from "lucide-react";

interface ChartsProps {
  lineData: { name: string; revenue: number }[];
  barData: { name: string; sales: number }[];
}

export default function AnalyticsCharts({ lineData, barData }: ChartsProps) {
  // We use a state to ensure we only render on the client
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="h-[300px] w-full bg-neutral-50 animate-pulse rounded-xl" />;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* ── Revenue Line Chart ───────────── */}
      <div className="rounded-xl border bg-card p-6 shadow-sm border-neutral-100">
        <h4 className="text-sm font-semibold mb-6 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Revenue Trends (Last 30 Days)
        </h4>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: "#888" }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: "#888" }}
              />
              <Tooltip 
                 contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#3b82f6" 
                strokeWidth={3} 
                dot={{ r: 4, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Top Selling Bar Chart ─────────── */}
      <div className="rounded-xl border bg-card p-6 shadow-sm border-neutral-100">
        <h4 className="text-sm font-semibold mb-6 flex items-center gap-2">
          <ShoppingBag className="h-4 w-4 text-purple-500" />
          Best Sellers (Quantity)
        </h4>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} layout="vertical" margin={{ left: 40, right: 20 }}>
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fontWeight: 500, fill: "#333" }}
                width={100}
              />
              <Tooltip 
                 cursor={{ fill: '#f8fafc' }}
                 contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="sales" radius={[0, 4, 4, 0]} barSize={24}>
                {barData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={["#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe"][index % 5]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
