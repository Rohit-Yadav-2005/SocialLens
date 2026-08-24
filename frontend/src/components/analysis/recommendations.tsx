import { Lightbulb } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RecommendationsProps {
  items: string[];
}

export function Recommendations({ items }: RecommendationsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <span className="flex size-7 items-center justify-center rounded-lg border border-border bg-muted">
            <Lightbulb className="size-4 text-primary" aria-hidden="true" />
          </span>
          Recommendations
        </CardTitle>
      </CardHeader>

      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No specific recommendations.</p>
        ) : (
          <ol className="flex flex-col gap-3">
            {items.map((item, index) => (
              <li
                key={item}
                style={{ animationDelay: `${index * 70}ms` }}
                className="animate-fade-up flex gap-3.5 rounded-lg border border-border bg-background/40 p-4 text-sm leading-relaxed transition-colors duration-150 hover:border-primary/30"
              >
                <span
                  data-numeric
                  className="flex size-6 shrink-0 items-center justify-center rounded-full border border-primary/40 text-xs font-semibold text-primary"
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
