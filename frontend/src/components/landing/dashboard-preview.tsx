const DIMENSIONS = [
  { label: "Hook", width: "78%" },
  { label: "Clarity", width: "90%" },
  { label: "Engagement", width: "65%" },
  { label: "CTA", width: "55%" },
  { label: "Readability", width: "85%" },
];

/** A schematic, illustrative preview of the results dashboard — labels and
 * bar proportions only, no fabricated scores. Purely decorative.
 * The `--/100` placeholder is deliberate: never show a specific fake score
 * here, even as marketing art (see docs/decisions.md). */
export function DashboardPreview() {
  return (
    <div aria-hidden="true" className="relative w-full max-w-md">
      {/* Stacked ghost cards behind, for depth. */}
      <div className="absolute -top-3 right-3 left-3 h-full rounded-3xl border border-border/50 bg-card/40 backdrop-blur-sm" />
      <div className="absolute -top-1.5 right-1.5 left-1.5 h-full rounded-3xl border border-border/60 bg-card/60 backdrop-blur-sm" />

      {/* Spectral bloom behind the card. */}
      <div
        className="pointer-events-none absolute -inset-8 rounded-full blur-[70px]"
        style={{ background: "var(--glow-primary)" }}
      />

      <div className="animate-float shadow-lift relative overflow-hidden rounded-3xl border border-border/70 bg-card/90 p-7 backdrop-blur-xl">
        <span className="spectral-ring pointer-events-none absolute inset-0 rounded-3xl opacity-60" />

        <div className="flex items-start justify-between">
          <div>
            <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              Overall score
            </p>
            <p
              data-numeric
              className="font-display mt-1.5 text-5xl leading-none font-semibold"
            >
              <span className="text-spectral">--</span>
              <span className="text-2xl text-muted-foreground">/100</span>
            </p>
          </div>

          {/* Spectral progress ring — indeterminate, matching the `--` score. */}
          <div className="relative size-16 shrink-0">
            <svg viewBox="0 0 64 64" className="size-full -rotate-90">
              <defs>
                <linearGradient id="preview-ring" x1="0" y1="64" x2="64" y2="0">
                  <stop offset="0%" stopColor="oklch(0.72 0.2 305)" />
                  <stop offset="50%" stopColor="oklch(0.66 0.19 268)" />
                  <stop offset="100%" stopColor="oklch(0.78 0.14 186)" />
                </linearGradient>
              </defs>
              <circle
                cx="32"
                cy="32"
                r="26"
                fill="none"
                stroke="var(--muted)"
                strokeWidth="7"
              />
              <circle
                cx="32"
                cy="32"
                r="26"
                fill="none"
                stroke="url(#preview-ring)"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray="122 163"
                className="animate-sweep [--dash-total:163]"
              />
            </svg>
          </div>
        </div>

        <div className="mt-7 flex flex-col gap-3.5">
          {DIMENSIONS.map((dimension, index) => (
            <div key={dimension.label}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-muted-foreground">{dimension.label}</span>
                <span className="text-muted-foreground/60">--</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="bg-spectral animate-grow-bar h-full origin-left rounded-full"
                  style={{
                    width: dimension.width,
                    animationDelay: `${300 + index * 110}ms`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-7 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-accent px-3 py-1.5 text-[0.6875rem] font-medium text-accent-foreground">
            Strengths
          </span>
          <span className="rounded-full bg-muted px-3 py-1.5 text-[0.6875rem] font-medium text-muted-foreground">
            Weaknesses
          </span>
          <span className="rounded-full bg-muted px-3 py-1.5 text-[0.6875rem] font-medium text-muted-foreground">
            Recommendations
          </span>
        </div>
      </div>
    </div>
  );
}
