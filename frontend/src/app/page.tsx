import Link from "next/link";
import { ArrowRight, FileSearch, ScanText, Sparkles, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DashboardPreview } from "@/components/landing/dashboard-preview";

const FEATURES = [
  {
    icon: ScanText,
    title: "Extract",
    description:
      "Native PDF text extraction with automatic OCR fallback for scanned documents and screenshots.",
    span: "lg:col-span-5",
  },
  {
    icon: FileSearch,
    title: "Analyze",
    description:
      "Deterministic content metrics blended with AI evaluation of hook, clarity, engagement, and CTA strength.",
    span: "lg:col-span-7",
  },
  {
    icon: Sparkles,
    title: "Improve",
    description:
      "Specific, actionable recommendations and an AI-rewritten version that keeps your original meaning.",
    span: "lg:col-span-7",
  },
  {
    icon: TrendingUp,
    title: "Track",
    description: "Build a history of every analysis and watch your scores trend over time.",
    span: "lg:col-span-5",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Upload",
    description: "Drop a PDF or image of your post — a screenshot, export, or scan.",
  },
  {
    number: "02",
    title: "Analyze",
    description: "SocialLens extracts the text and scores it across five dimensions.",
  },
  {
    number: "03",
    title: "Improve",
    description: "Review specific recommendations and an AI-improved rewrite.",
  },
];

export default function Home() {
  return (
    <div className="flex-1">
      {/* ---------------- Hero ---------------- */}
      <section className="relative overflow-hidden">
        {/* Grid floor, faded out toward the edges so it never reads as a table. */}
        <div
          aria-hidden="true"
          className="grid-lines pointer-events-none absolute inset-0 opacity-[0.55] [mask-image:radial-gradient(ellipse_75%_60%_at_50%_35%,#000_20%,transparent_75%)] dark:opacity-40"
        />

        <div className="relative mx-auto max-w-6xl px-4 pt-20 pb-24 sm:px-6 sm:pt-28 sm:pb-32 lg:px-8">
          <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
            <div className="animate-fade-up">
              <span className="spectral-ring inline-flex items-center gap-2 rounded-full bg-card/70 px-3.5 py-1.5 text-xs font-medium backdrop-blur">
                <span className="relative flex size-1.5">
                  <span className="bg-spectral absolute inline-flex size-full animate-ping rounded-full opacity-70" />
                  <span className="bg-spectral relative inline-flex size-1.5 rounded-full" />
                </span>
                Understand. Improve. Engage.
              </span>

              <h1 className="font-display mt-7 text-[2.75rem] leading-[1.02] font-semibold text-balance sm:text-6xl lg:text-[4.1rem]">
                Turn your content into{" "}
                <span className="text-spectral">higher-engagement</span> posts.
              </h1>

              <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground text-pretty">
                Upload your PDF or image. SocialLens extracts the content, analyzes it,
                identifies weaknesses, and suggests improvements.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="group h-12 gap-2 px-7 text-base"
                  nativeButton={false}
                  render={<Link href="/analyze" />}
                >
                  Analyze Content
                  <ArrowRight
                    className="size-4 transition-transform duration-200 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 px-7 text-base"
                  nativeButton={false}
                  render={<Link href="/insights" />}
                >
                  View Insights
                </Button>
              </div>

              <p className="mt-5 text-xs text-muted-foreground">
                PDF, PNG, or JPG &middot; Free to try &middot; No account required
              </p>
            </div>

            <div
              className="animate-fade-up flex justify-center lg:justify-end [animation-delay:180ms]"
            >
              <DashboardPreview />
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Features (asymmetric bento) ---------------- */}
      <section className="relative border-t border-border/60 py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-spectral text-xs font-semibold tracking-[0.18em] uppercase">
              The pipeline
            </p>
            <h2 className="font-display mt-3 text-3xl font-semibold text-balance sm:text-4xl">
              A complete content review, in seconds
            </h2>
            <p className="mt-4 text-lg text-muted-foreground text-pretty">
              Deterministic metrics and AI judgment, combined into one transparent score.
            </p>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-12">
            {FEATURES.map((feature, index) => (
              <article
                key={feature.title}
                style={{ animationDelay: `${index * 90}ms` }}
                className={`animate-fade-up lift shadow-card group relative overflow-hidden rounded-2xl border border-border/70 bg-card/80 p-7 backdrop-blur-sm hover:border-transparent ${feature.span}`}
              >
                {/* Gradient hairline, revealed on hover. */}
                <span
                  aria-hidden="true"
                  className="spectral-ring pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                />
                {/* Corner bloom. */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-16 -right-16 size-40 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
                  style={{ background: "var(--glow-primary)" }}
                />

                <span className="bg-spectral relative flex size-11 items-center justify-center rounded-xl shadow-[0_1px_0_oklch(1_0_0/0.3)_inset]">
                  <feature.icon className="size-5 text-white" aria-hidden="true" />
                </span>

                <h3 className="font-display relative mt-6 text-xl font-semibold">
                  {feature.title}
                </h3>
                <p className="relative mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- How it works ---------------- */}
      <section className="relative border-t border-border/60 py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-spectral text-xs font-semibold tracking-[0.18em] uppercase">
              Three steps
            </p>
            <h2 className="font-display mt-3 text-3xl font-semibold sm:text-4xl">How it works</h2>
          </div>

          <div className="relative mt-14">
            {/* Spectral rail connecting the steps. */}
            <div
              aria-hidden="true"
              className="bg-spectral absolute top-6 right-0 left-0 hidden h-px opacity-45 sm:block"
            />

            <div className="grid gap-10 sm:grid-cols-3 sm:gap-8">
              {STEPS.map((step, index) => (
                <div
                  key={step.number}
                  style={{ animationDelay: `${index * 120}ms` }}
                  className="animate-fade-up relative"
                >
                  <div className="bg-spectral relative flex size-12 items-center justify-center rounded-xl shadow-[0_1px_0_oklch(1_0_0/0.3)_inset,0_8px_24px_-10px_var(--glow-primary)]">
                    <span className="font-mono text-sm font-semibold text-white">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="font-display mt-5 text-xl font-semibold">{step.title}</h3>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Closing CTA ---------------- */}
      <section className="relative py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/80 px-6 py-16 text-center backdrop-blur-sm sm:px-16">
            <div
              aria-hidden="true"
              className="bg-spectral pointer-events-none absolute inset-0 opacity-[0.09]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-28 left-1/2 size-72 -translate-x-1/2 rounded-full blur-[100px]"
              style={{ background: "var(--glow-primary)" }}
            />

            <h2 className="font-display relative text-3xl font-semibold text-balance sm:text-4xl">
              Ready to improve your next post?
            </h2>
            <p className="relative mx-auto mt-4 max-w-md text-lg text-muted-foreground text-pretty">
              Upload a PDF or image and get your first analysis in under a minute.
            </p>
            <Button
              size="lg"
              className="group relative mt-9 h-12 gap-2 px-7 text-base"
              nativeButton={false}
              render={<Link href="/analyze" />}
            >
              Analyze Content
              <ArrowRight
                className="size-4 transition-transform duration-200 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
