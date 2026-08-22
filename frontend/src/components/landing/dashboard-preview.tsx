import { Card } from "@/components/ui/card";

const DIMENSIONS = [
  { label: "Hook", width: "78%" },
  { label: "Clarity", width: "90%" },
  { label: "Engagement", width: "65%" },
  { label: "CTA", width: "55%" },
  { label: "Readability", width: "85%" },
];

/** A schematic, illustrative preview of the results dashboard — labels and
 * bar proportions only, no fabricated scores. Purely decorative. */
export function DashboardPreview() {
  return (
    <Card
      aria-hidden="true"
      className="w-full max-w-md border-border p-6 shadow-lg sm:p-7"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Overall score</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight">--/100</p>
        </div>
        <div className="flex size-14 items-center justify-center rounded-full border-4 border-primary/25" />
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {DIMENSIONS.map((dimension) => (
          <div key={dimension.label}>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{dimension.label}</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary/70"
                style={{ width: dimension.width }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
          Strengths
        </span>
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
          Weaknesses
        </span>
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
          Recommendations
        </span>
      </div>
    </Card>
  );
}
