import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ListCardProps {
  title: string;
  items: string[];
  emptyMessage: string;
  icon: typeof CheckCircle2;
  accent: string;
}

function ListCard({ title, items, emptyMessage, icon: Icon, accent }: ListCardProps) {
  return (
    <Card className="relative overflow-hidden">
      {/* Accent rail keys the card to its meaning without shouting. */}
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-1"
        style={{ background: accent }}
      />

      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <span
            className="flex size-7 items-center justify-center rounded-lg"
            style={{ background: `color-mix(in oklch, ${accent}, transparent 84%)` }}
          >
            <Icon className="size-4" style={{ color: accent }} aria-hidden="true" />
          </span>
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <ul className="flex flex-col gap-3.5">
            {items.map((item, index) => (
              <li
                key={item}
                style={{ animationDelay: `${index * 60}ms` }}
                className="animate-fade-up flex gap-3 text-sm leading-relaxed"
              >
                <span
                  aria-hidden="true"
                  className="mt-[0.4rem] size-1.5 shrink-0 rounded-full"
                  style={{ background: accent }}
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function StrengthsList({ items }: { items: string[] }) {
  return (
    <ListCard
      title="Strengths"
      items={items}
      emptyMessage="No specific strengths were identified."
      icon={CheckCircle2}
      accent="var(--chart-3)"
    />
  );
}

export function WeaknessesList({ items }: { items: string[] }) {
  return (
    <ListCard
      title="Areas to improve"
      items={items}
      emptyMessage="No specific weaknesses were identified."
      icon={AlertTriangle}
      accent="var(--chart-4)"
    />
  );
}
