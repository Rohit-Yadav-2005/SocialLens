import { z } from "zod";

export const ALLOWED_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg"];
export const MAX_FILE_SIZE_MB = 20;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

function hasAllowedExtension(file: File): boolean {
  const name = file.name.toLowerCase();
  return ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext));
}

export const fileUploadSchema = z
  .instanceof(File)
  .refine((file) => file.size > 0, { message: "The selected file is empty." })
  .refine((file) => file.size <= MAX_FILE_SIZE_BYTES, {
    message: `File exceeds the ${MAX_FILE_SIZE_MB} MB size limit.`,
  })
  .refine(hasAllowedExtension, {
    message: `Unsupported file type. Allowed: PDF, PNG, JPG.`,
  });

/** Returns an error message if the file fails client-side validation, or
 * null if it passes. This is a fast pre-check only — the backend still
 * validates MIME type and the actual file signature server-side. */
export function validateFile(file: File): string | null {
  const result = fileUploadSchema.safeParse(file);
  return result.success ? null : (result.error.issues[0]?.message ?? "Invalid file.");
}
