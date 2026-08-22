import { Lightbulb } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RecommendationsProps {
  items: string[];
}

export function Recommendations({ items }: RecommendationsProps) {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="size-4 text-primary" aria-hidden="true" />
          Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No specific recommendations.</p>
        ) : (
          <ol className="flex flex-col gap-3">
            {items.map((item, index) => (
              <li key={item} className="flex gap-3 text-sm">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-medium text-accent-foreground">
                  {index + 1}
                </span>
                <span className="pt-0.5">{item}</span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
