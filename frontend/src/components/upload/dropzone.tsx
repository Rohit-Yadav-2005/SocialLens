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
      <div className="shadow-2 flex items-center gap-4 rounded-xl border border-primary/40 bg-card p-5">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-accent">
          <FileTypeIcon file={selectedFile} />
        </div>
        <div className="min-w-0 flex-1">
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
          "group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-16 text-center transition-colors duration-150 sm:py-24",
          isDragging
            ? "border-primary bg-accent/60"
            : "border-border bg-card hover:border-primary/50 hover:bg-accent/20",
          disabled && "pointer-events-none opacity-60",
        )}
      >
        <div
          className={cn(
            "flex size-14 items-center justify-center rounded-xl border border-border bg-muted transition-transform duration-150",
            isDragging && "scale-105 border-primary",
          )}
        >
          <UploadCloud className="size-6 text-primary" aria-hidden="true" />
        </div>

        <p className="font-display mt-6 text-xl font-medium text-foreground">
          Drop your PDF or image here
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          or <span className="font-medium text-primary">click to browse</span>
        </p>
        <p className="mt-5 text-xs text-muted-foreground">
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
