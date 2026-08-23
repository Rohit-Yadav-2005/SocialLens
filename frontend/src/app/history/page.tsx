"use client";

import Link from "next/link";
import { History } from "lucide-react";

import { HistoryTable } from "@/components/history/history-table";
import { ComingSoon } from "@/components/layout/coming-soon";
import { ResultsSkeleton } from "@/components/analysis/results-skeleton";
import { Button } from "@/components/ui/button";
import { useHistory } from "@/hooks/use-history";
import { getErrorMessage } from "@/lib/error-messages";

export default function HistoryPage() {
  const { rows, isLoading, error } = useHistory();

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="animate-fade-up">
        <p className="text-spectral text-xs font-semibold tracking-[0.18em] uppercase">
          Your library
        </p>
        <h1 className="font-display mt-3 text-4xl font-semibold sm:text-5xl">History</h1>
        <p className="mt-3 text-lg text-muted-foreground text-pretty">
          Every document you&apos;ve uploaded, with its most recent analysis.
        </p>
      </div>

      <div className="mt-8">
        {isLoading && <ResultsSkeleton />}

        {!isLoading && error && (
          <ComingSoon
            icon={History}
            title="Couldn't load history"
            description={getErrorMessage(error)}
          />
        )}

        {!isLoading && !error && rows.length === 0 && (
          <div className="relative flex flex-col items-center gap-5 py-24 text-center">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-16 left-1/2 size-64 -translate-x-1/2 rounded-full opacity-50 blur-[90px]"
              style={{ background: "var(--glow-primary)" }}
            />
            <span className="bg-spectral relative flex size-14 items-center justify-center rounded-2xl shadow-[0_1px_0_oklch(1_0_0/0.3)_inset,0_10px_30px_-10px_var(--glow-primary)]">
              <History className="size-6 text-white" aria-hidden="true" />
            </span>
            <div className="relative">
              <h2 className="font-display text-2xl font-semibold">No analyses yet</h2>
              <p className="mt-2 text-muted-foreground">
                Upload a PDF or image to see it show up here.
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

        {!isLoading && !error && rows.length > 0 && <HistoryTable rows={rows} />}
      </div>
    </div>
  );
}
