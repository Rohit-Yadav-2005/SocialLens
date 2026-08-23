import Link from "next/link";
import { FileWarning } from "lucide-react";

import { EmptyState } from "@/components/layout/empty-state";
import { Button } from "@/components/ui/button";

interface ResultsErrorProps {
  message: string;
}

export function ResultsError({ message }: ResultsErrorProps) {
  return (
    <EmptyState
      role="alert"
      icon={FileWarning}
      title="Couldn't load these results"
      description={message}
      action={
        <Button nativeButton={false} render={<Link href="/analyze" />}>
          Analyze new content
        </Button>
      }
    />
  );
}
