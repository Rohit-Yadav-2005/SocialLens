"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WeaknessCategoryCount } from "@/types/api";

interface CommonWeaknessesChartProps {
  weaknesses: WeaknessCategoryCount[];
}

export function CommonWeaknessesChart({ weaknesses }: CommonWeaknessesChartProps) {
  const hasData = weaknesses.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Most common weaknesses</CardTitle>
        <p className="text-sm text-muted-foreground">
          Grouped from AI-identified weaknesses by keyword — an approximate signal, not an
          exact count.
        </p>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div style={{ height: Math.max(160, weaknesses.length * 44) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={weaknesses}
                layout="vertical"
                margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: "var(--border)" }}
                />
                <YAxis
                  type="category"
                  dataKey="category"
                  width={130}
                  tick={{ fill: "var(--foreground)", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: "var(--muted)", opacity: 0.5 }}
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-lg)",
                    fontSize: 12,
                    boxShadow: "var(--shadow-2)",
                  }}
                />
                <Bar dataKey="count" fill="var(--chart-2)" radius={[0, 4, 4, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No common weaknesses identified yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
