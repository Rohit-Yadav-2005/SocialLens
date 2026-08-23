"use client";

import { useRef } from "react";

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
  // WAI-ARIA authoring practices for role="radiogroup" expect exactly one
  // tab stop, with arrow keys moving both focus and selection between
  // options (roving tabindex) — not every option individually tabbable.
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const selectByIndex = (index: number) => {
    const wrapped = (index + PLATFORMS.length) % PLATFORMS.length;
    onChange(PLATFORMS[wrapped].value);
    buttonRefs.current[wrapped]?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        selectByIndex(index + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        selectByIndex(index - 1);
        break;
      case "Home":
        event.preventDefault();
        selectByIndex(0);
        break;
      case "End":
        event.preventDefault();
        selectByIndex(PLATFORMS.length - 1);
        break;
    }
  };

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
        {PLATFORMS.map((platform, index) => (
          <button
            key={platform.value}
            ref={(el) => {
              buttonRefs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={value === platform.value}
            tabIndex={value === platform.value ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(platform.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
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
