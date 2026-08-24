/** Score → descriptive label + color token, shared across every place a
 * 0-100 content-quality score is displayed. Thresholds are a simple,
 * transparent convention — not a statistically derived scale.
 *
 * Colors come from the dedicated four-step quality scale (chart-2..5:
 * red -> amber -> teal -> green), never `--primary` — the brand accent
 * is reserved for interactive elements, so a "Good" score is never the
 * same color as the CTA button. */
export function scoreLabel(score: number): { label: string; colorVar: string } {
  if (score >= 85) return { label: "Excellent", colorVar: "var(--chart-5)" };
  if (score >= 70) return { label: "Good", colorVar: "var(--chart-4)" };
  if (score >= 50) return { label: "Fair", colorVar: "var(--chart-3)" };
  return { label: "Needs work", colorVar: "var(--chart-2)" };
}
