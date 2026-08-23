import { cn } from "@/lib/utils";

/** Lens aperture mark. The product is a lens; a lens refracts light into a
 * spectrum — so the mark is an aperture with a spectral sweep through it,
 * which is also where the whole palette comes from. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn("size-8", className)}
    >
      <defs>
        <linearGradient id="sl-spectral" x1="2" y1="26" x2="30" y2="6">
          <stop offset="0%" stopColor="oklch(0.72 0.2 305)" />
          <stop offset="35%" stopColor="oklch(0.62 0.22 289)" />
          <stop offset="68%" stopColor="oklch(0.66 0.17 250)" />
          <stop offset="100%" stopColor="oklch(0.78 0.14 186)" />
        </linearGradient>
      </defs>

      {/* aperture ring */}
      <circle cx="16" cy="16" r="12.5" stroke="url(#sl-spectral)" strokeWidth="2.5" />
      {/* refracted beam through the lens */}
      <path
        d="M7.5 21.5 L24.5 10.5"
        stroke="url(#sl-spectral)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* focal point */}
      <circle cx="16" cy="16" r="3.25" fill="url(#sl-spectral)" />
    </svg>
  );
}
