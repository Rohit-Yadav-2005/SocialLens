import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { HistoryTable } from "./history-table";
import type { HistoryRow } from "@/hooks/use-history";

const ROWS: HistoryRow[] = [
  {
    id: "doc-1",
    filename: "launch-announcement.pdf",
    original_file_type: "application/pdf",
    file_size: 1000,
    status: "analyzed",
    created_at: "2026-08-20T10:00:00Z",
    overallScore: 88,
  },
  {
    id: "doc-2",
    filename: "weekly-recap.pdf",
    original_file_type: "application/pdf",
    file_size: 900,
    status: "analyzed",
    created_at: "2026-08-22T10:00:00Z",
    overallScore: 61,
  },
  {
    id: "doc-3",
    filename: "draft-notes.pdf",
    original_file_type: "application/pdf",
    file_size: 500,
    status: "processed",
    created_at: "2026-08-21T10:00:00Z",
    overallScore: null,
  },
];

function bodyRowFilenames() {
  const rows = screen.getAllByRole("row").slice(1); // skip the header row
  return rows.map((row) => within(row).getByRole("link").textContent);
}

describe("HistoryTable", () => {
  it("renders every row", () => {
    render(<HistoryTable rows={ROWS} />);
    expect(screen.getByText("launch-announcement.pdf")).toBeInTheDocument();
    expect(screen.getByText("weekly-recap.pdf")).toBeInTheDocument();
    expect(screen.getByText("draft-notes.pdf")).toBeInTheDocument();
  });

  it("defaults to newest-first by date", () => {
    render(<HistoryTable rows={ROWS} />);
    expect(bodyRowFilenames()).toEqual([
      "weekly-recap.pdf", // Aug 22
      "draft-notes.pdf", // Aug 21
      "launch-announcement.pdf", // Aug 20
    ]);
  });

  it("shows an em dash for a document with no analysis yet", () => {
    render(<HistoryTable rows={ROWS} />);
    const draftRow = screen.getByText("draft-notes.pdf").closest("tr")!;
    expect(within(draftRow).getByText("—")).toBeInTheDocument();
  });

  it("shows the score for an analyzed document", () => {
    render(<HistoryTable rows={ROWS} />);
    const row = screen.getByText("launch-announcement.pdf").closest("tr")!;
    expect(within(row).getByText("88/100")).toBeInTheDocument();
  });

  it("links each filename to its results page", () => {
    render(<HistoryTable rows={ROWS} />);
    const link = screen.getByRole("link", { name: "launch-announcement.pdf" });
    expect(link).toHaveAttribute("href", "/analyze/doc-1");
  });

  it("filters rows by filename search, case-insensitively", async () => {
    render(<HistoryTable rows={ROWS} />);

    await userEvent.type(screen.getByLabelText(/search analyses by filename/i), "LAUNCH");

    expect(screen.getByText("launch-announcement.pdf")).toBeInTheDocument();
    expect(screen.queryByText("weekly-recap.pdf")).not.toBeInTheDocument();
    expect(screen.queryByText("draft-notes.pdf")).not.toBeInTheDocument();
  });

  it("shows a no-results message when the search matches nothing", async () => {
    render(<HistoryTable rows={ROWS} />);

    await userEvent.type(
      screen.getByLabelText(/search analyses by filename/i),
      "nothing-matches-this",
    );

    expect(screen.getByText(/no analyses match/i)).toBeInTheDocument();
  });

  it("sorts by score descending on first click, ascending on second click", async () => {
    render(<HistoryTable rows={ROWS} />);

    await userEvent.click(screen.getByRole("button", { name: /score/i }));
    expect(bodyRowFilenames()).toEqual([
      "launch-announcement.pdf", // 88
      "weekly-recap.pdf", // 61
      "draft-notes.pdf", // null, sorts last descending
    ]);

    await userEvent.click(screen.getByRole("button", { name: /score/i }));
    expect(bodyRowFilenames()).toEqual([
      "draft-notes.pdf", // null, sorts first ascending
      "weekly-recap.pdf", // 61
      "launch-announcement.pdf", // 88
    ]);
  });

  it("sorts by filename alphabetically on first click", async () => {
    render(<HistoryTable rows={ROWS} />);

    await userEvent.click(screen.getByRole("button", { name: /filename/i }));

    expect(bodyRowFilenames()).toEqual([
      "draft-notes.pdf",
      "launch-announcement.pdf",
      "weekly-recap.pdf",
    ]);
  });
});
