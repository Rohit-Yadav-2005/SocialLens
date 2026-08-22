import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ListCardProps {
  title: string;
  items: string[];
  emptyMessage: string;
  icon: typeof CheckCircle2;
  iconClassName: string;
}

function ListCard({ title, items, emptyMessage, icon: Icon, iconClassName }: ListCardProps) {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {items.map((item) => (
              <li key={item} className="flex gap-2.5 text-sm">
                <Icon className={`mt-0.5 size-4 shrink-0 ${iconClassName}`} aria-hidden="true" />
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
      iconClassName="text-chart-3"
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
      iconClassName="text-chart-5"
    />
  );
}
