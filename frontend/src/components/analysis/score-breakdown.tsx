"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnalysisResponse } from "@/types/api";

interface Dimension {
  key: keyof Pick<
    AnalysisResponse,
    "hook_score" | "clarity_score" | "engagement_score" | "cta_score" | "readability_score"
  >;
  label: string;
  description: string;
}

const DIMENSIONS: Dimension[] = [
  { key: "hook_score", label: "Hook", description: "Strength of the opening line" },
  { key: "clarity_score", label: "Clarity", description: "How easy the message is to follow" },
  { key: "engagement_score", label: "Engagement", description: "Likelihood of inviting interaction" },
  { key: "cta_score", label: "CTA", description: "Strength of the call to action" },
  { key: "readability_score", label: "Readability", description: "Deterministic, Flesch-based" },
];

interface ScoreBreakdownProps {
  analysis: AnalysisResponse;
}

export function ScoreBreakdown({ analysis }: ScoreBreakdownProps) {
  const chartData = DIMENSIONS.map((dimension) => ({
    dimension: dimension.label,
    score: analysis[dimension.key],
  }));

  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <CardTitle>Score breakdown</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr] lg:items-center">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={chartData} outerRadius="72%">
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis
                dataKey="dimension"
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                dataKey="score"
                stroke="var(--primary)"
                fill="var(--primary)"
                fillOpacity={0.25}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {DIMENSIONS.map((dimension) => {
            const value = analysis[dimension.key];
            return (
              <div
                key={dimension.key}
                className="rounded-lg border border-border p-3.5"
              >
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-medium">{dimension.label}</span>
                  <span className="text-sm font-semibold tabular-nums">{value}</span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${value}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{dimension.description}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
