import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">SocialLens</h1>
      <p className="max-w-md text-muted-foreground">
        Understand. Improve. Engage. Project scaffold is live &mdash; the
        analysis experience lands in a later phase.
      </p>
      <Button>Analyze Content</Button>
    </main>
  );
}
