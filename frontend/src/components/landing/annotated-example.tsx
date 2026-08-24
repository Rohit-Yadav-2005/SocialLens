import {
  SAMPLE_ANNOTATIONS,
  SAMPLE_OVERALL_SCORE,
  TONE_STYLES,
} from "@/components/landing/sample-post";

/** A real (illustrative) analyzed post, presented as a manuscript with
 * margin notes — the text sits directly on the page (no card, no
 * border, no shadow), with the annotations in a genuine side column
 * next to it, the way an editor's markup actually looks, rather than a
 * boxed dashboard widget with a legend underneath. */
export function AnnotatedExample() {
  return (
    <div aria-hidden="true">
      <div className="flex items-baseline justify-between border-b-2 border-foreground pb-3">
        <span className="font-mono text-xs font-medium tracking-[0.15em] text-muted-foreground uppercase">
          Sample post — LinkedIn
        </span>
        <span
          data-numeric
          className="border border-[color:var(--chart-2)] px-2 py-0.5 font-mono text-xs font-semibold text-[color:var(--chart-2)]"
        >
          {SAMPLE_OVERALL_SCORE}/100
        </span>
      </div>

      <div className="mt-8 grid gap-x-10 gap-y-8 lg:grid-cols-[1fr_260px]">
        <p className="font-display text-xl leading-[1.65] text-foreground sm:text-2xl">
          <mark className="rounded-none bg-transparent px-0 text-[color:var(--chart-2)] underline decoration-2 underline-offset-4">
            We&rsquo;re excited to share some updates about our platform!
          </mark>{" "}
          We&rsquo;ve been working hard behind the scenes on some{" "}
          <mark className="rounded-none bg-transparent px-0 text-[color:var(--chart-3)] underline decoration-2 underline-offset-4">
            really great improvements
          </mark>
          .{" "}
          <mark className="rounded-none bg-transparent px-0 text-[color:var(--chart-2)] underline decoration-2 underline-offset-4">
            Check it out and let us know what you think!
          </mark>
        </p>

        {/* Real margin notes — a side column, not a legend list. */}
        <ul className="flex flex-col gap-6 border-l border-border pl-6 lg:pl-8">
          {SAMPLE_ANNOTATIONS.map((a) => (
            <li key={a.label}>
              <span
                className={`font-mono text-[0.6875rem] font-semibold tracking-wide uppercase ${TONE_STYLES[a.tone].text}`}
              >
                {a.tone === "needs-work" ? "Flagged" : "Note"}
              </span>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{a.label}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
