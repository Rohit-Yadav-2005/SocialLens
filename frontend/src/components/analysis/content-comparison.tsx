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
      <Card className="border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Original content</CardTitle>
          <CopyButton text={originalContent} copyKey="original" />
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap text-foreground">{originalContent}</p>
        </CardContent>
      </Card>

      <Card className="border-primary/30 shadow-sm ring-1 ring-primary/10">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>AI-improved content</CardTitle>
          <CopyButton text={improvedContent} copyKey="improved" />
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap text-foreground">{improvedContent}</p>
        </CardContent>
      </Card>
    </div>
  );
}
