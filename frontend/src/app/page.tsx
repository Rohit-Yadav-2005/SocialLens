import Link from "next/link";
import { FileSearch, ScanText, Sparkles, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DashboardPreview } from "@/components/landing/dashboard-preview";

const FEATURES = [
  {
    icon: ScanText,
    title: "Extract",
    description:
      "Native PDF text extraction with automatic OCR fallback for scanned documents and screenshots.",
  },
  {
    icon: FileSearch,
    title: "Analyze",
    description:
      "Deterministic content metrics blended with AI evaluation of hook, clarity, engagement, and CTA strength.",
  },
  {
    icon: Sparkles,
    title: "Improve",
    description:
      "Specific, actionable recommendations and an AI-rewritten version that keeps your original meaning.",
  },
  {
    icon: TrendingUp,
    title: "Track",
    description: "Build a history of every analysis and watch your scores trend over time.",
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
      <section className="mx-auto max-w-6xl px-4 pt-16 pb-20 sm:px-6 sm:pt-20 sm:pb-28 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <span className="inline-flex items-center rounded-full border border-border bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
              Understand. Improve. Engage.
            </span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              Turn your content into higher-engagement posts.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground text-pretty">
              Upload your PDF or image. SocialLens extracts the content, analyzes it,
              identifies weaknesses, and suggests improvements.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="h-11 px-6 text-base" nativeButton={false} render={<Link href="/analyze" />}>
                Analyze Content
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              PDF, PNG, or JPG &middot; Free to try &middot; No account required
            </p>
          </div>

          <div className="flex justify-center lg:justify-end">
            <DashboardPreview />
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-muted/30 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              A complete content review, in seconds
            </h2>
            <p className="mt-3 text-muted-foreground">
              Deterministic metrics and AI judgment, combined into one transparent score.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <Card key={feature.title} className="border-border p-5">
                <span className="flex size-9 items-center justify-center rounded-lg bg-accent">
                  <feature.icon className="size-4.5 text-primary" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-medium">{feature.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">How it works</h2>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.number} className="text-center sm:text-left">
                <span className="font-mono text-sm font-medium text-primary">{step.number}</span>
                <h3 className="mt-2 font-medium">{step.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border py-20">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Ready to improve your next post?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Upload a PDF or image and get your first analysis in under a minute.
          </p>
          <Button
            size="lg"
            className="mt-7 h-11 px-6 text-base"
            nativeButton={false} render={<Link href="/analyze" />}
          >
            Analyze Content
          </Button>
        </div>
      </section>
    </div>
  );
}
