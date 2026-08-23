import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ContentComparison } from "./content-comparison";

function mockClipboardWriteText(impl: (text: string) => Promise<void>) {
  // jsdom defines navigator.clipboard as a getter-only stub, so it can't
  // be set via plain assignment.
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: vi.fn(impl) },
    configurable: true,
  });
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("ContentComparison", () => {
  it("renders both the original and improved content", () => {
    mockClipboardWriteText(async () => {});
    render(
      <ContentComparison originalContent="Original text here." improvedContent="Improved text here." />,
    );

    expect(screen.getByText("Original text here.")).toBeInTheDocument();
    expect(screen.getByText("Improved text here.")).toBeInTheDocument();
  });

  it("copies the exact original text when its Copy button is clicked", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    mockClipboardWriteText(async () => {});
    render(<ContentComparison originalContent="Original text here." improvedContent="Improved." />);

    const buttons = screen.getAllByRole("button", { name: /copy to clipboard/i });
    await user.click(buttons[0]);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("Original text here.");
  });

  it("copies the improved text independently from the original", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    mockClipboardWriteText(async () => {});
    render(<ContentComparison originalContent="Original." improvedContent="Improved text here." />);

    const buttons = screen.getAllByRole("button", { name: /copy to clipboard/i });
    await user.click(buttons[1]);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("Improved text here.");
  });

  it("shows a Copied confirmation on the clicked button only, then reverts", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    mockClipboardWriteText(async () => {});
    render(<ContentComparison originalContent="Original." improvedContent="Improved." />);

    const [originalButton, improvedButton] = screen.getAllByRole("button", {
      name: /copy to clipboard/i,
    });
    await user.click(originalButton);

    expect(screen.getByRole("button", { name: /^copied$/i })).toBeInTheDocument();
    // The other button is untouched.
    expect(improvedButton).toHaveAccessibleName(/copy to clipboard/i);

    // The revert fires from a setTimeout inside the hook, not directly
    // from user-event, so it needs its own act() wrapping.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2100);
    });

    expect(screen.queryByRole("button", { name: /^copied$/i })).not.toBeInTheDocument();
  });

  it("does not show a false Copied state when the clipboard write is rejected", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    mockClipboardWriteText(async () => {
      throw new DOMException("denied", "NotAllowedError");
    });
    render(<ContentComparison originalContent="Original." improvedContent="Improved." />);

    await user.click(screen.getAllByRole("button", { name: /copy to clipboard/i })[0]);

    expect(screen.queryByRole("button", { name: /^copied$/i })).not.toBeInTheDocument();
  });
});
