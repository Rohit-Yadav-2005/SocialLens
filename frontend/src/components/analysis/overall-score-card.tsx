"use client";

import { RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";

import { Card, CardContent } from "@/components/ui/card";
import { scoreLabel } from "@/lib/score-utils";

interface OverallScoreCardProps {
  score: number;
  tone: string;
  sentiment: string;
  targetAudience: string;
}

export function OverallScoreCard({
  score,
  tone,
  sentiment,
  targetAudience,
}: OverallScoreCardProps) {
  const { label, colorVar } = scoreLabel(score);
  const chartData = [{ value: score, fill: colorVar }];

  return (
    <Card className="border-border p-6 shadow-sm sm:p-7">
      <CardContent className="flex flex-col items-center gap-6 p-0 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex size-40 shrink-0 items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              data={chartData}
              startAngle={90}
              endAngle={-270}
              innerRadius="75%"
              outerRadius="100%"
              barSize={12}
            >
              <RadialBar
                dataKey="value"
                background={{ fill: "var(--muted)" }}
                cornerRadius={999}
                max={100}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-semibold tracking-tight">{score}</span>
            <span className="text-xs text-muted-foreground">/100</span>
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center gap-3 text-center sm:items-start sm:text-left">
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Overall score
            </p>
            <p className="mt-0.5 text-lg font-medium" style={{ color: colorVar }}>
              {label}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            This reflects content quality, not a guarantee of real-world engagement.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground capitalize">
              {tone} tone
            </span>
            <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground capitalize">
              {sentiment}
            </span>
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {targetAudience}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
