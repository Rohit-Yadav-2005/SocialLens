import { cn } from "@/lib/utils";

/** Loupe mark — a lens with a focal crosshair, standing in for the
 * close, critical read SocialLens gives a post. Solid accent, no
 * gradient: one color, used because it's the interactive/brand color,
 * not as decoration. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn("size-8 text-primary", className)}
    >
      <circle cx="14" cy="14" r="9.5" stroke="currentColor" strokeWidth="2.25" />
      <path d="M20.75 20.75 L27 27" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
      <path d="M14 9.5 V18.5 M9.5 14 H18.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}
