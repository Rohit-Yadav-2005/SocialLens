import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProcessingStages } from "./processing-stages";

function iconOf(label: string) {
  const step = screen.getByText(label);
  return step.previousElementSibling as HTMLElement;
}

describe("ProcessingStages", () => {
  it("renders nothing when idle", () => {
    const { container } = render(<ProcessingStages stage="idle" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("marks upload-phase steps active and analyze-phase steps pending while uploading", () => {
    render(<ProcessingStages stage="uploading" />);

    expect(iconOf("Uploading")).toHaveClass("text-primary");
    expect(iconOf("Analyzing content")).not.toHaveClass("text-primary");
    expect(iconOf("Analyzing content")).not.toHaveClass("bg-primary");
  });

  it("marks upload-phase steps done and analyze-phase steps active while analyzing", () => {
    render(<ProcessingStages stage="analyzing" />);

    expect(iconOf("Uploading")).toHaveClass("bg-primary");
    expect(iconOf("Extracting text")).toHaveClass("bg-primary");
    expect(iconOf("Analyzing content")).toHaveClass("text-primary");
    expect(iconOf("Generating recommendations")).not.toHaveClass("bg-primary");
  });

  it("marks every step done when complete", () => {
    render(<ProcessingStages stage="complete" />);

    for (const label of ["Uploading", "Extracting text", "Analyzing content", "Generating recommendations"]) {
      expect(iconOf(label)).toHaveClass("bg-primary");
    }
  });

  it("marks the upload step as failed (not merely active) when upload itself fails", () => {
    render(<ProcessingStages stage="error" failedPhase="uploading" />);

    expect(iconOf("Uploading")).toHaveClass("border-destructive");
    // The analyze phase never started — it should read as pending, not failed.
    expect(iconOf("Analyzing content")).not.toHaveClass("border-destructive");
    expect(iconOf("Analyzing content")).not.toHaveClass("bg-primary");
  });

  it("marks upload steps done (not failed) and analyze-phase steps failed when analysis fails", () => {
    // This is the scenario that matters most: upload succeeded, so those
    // steps must show as complete, not merely "in progress" or unrelated
    // to the failure. Both analyze-phase steps share one real request
    // boundary, so they correctly fail together (same granularity as
    // them both showing "active" together during a live analyze).
    render(<ProcessingStages stage="error" failedPhase="analyzing" />);

    expect(iconOf("Uploading")).toHaveClass("bg-primary");
    expect(iconOf("Extracting text")).toHaveClass("bg-primary");
    expect(iconOf("Analyzing content")).toHaveClass("border-destructive");
    expect(iconOf("Generating recommendations")).toHaveClass("border-destructive");
  });

  it("has an accessible live region so screen readers announce stage changes", () => {
    render(<ProcessingStages stage="uploading" />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
  });
});
