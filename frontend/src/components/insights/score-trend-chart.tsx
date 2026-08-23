"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ScoreTrendPoint } from "@/types/api";

const MIN_POINTS_FOR_TREND = 2;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

interface ScoreTrendChartProps {
  points: ScoreTrendPoint[];
}

export function ScoreTrendChart({ points }: ScoreTrendChartProps) {
  const hasEnoughData = points.length >= MIN_POINTS_FOR_TREND;
  const chartData = points.map((point) => ({
    date: formatDate(point.date),
    score: point.overall_score,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Score trend</CardTitle>
        <p className="text-sm text-muted-foreground">Overall score across your analyses over time</p>
      </CardHeader>
      <CardContent>
        {hasEnoughData ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.42} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="trend-stroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="var(--chart-1)" />
                    <stop offset="100%" stopColor="var(--chart-3)" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: "var(--border)" }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={36}
                />
                <Tooltip
                  cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-lg)",
                    fontSize: 12,
                    boxShadow: "var(--shadow-card)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="url(#trend-stroke)"
                  strokeWidth={2.5}
                  fill="url(#trend-fill)"
                  dot={{ r: 3, fill: "var(--chart-1)", strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "var(--chart-1)", strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Analyze at least {MIN_POINTS_FOR_TREND} posts to see a trend here.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
