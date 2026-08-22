"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

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
    <Card className="border-border shadow-sm">
      <CardHeader>
        <CardTitle>Score trend</CardTitle>
        <p className="text-sm text-muted-foreground">Overall score across your analyses over time</p>
      </CardHeader>
      <CardContent>
        {hasEnoughData ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
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
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "var(--primary)" }}
                />
              </LineChart>
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
