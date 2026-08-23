"use client";

import { useCallback, useRef, useState } from "react";
import { FileText, Image as ImageIcon, UploadCloud, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { validateFile } from "@/validations/upload";

const ACCEPT = ".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileTypeIcon({ file }: { file: File }) {
  if (file.type === "application/pdf") {
    return <FileText className="size-6 text-primary" aria-hidden="true" />;
  }
  return <ImageIcon className="size-6 text-primary" aria-hidden="true" />;
}

interface DropzoneProps {
  selectedFile: File | null;
  onFileSelected: (file: File) => void;
  onFileCleared: () => void;
  disabled?: boolean;
}

export function Dropzone({
  selectedFile,
  onFileSelected,
  onFileCleared,
  disabled,
}: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;

      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setError(null);
      onFileSelected(file);
    },
    [onFileSelected],
  );

  const openBrowser = () => {
    if (!disabled) inputRef.current?.click();
  };

  if (selectedFile) {
    return (
      <div className="spectral-ring shadow-card relative flex items-center gap-4 overflow-hidden rounded-2xl border border-transparent bg-card p-5">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 -left-12 size-48 rounded-full opacity-40 blur-[70px]"
          style={{ background: "var(--glow-primary)" }}
        />
        <div className="relative flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent">
          <FileTypeIcon file={selectedFile} />
        </div>
        <div className="relative min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{selectedFile.name}</p>
          <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
        </div>
        {!disabled && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onFileCleared}
            aria-label="Remove selected file"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload a PDF, PNG, or JPG file, drag and drop or click to browse"
        onClick={openBrowser}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openBrowser();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          if (!disabled) handleFiles(event.dataTransfer.files);
        }}
        className={cn(
          "group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed px-6 py-16 text-center transition-all duration-300 sm:py-24",
          isDragging
            ? "scale-[1.01] border-primary bg-accent/70"
            : "border-border bg-card/60 backdrop-blur-sm hover:border-primary/60 hover:bg-accent/30",
          disabled && "pointer-events-none opacity-60",
        )}
      >
        {/* Bloom that blooms harder while a file is hovering over the target. */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute top-1/2 left-1/2 size-80 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[90px] transition-opacity duration-500",
            isDragging ? "opacity-90" : "opacity-0 group-hover:opacity-60",
          )}
          style={{ background: "var(--glow-primary)" }}
        />

        <div
          className={cn(
            "bg-spectral relative flex size-16 items-center justify-center rounded-2xl shadow-[0_1px_0_oklch(1_0_0/0.3)_inset,0_10px_30px_-10px_var(--glow-primary)] transition-transform duration-300",
            isDragging ? "scale-110" : "group-hover:scale-105",
          )}
        >
          <UploadCloud className="size-7 text-white" aria-hidden="true" />
        </div>

        <p className="font-display relative mt-6 text-xl font-semibold text-foreground">
          Drop your PDF or image here
        </p>
        <p className="relative mt-1.5 text-sm text-muted-foreground">
          or <span className="text-spectral font-semibold">click to browse</span>
        </p>
        <p className="relative mt-5 text-xs text-muted-foreground">
          PDF, PNG, JPG &middot; Maximum 20 MB
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
      />

      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
