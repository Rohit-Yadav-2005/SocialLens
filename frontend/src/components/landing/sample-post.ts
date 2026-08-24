/** One illustrative sample post, referenced by every landing-page
 * demonstration so the page reads as one continuous example rather than
 * a new generic blurb per section. Every number here is representative
 * of real backend output shape (see app/services/scoring_service.py),
 * not invented for marketing effect — including the has_cta / weak-CTA
 * split, which genuinely happens: the deterministic layer detects the
 * phrase "check it out" (see _CTA_PHRASES), while the AI layer judges
 * it has no link or next step. That mismatch is the actual hybrid
 * scoring model this product runs on, not a contrived example. */

export const SAMPLE_POST_TEXT =
  "We're excited to share some updates about our platform! We've been working hard behind the scenes on some really great improvements. Check it out and let us know what you think!";

export const SAMPLE_OVERALL_SCORE = 34;

export const SAMPLE_ANNOTATIONS = [
  {
    text: "We're excited to share some updates about our platform!",
    label: "Weak hook — excitement isn't a reason to keep reading",
    tone: "needs-work" as const,
  },
  {
    text: "really great improvements",
    label: "Vague — no specifics",
    tone: "fair" as const,
  },
  {
    text: "Check it out and let us know what you think!",
    label: "No link, no next step",
    tone: "needs-work" as const,
  },
];

export const SAMPLE_METRICS = [
  { label: "Words", value: "32" },
  { label: "Hashtags", value: "0" },
  { label: "Readability", value: "42" },
  { label: "CTA phrase", value: "Detected" },
];

export const SAMPLE_RECOMMENDATIONS = [
  "Name the actual update — “platform updates” isn't specific enough to matter.",
  "Add a link. The CTA phrase is there, but there's nothing to click.",
];

export const TONE_STYLES = {
  "needs-work": { text: "text-[color:var(--chart-2)]", dot: "bg-[color:var(--chart-2)]" },
  fair: { text: "text-[color:var(--chart-3)]", dot: "bg-[color:var(--chart-3)]" },
};
