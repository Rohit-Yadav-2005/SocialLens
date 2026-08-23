"use client";

import Link from "next/link";
import { LineChart } from "lucide-react";

import { ResultsSkeleton } from "@/components/analysis/results-skeleton";
import { EmptyState } from "@/components/layout/empty-state";
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
          <EmptyState
            role="alert"
            icon={LineChart}
            title="Couldn't load insights"
            description={getErrorMessage(error)}
          />
        )}

        {!isLoading && !error && data && data.total_analyses === 0 && (
          <EmptyState
            icon={LineChart}
            title="Not enough data yet"
            description="Analyze a few posts and your averages, score trend, and common weaknesses will show up here."
            action={
              <Button size="lg" className="h-11 px-6" nativeButton={false} render={<Link href="/analyze" />}>
                Analyze content
              </Button>
            }
          />
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
