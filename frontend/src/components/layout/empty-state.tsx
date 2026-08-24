import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  /** Pass "alert" for genuine error states so assistive tech announces
   * them; omit for a plain empty/zero-data state. */
  role?: "alert";
}

/** Shared "nothing here yet" / "couldn't load this" / "not analyzed yet"
 * surface. History, Insights, and the results page used to each hand-roll
 * a near-identical block — this is the one shared version (see
 * docs/decisions.md). Renders an <h2>: every page that uses this already
 * has its own page-level <h1> above it. */
export function EmptyState({ icon: Icon, title, description, action, role }: EmptyStateProps) {
  return (
    <div role={role} className="flex flex-col items-center gap-5 py-24 text-center">
      <span className="flex size-14 items-center justify-center rounded-xl border border-border bg-muted">
        <Icon className="size-6 text-primary" aria-hidden="true" />
      </span>
      <div className="max-w-sm">
        <h2 className="font-display text-2xl font-medium">{title}</h2>
        <p className="mt-2 text-muted-foreground">{description}</p>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
