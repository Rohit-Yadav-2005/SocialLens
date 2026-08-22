/** Score → descriptive label + Tailwind color token, shared across every
 * place a 0-100 content-quality score is displayed. Thresholds are a
 * simple, transparent convention — not a statistically derived scale. */
export function scoreLabel(score: number): { label: string; colorVar: string } {
  if (score >= 85) return { label: "Excellent", colorVar: "var(--chart-3)" };
  if (score >= 70) return { label: "Good", colorVar: "var(--primary)" };
  if (score >= 50) return { label: "Fair", colorVar: "var(--chart-4)" };
  return { label: "Needs work", colorVar: "var(--chart-5)" };
}
