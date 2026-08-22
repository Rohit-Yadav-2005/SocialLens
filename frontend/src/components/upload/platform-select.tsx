"use client";

import { cn } from "@/lib/utils";
import type { Platform } from "@/types/api";

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: "generic", label: "Generic" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "instagram", label: "Instagram" },
  { value: "twitter", label: "X / Twitter" },
];

interface PlatformSelectProps {
  value: Platform;
  onChange: (platform: Platform) => void;
  disabled?: boolean;
}

export function PlatformSelect({ value, onChange, disabled }: PlatformSelectProps) {
  return (
    <div>
      <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Platform
      </span>
      <div
        role="radiogroup"
        aria-label="Target platform"
        className="mt-2 inline-flex flex-wrap gap-1.5 rounded-lg border border-border bg-muted p-1"
      >
        {PLATFORMS.map((platform) => (
          <button
            key={platform.value}
            type="button"
            role="radio"
            aria-checked={value === platform.value}
            disabled={disabled}
            onClick={() => onChange(platform.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-60",
              value === platform.value
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {platform.label}
          </button>
        ))}
      </div>
    </div>
  );
}
