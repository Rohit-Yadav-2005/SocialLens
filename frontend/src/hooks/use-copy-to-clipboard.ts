"use client";

import { useState } from "react";
import { toast } from "sonner";

export function useCopyToClipboard() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopiedKey((current) => (current === key ? null : current)), 2000);
    } catch {
      toast.error("Couldn't copy to clipboard");
    }
  };

  return { copy, isCopied: (key: string) => copiedKey === key };
}
