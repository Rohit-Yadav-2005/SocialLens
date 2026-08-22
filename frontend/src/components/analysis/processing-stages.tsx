"use client";

import { Check, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ProcessingStage } from "@/types/processing";

interface StepDefinition {
  label: string;
  /** Which real request this step's status is derived from. */
  phase: "uploading" | "analyzing";
}

const STEPS: StepDefinition[] = [
  { label: "Uploading", phase: "uploading" },
  { label: "Validating", phase: "uploading" },
  { label: "Extracting text", phase: "uploading" },
  { label: "Running OCR if needed", phase: "uploading" },
  { label: "Analyzing content", phase: "analyzing" },
  { label: "Generating recommendations", phase: "analyzing" },
];

type StepStatus = "pending" | "active" | "done";

function statusFor(stage: ProcessingStage, phase: StepDefinition["phase"]): StepStatus {
  if (stage === "complete") return "done";
  if (stage === "error") {
    // Whichever phase was in flight when the error happened is the one
    // that failed; the other has already either finished or never started.
    return phase === "uploading" ? "active" : "pending";
  }
  if (stage === "uploading") return phase === "uploading" ? "active" : "pending";
  if (stage === "analyzing") return phase === "analyzing" ? "active" : "done";
  return "pending";
}

export function ProcessingStages({ stage }: { stage: ProcessingStage }) {
  if (stage === "idle") return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6"
    >
      <ul className="flex flex-col gap-3">
        {STEPS.map((step) => {
          const status = statusFor(stage, step.phase);
          return (
            <li key={step.label} className="flex items-center gap-3">
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border text-xs",
                  status === "done" && "border-primary bg-primary text-primary-foreground",
                  status === "active" && "border-primary text-primary",
                  status === "pending" && "border-border text-transparent",
                )}
              >
                {status === "done" && <Check className="size-3" aria-hidden="true" />}
                {status === "active" && (
                  <Loader2 className="size-3 animate-spin" aria-hidden="true" />
                )}
              </span>
              <span
                className={cn(
                  "text-sm",
                  status === "pending" ? "text-muted-foreground" : "text-foreground",
                  status === "active" && "font-medium",
                )}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
