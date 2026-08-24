import Link from "next/link";

import { AnnotatedExample } from "@/components/landing/annotated-example";
import { CapabilityDemo } from "@/components/landing/capability-demo";
import { Reveal } from "@/components/layout/reveal";

export default function Home() {
  return (
    // The "sheet": bounded to a fixed width with visible side rules once the
    // viewport outgrows it, so wide screens read as a page on a desk rather
    // than a document lost in empty margins. Below max-w-6xl the border sits
    // off-screen and this is invisible, same as before.
    <div className="mx-auto w-full max-w-6xl flex-1 border-border lg:border-x">
      {/* ---------------- The manuscript ---------------- */}
      <section className="border-b border-border py-14 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-10">
          <p className="font-mono text-xs tracking-[0.15em] text-muted-foreground uppercase">
            Analysis 001 &middot; Content critique
          </p>

          <h1 className="font-display mt-4 max-w-2xl text-[2.1rem] leading-[1.15] text-balance sm:text-[2.6rem]">
            Every post has a weak line. Find it before you publish.
          </h1>

          <div className="mt-12">
            <AnnotatedExample />
          </div>

          <div className="mt-12 flex flex-col items-start justify-between gap-6 border-t border-border pt-8 sm:flex-row sm:items-center">
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              Upload a PDF or image of your draft. SocialLens extracts the text, scores it,
              and shows you exactly what to fix.
            </p>
            <Link
              href="/analyze"
              className="shrink-0 border border-primary px-5 py-2.5 font-mono text-sm font-medium tracking-wide text-primary uppercase transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              Analyze your draft &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------- Pull quote ---------------- */}
      <section className="border-b border-border py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-10">
          <p className="font-display text-center text-2xl leading-[1.4] text-balance italic sm:text-3xl">
            Most weak posts don&rsquo;t need a rewrite.{" "}
            <span className="text-primary">They need one sentence fixed.</span>
          </p>
        </div>
      </section>

      {/* ---------------- Continued ---------------- */}
      <section className="border-b border-border py-14 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-10">
          <p className="font-mono text-xs tracking-[0.15em] text-muted-foreground uppercase">
            Analysis 001 &middot; continued
          </p>

          <p className="drop-cap mt-4 max-w-2xl text-lg leading-relaxed text-foreground text-pretty">
            SocialLens doesn&rsquo;t just score your post — it shows its work. Word count,
            hashtags, a readability pass, whether a call-to-action phrase is actually there:
            computed directly from the text above, not guessed at.
          </p>

          <Reveal className="mt-10">
            <CapabilityDemo />
          </Reveal>

          <p className="mt-10 text-sm text-muted-foreground">
            Scanned PDFs and screenshots go through OCR automatically. Every analysis is
            saved — trends across everything you&rsquo;ve uploaded show up in{" "}
            <Link href="/insights" className="text-primary underline underline-offset-4">
              Insights
            </Link>
            .
          </p>
        </div>
      </section>

      {/* ---------------- Colophon ---------------- */}
      <section className="py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-10">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-baseline">
            <p className="font-display text-xl">Upload your own draft and see what it finds.</p>
            <Link
              href="/analyze"
              className="shrink-0 border border-primary px-5 py-2.5 font-mono text-sm font-medium tracking-wide text-primary uppercase transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              Analyze Content &rarr;
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
