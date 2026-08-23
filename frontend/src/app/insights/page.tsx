"use client";

import Link from "next/link";
import { LineChart } from "lucide-react";

import { ResultsSkeleton } from "@/components/analysis/results-skeleton";
import { ComingSoon } from "@/components/layout/coming-soon";
import { CommonWeaknessesChart } from "@/components/insights/common-weaknesses-chart";
import { ScoreTrendChart } from "@/components/insights/score-trend-chart";
import { StatTile } from "@/components/insights/stat-tile";
import { Button } from "@/components/ui/button";
import { useInsights } from "@/hooks/use-insights";
import { getErrorMessage } from "@/lib/error-messages";

function formatScore(value: number | null): string {
  return value === null ? "—" : value.toFixed(0);
}

export default function InsightsPage() {
  const { data, isLoading, error } = useInsights();

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="animate-fade-up">
        <p className="text-spectral text-xs font-semibold tracking-[0.18em] uppercase">
          Aggregate view
        </p>
        <h1 className="font-display mt-3 text-4xl font-semibold sm:text-5xl">Insights</h1>
        <p className="mt-3 text-lg text-muted-foreground text-pretty">
          Aggregate stats across every analysis you&apos;ve run.
        </p>
      </div>

      <div className="mt-8">
        {isLoading && <ResultsSkeleton />}

        {!isLoading && error && (
          <ComingSoon
            icon={LineChart}
            title="Couldn't load insights"
            description={getErrorMessage(error)}
          />
        )}

        {!isLoading && !error && data && data.total_analyses === 0 && (
          <div className="relative flex flex-col items-center gap-5 py-24 text-center">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-16 left-1/2 size-64 -translate-x-1/2 rounded-full opacity-50 blur-[90px]"
              style={{ background: "var(--glow-primary)" }}
            />
            <span className="bg-spectral relative flex size-14 items-center justify-center rounded-2xl shadow-[0_1px_0_oklch(1_0_0/0.3)_inset,0_10px_30px_-10px_var(--glow-primary)]">
              <LineChart className="size-6 text-white" aria-hidden="true" />
            </span>
            <div className="relative">
              <h2 className="font-display text-2xl font-semibold">Not enough data yet</h2>
              <p className="mx-auto mt-2 max-w-sm text-muted-foreground">
                Analyze a few posts and your averages, score trend, and common weaknesses will
                show up here.
              </p>
            </div>
            <Button
              size="lg"
              className="relative h-11 px-6"
              nativeButton={false}
              render={<Link href="/analyze" />}
            >
              Analyze content
            </Button>
          </div>
        )}

        {!isLoading && !error && data && data.total_analyses > 0 && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatTile label="Total analyses" value={String(data.total_analyses)} />
              <StatTile label="Avg. overall score" value={formatScore(data.average_overall_score)} />
              <StatTile label="Avg. hook score" value={formatScore(data.average_hook_score)} />
              <StatTile label="Avg. CTA score" value={formatScore(data.average_cta_score)} />
            </div>

            <ScoreTrendChart points={data.score_trend} />
            <CommonWeaknessesChart weaknesses={data.common_weaknesses} />
          </div>
        )}
      </div>
    </div>
  );
}
