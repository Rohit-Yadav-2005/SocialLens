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
import { scoreLabel } from "@/lib/score-utils";
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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Score breakdown</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-8 lg:grid-cols-[minmax(0,340px)_1fr] lg:items-center">
        <div className="relative h-72">
          {/* Bloom behind the radar so it doesn't float on a flat plane. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-8 rounded-full blur-[60px]"
            style={{ background: "var(--glow-primary)" }}
          />
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={chartData} outerRadius="72%">
              <PolarGrid stroke="var(--border)" strokeDasharray="3 3" />
              <PolarAngleAxis
                dataKey="dimension"
                tick={{ fill: "var(--muted-foreground)", fontSize: 12, fontWeight: 500 }}
              />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                dataKey="score"
                stroke="var(--primary)"
                strokeWidth={2}
                fill="var(--primary)"
                fillOpacity={0.28}
                dot={{ r: 3, fill: "var(--primary)", strokeWidth: 0 }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {DIMENSIONS.map((dimension, index) => {
            const value = analysis[dimension.key];
            const { colorVar } = scoreLabel(value);

            return (
              <div
                key={dimension.key}
                style={{ animationDelay: `${index * 70}ms` }}
                className="animate-fade-up group rounded-xl border border-border/70 bg-background/40 p-4 transition-colors hover:border-border"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium">{dimension.label}</span>
                  <span
                    data-numeric
                    className="font-display text-lg font-semibold"
                    style={{ color: colorVar }}
                  >
                    {value}
                  </span>
                </div>

                <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="animate-grow-bar h-full origin-left rounded-full"
                    style={{
                      width: `${value}%`,
                      background: `linear-gradient(90deg, color-mix(in oklch, ${colorVar}, transparent 45%), ${colorVar})`,
                      animationDelay: `${index * 70 + 120}ms`,
                    }}
                  />
                </div>

                <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
                  {dimension.description}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
