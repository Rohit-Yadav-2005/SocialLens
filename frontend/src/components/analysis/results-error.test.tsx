import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ResultsError } from "./results-error";

describe("ResultsError", () => {
  it("renders the given error message", () => {
    render(<ResultsError message="We couldn't find what you were looking for." />);

    expect(
      screen.getByText("We couldn't find what you were looking for."),
    ).toBeInTheDocument();
  });

  it("exposes the error to assistive tech via role=alert", () => {
    render(<ResultsError message="Something specific went wrong." />);
    expect(screen.getByRole("alert")).toHaveTextContent("Something specific went wrong.");
  });

  it("offers a way back to start a new analysis", () => {
    // Rendered as a Button-styled <a> (Base UI sets role="button" for
    // this composition, not the browser-default "link" role).
    render(<ResultsError message="404" />);

    const link = screen.getByRole("button", { name: /analyze new content/i });
    expect(link).toHaveAttribute("href", "/analyze");
  });

  it("never renders a raw backend error code as the heading", () => {
    render(<ResultsError message="NOT_FOUND" />);
    expect(screen.queryByRole("heading")).not.toHaveTextContent("NOT_FOUND");
  });
});
