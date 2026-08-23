"use client";

import { Card, CardContent } from "@/components/ui/card";
import { scoreLabel } from "@/lib/score-utils";

interface OverallScoreCardProps {
  score: number;
  tone: string;
  sentiment: string;
  targetAudience: string;
}

const RADIUS = 56;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function OverallScoreCard({
  score,
  tone,
  sentiment,
  targetAudience,
}: OverallScoreCardProps) {
  const { label, colorVar } = scoreLabel(score);
  const arc = (Math.max(0, Math.min(100, score)) / 100) * CIRCUMFERENCE;

  return (
    <Card className="relative overflow-hidden p-7 sm:p-9">
      {/* Score-tinted bloom, so the card's mood tracks the result. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -left-20 size-72 rounded-full opacity-25 blur-[90px]"
        style={{ background: colorVar }}
      />

      <CardContent className="relative flex flex-col items-center gap-8 p-0 sm:flex-row sm:justify-between">
        <div className="relative flex size-44 shrink-0 items-center justify-center">
          <svg viewBox="0 0 128 128" className="size-full -rotate-90">
            <defs>
              <linearGradient id="score-arc" x1="0" y1="128" x2="128" y2="0">
                <stop offset="0%" stopColor={colorVar} stopOpacity="0.55" />
                <stop offset="100%" stopColor={colorVar} />
              </linearGradient>
              <filter id="score-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <circle
              cx="64"
              cy="64"
              r={RADIUS}
              fill="none"
              stroke="var(--muted)"
              strokeWidth="11"
            />
            <circle
              cx="64"
              cy="64"
              r={RADIUS}
              fill="none"
              stroke="url(#score-arc)"
              strokeWidth="11"
              strokeLinecap="round"
              strokeDasharray={`${arc} ${CIRCUMFERENCE}`}
              filter="url(#score-glow)"
              className="animate-sweep"
              style={{ ["--dash-total" as string]: arc }}
            />
          </svg>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span
              data-numeric
              className="font-display text-5xl leading-none font-semibold"
            >
              {score}
            </span>
            <span className="mt-1 text-xs font-medium text-muted-foreground">/100</span>
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center gap-4 text-center sm:items-start sm:text-left">
          <div>
            <p className="text-[0.6875rem] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              Overall score
            </p>
            <p
              className="font-display mt-1 text-2xl font-semibold"
              style={{ color: colorVar }}
            >
              {label}
            </p>
          </div>

          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            This reflects content quality, not a guarantee of real-world engagement.
          </p>

          <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
            <span className="spectral-ring rounded-full bg-accent/60 px-3 py-1.5 text-xs font-medium text-accent-foreground capitalize">
              {tone} tone
            </span>
            <span className="rounded-full bg-accent/60 px-3 py-1.5 text-xs font-medium text-accent-foreground capitalize">
              {sentiment}
            </span>
            <span className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
              {targetAudience}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
