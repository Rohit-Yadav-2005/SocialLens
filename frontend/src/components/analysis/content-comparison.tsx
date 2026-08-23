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

      {/* The improved rewrite is the payoff of the whole flow — it gets the
          gradient hairline and bloom so the eye lands here first. */}
      <Card className="spectral-ring relative overflow-hidden border-transparent">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-20 size-64 rounded-full opacity-40 blur-[80px]"
          style={{ background: "var(--glow-primary)" }}
        />

        <CardHeader className="relative flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-lg">
            <span className="text-spectral">AI-improved content</span>
          </CardTitle>
          <CopyButton text={improvedContent} copyKey="improved" />
        </CardHeader>
        <CardContent className="relative">
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
            {improvedContent}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
