import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ContentMetrics } from "@/types/api";

interface StatDefinition {
  label: string;
  value: (metrics: ContentMetrics) => string | number;
}

const STATS: StatDefinition[] = [
  { label: "Words", value: (m) => m.word_count },
  { label: "Characters", value: (m) => m.char_count },
  { label: "Sentences", value: (m) => m.sentence_count },
  { label: "Avg. sentence length", value: (m) => m.avg_sentence_length },
  { label: "Paragraphs", value: (m) => m.paragraph_count },
  { label: "Hashtags", value: (m) => m.hashtag_count },
  { label: "Mentions", value: (m) => m.mention_count },
  { label: "URLs", value: (m) => m.url_count },
  { label: "Emoji", value: (m) => m.emoji_count },
  { label: "Questions", value: (m) => m.question_count },
];

interface DeterministicMetricsProps {
  metrics: ContentMetrics;
}

export function DeterministicMetrics({ metrics }: DeterministicMetricsProps) {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <CardTitle>Content metrics</CardTitle>
        <p className="text-sm text-muted-foreground">
          Computed directly from the text — no AI involved.
        </p>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <dt className="text-xs text-muted-foreground">{stat.label}</dt>
              <dd className="mt-0.5 text-xl font-semibold tabular-nums">
                {stat.value(metrics)}
              </dd>
            </div>
          ))}
          <div>
            <dt className="text-xs text-muted-foreground">Call to action</dt>
            <dd className="mt-0.5 text-xl font-semibold">
              {metrics.has_cta ? "Detected" : "Not detected"}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
