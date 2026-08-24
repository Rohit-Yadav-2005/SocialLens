import { SAMPLE_METRICS, SAMPLE_RECOMMENDATIONS } from "@/components/landing/sample-post";

/** The same sample post from the hero, continued — not a new card, a
 * "page 2" of the same manuscript. Its actual deterministic metrics and
 * the two recommendations it produces, laid out as data + margin
 * annotations rather than a dashboard panel. */
export function CapabilityDemo() {
  return (
    <div aria-hidden="true">
      <div className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
        {SAMPLE_METRICS.map((m) => (
          <div key={m.label} className="border-t-2 border-foreground pt-3">
            <dt className="font-mono text-[0.6875rem] tracking-wide text-muted-foreground uppercase">
              {m.label}
            </dt>
            <dd data-numeric className="font-display mt-1 text-3xl">
              {m.value}
            </dd>
          </div>
        ))}
      </div>

      <ol className="mt-10 flex flex-col gap-5">
        {SAMPLE_RECOMMENDATIONS.map((item, index) => (
          <li key={item} className="flex gap-4 border-b border-border pb-5 text-base leading-relaxed">
            <span data-numeric className="font-display shrink-0 text-primary">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
