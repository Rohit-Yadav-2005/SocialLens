"use client";

import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";

interface CopyButtonProps {
  text: string;
  copyKey: string;
}

function CopyButton({ text, copyKey }: CopyButtonProps) {
  const { copy, isCopied } = useCopyToClipboard();
  const copied = isCopied(copyKey);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => copy(text, copyKey)}
      aria-label={copied ? "Copied" : "Copy to clipboard"}
    >
      {copied ? <Check className="text-chart-3" /> : <Copy />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

interface ContentComparisonProps {
  originalContent: string;
  improvedContent: string;
}

export function ContentComparison({ originalContent, improvedContent }: ContentComparisonProps) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-lg text-muted-foreground">Original content</CardTitle>
          <CopyButton text={originalContent} copyKey="original" />
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
            {originalContent}
          </p>
        </CardContent>
      </Card>

      {/* The improved rewrite is the payoff of the whole flow — it gets
          the second brand color (not primary), since primary means
          "act on this" and this card is a result, not an action. */}
      <Card className="border-accent-2/45">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-lg text-accent-2">AI-improved content</CardTitle>
          <CopyButton text={improvedContent} copyKey="improved" />
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
            {improvedContent}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
