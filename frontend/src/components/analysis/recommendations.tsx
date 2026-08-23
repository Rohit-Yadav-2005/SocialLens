import { Lightbulb } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RecommendationsProps {
  items: string[];
}

export function Recommendations({ items }: RecommendationsProps) {
  return (
    <Card className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-20 -right-16 size-56 rounded-full opacity-30 blur-[80px]"
        style={{ background: "var(--glow-primary)" }}
      />

      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-2 text-lg">
          <span className="bg-spectral flex size-7 items-center justify-center rounded-lg shadow-[0_1px_0_oklch(1_0_0/0.3)_inset]">
            <Lightbulb className="size-4 text-white" aria-hidden="true" />
          </span>
          Recommendations
        </CardTitle>
      </CardHeader>

      <CardContent className="relative">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No specific recommendations.</p>
        ) : (
          <ol className="flex flex-col gap-3">
            {items.map((item, index) => (
              <li
                key={item}
                style={{ animationDelay: `${index * 70}ms` }}
                className="animate-fade-up flex gap-3.5 rounded-xl border border-border/60 bg-background/40 p-4 text-sm leading-relaxed transition-colors hover:border-border"
              >
                <span
                  data-numeric
                  className="bg-spectral flex size-6 shrink-0 items-center justify-center rounded-lg text-xs font-semibold text-white shadow-[0_1px_0_oklch(1_0_0/0.3)_inset]"
                >
                  {index + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
