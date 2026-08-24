"use client";

import Link from "next/link";
import { History } from "lucide-react";

import { HistoryTable } from "@/components/history/history-table";
import { EmptyState } from "@/components/layout/empty-state";
import { ResultsSkeleton } from "@/components/analysis/results-skeleton";
import { Button } from "@/components/ui/button";
import { useHistory } from "@/hooks/use-history";
import { getErrorMessage } from "@/lib/error-messages";

export default function HistoryPage() {
  const { rows, isLoading, error } = useHistory();

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="animate-fade-up">
        <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
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
          <EmptyState
            role="alert"
            icon={History}
            title="Couldn't load history"
            description={getErrorMessage(error)}
          />
        )}

        {!isLoading && !error && rows.length === 0 && (
          <EmptyState
            icon={History}
            title="No analyses yet"
            description="Upload a PDF or image to see it show up here."
            action={
              <Button size="lg" className="h-11 px-6" nativeButton={false} render={<Link href="/analyze" />}>
                Analyze content
              </Button>
            }
          />
        )}

        {!isLoading && !error && rows.length > 0 && <HistoryTable rows={rows} />}
      </div>
    </div>
  );
}
