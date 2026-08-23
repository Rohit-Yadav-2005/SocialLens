import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Dropzone } from "./dropzone";

function makePdf(name = "post.pdf", size = 1024): File {
  return new File([new Uint8Array(size)], name, { type: "application/pdf" });
}

describe("Dropzone (empty state)", () => {
  it("shows the upload prompt when no file is selected", () => {
    render(<Dropzone selectedFile={null} onFileSelected={vi.fn()} onFileCleared={vi.fn()} />);

    expect(screen.getByText("Drop your PDF or image here")).toBeInTheDocument();
    expect(screen.getByText(/PDF, PNG, JPG/)).toBeInTheDocument();
  });

  it("calls onFileSelected with a valid file chosen via the file input", async () => {
    const onFileSelected = vi.fn();
    render(
      <Dropzone selectedFile={null} onFileSelected={onFileSelected} onFileCleared={vi.fn()} />,
    );
    const file = makePdf();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    await userEvent.upload(input, file);

    expect(onFileSelected).toHaveBeenCalledWith(file);
  });

  it("shows a validation error and does not call onFileSelected for an oversized file", async () => {
    // A real OS file picker filters by the input's `accept` attribute, so
    // userEvent.upload only lets through files that match it — a file
    // that's too large (not wrong-typed) is what a real user could
    // actually select here and still hit client-side validation.
    const onFileSelected = vi.fn();
    render(
      <Dropzone selectedFile={null} onFileSelected={onFileSelected} onFileCleared={vi.fn()} />,
    );
    const oversized = makePdf("huge.pdf", 21 * 1024 * 1024);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    await userEvent.upload(input, oversized);

    expect(onFileSelected).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(/20 mb size limit/i);
  });

  it("shows a validation error for a wrong file type dropped in (drag-and-drop bypasses accept)", () => {
    const onFileSelected = vi.fn();
    render(
      <Dropzone selectedFile={null} onFileSelected={onFileSelected} onFileCleared={vi.fn()} />,
    );
    const badFile = new File(["x"], "malware.exe", { type: "application/x-msdownload" });
    const dropzone = screen.getByRole("button", { name: /upload a pdf, png, or jpg file/i });

    fireEvent.drop(dropzone, { dataTransfer: { files: [badFile] } });

    expect(onFileSelected).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(/unsupported file type/i);
  });

  it("accepts a dropped valid file", () => {
    const onFileSelected = vi.fn();
    render(
      <Dropzone selectedFile={null} onFileSelected={onFileSelected} onFileCleared={vi.fn()} />,
    );
    const file = makePdf();
    const dropzone = screen.getByRole("button", { name: /upload a pdf, png, or jpg file/i });

    fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });

    expect(onFileSelected).toHaveBeenCalledWith(file);
  });

  it("ignores drops when disabled", () => {
    const onFileSelected = vi.fn();
    render(
      <Dropzone
        selectedFile={null}
        onFileSelected={onFileSelected}
        onFileCleared={vi.fn()}
        disabled
      />,
    );
    const dropzone = screen.getByRole("button", { name: /upload a pdf, png, or jpg file/i });

    fireEvent.drop(dropzone, { dataTransfer: { files: [makePdf()] } });

    expect(onFileSelected).not.toHaveBeenCalled();
  });
});

describe("Dropzone (file selected)", () => {
  it("shows the filename and formatted size instead of the prompt", () => {
    const file = makePdf("launch-post.pdf", 2048);
    render(<Dropzone selectedFile={file} onFileSelected={vi.fn()} onFileCleared={vi.fn()} />);

    expect(screen.getByText("launch-post.pdf")).toBeInTheDocument();
    expect(screen.getByText("2 KB")).toBeInTheDocument();
    expect(screen.queryByText("Drop your PDF or image here")).not.toBeInTheDocument();
  });

  it("calls onFileCleared when the remove button is clicked", async () => {
    const onFileCleared = vi.fn();
    render(
      <Dropzone
        selectedFile={makePdf()}
        onFileSelected={vi.fn()}
        onFileCleared={onFileCleared}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /remove selected file/i }));

    expect(onFileCleared).toHaveBeenCalledOnce();
  });

  it("hides the remove button while disabled", () => {
    render(
      <Dropzone
        selectedFile={makePdf()}
        onFileSelected={vi.fn()}
        onFileCleared={vi.fn()}
        disabled
      />,
    );

    expect(screen.queryByRole("button", { name: /remove selected file/i })).not.toBeInTheDocument();
  });
});
