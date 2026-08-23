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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Content metrics</CardTitle>
        <p className="text-sm text-muted-foreground">
          Computed directly from the text — no AI involved.
        </p>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border/70 bg-border/70 sm:grid-cols-3 lg:grid-cols-6">
          {STATS.map((stat) => (
            <div key={stat.label} className="bg-card p-4">
              <dt className="text-xs font-medium text-muted-foreground">{stat.label}</dt>
              <dd
                data-numeric
                className="font-display mt-1.5 text-2xl leading-none font-semibold"
              >
                {stat.value(metrics)}
              </dd>
            </div>
          ))}
          <div className="bg-card p-4">
            <dt className="text-xs font-medium text-muted-foreground">Call to action</dt>
            {/* Smaller than the numeric tiles: "Not detected" is long enough to
                wrap awkwardly in a narrow grid cell at the same size. */}
            <dd
              className="font-display mt-1.5 text-lg leading-tight font-semibold"
              style={{
                color: metrics.has_cta ? "var(--chart-3)" : "var(--muted-foreground)",
              }}
            >
              {metrics.has_cta ? "Detected" : "Not detected"}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
