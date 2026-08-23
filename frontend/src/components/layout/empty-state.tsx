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
 * a near-identical icon-square + heading + description block — this is
 * the one shared version (see docs/decisions.md). Renders an <h2>: every
 * page that uses this already has its own page-level <h1> above it. */
export function EmptyState({ icon: Icon, title, description, action, role }: EmptyStateProps) {
  return (
    <div role={role} className="relative flex flex-col items-center gap-5 py-24 text-center">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-16 left-1/2 size-64 -translate-x-1/2 rounded-full opacity-50 blur-[90px]"
        style={{ background: "var(--glow-primary)" }}
      />
      <span className="bg-spectral relative flex size-14 items-center justify-center rounded-2xl shadow-[0_1px_0_oklch(1_0_0/0.3)_inset,0_10px_30px_-10px_var(--glow-primary)]">
        <Icon className="size-6 text-white" aria-hidden="true" />
      </span>
      <div className="relative max-w-sm">
        <h2 className="font-display text-2xl font-semibold">{title}</h2>
        <p className="mt-2 text-muted-foreground">{description}</p>
      </div>
      {action && <div className="relative">{action}</div>}
    </div>
  );
}
