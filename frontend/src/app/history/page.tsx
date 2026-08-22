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
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">History</h1>
        <p className="mt-1 text-sm text-muted-foreground">
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
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-accent">
              <History className="size-6 text-primary" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-semibold">No analyses yet</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Upload a PDF or image to see it show up here.
              </p>
            </div>
            <Button nativeButton={false} render={<Link href="/analyze" />}>
              Analyze content
            </Button>
          </div>
        )}

        {!isLoading && !error && rows.length > 0 && <HistoryTable rows={rows} />}
      </div>
    </div>
  );
}
