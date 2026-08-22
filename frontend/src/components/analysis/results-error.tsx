import Link from "next/link";
import { FileWarning } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ResultsErrorProps {
  message: string;
}

export function ResultsError({ message }: ResultsErrorProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center" role="alert">
      <span className="flex size-12 items-center justify-center rounded-full bg-accent">
        <FileWarning className="size-6 text-primary" aria-hidden="true" />
      </span>
      <div>
        <h1 className="text-lg font-semibold">Couldn&apos;t load these results</h1>
        <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      </div>
      <Button nativeButton={false} render={<Link href="/analyze" />}>
        Analyze new content
      </Button>
    </div>
  );
}
