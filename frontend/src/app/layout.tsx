import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

import { Header } from "@/components/layout/header";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** Display face for headings. Geometric and slightly technical — reads as
 * "instrument", and is distinct enough from the body sans that headings
 * stop looking like bolder body text. */
const spaceGrotesk = Space_Grotesk({
  variable: "--font-display-family",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "SocialLens — Understand. Improve. Engage.",
  description:
    "Upload social-media content as a PDF or image and get an engagement analysis, scored breakdown, and an AI-improved rewrite.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="grain flex min-h-full flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <QueryProvider>
            {/* Ambient spectral field. Fixed and non-interactive: it gives the
             * page depth without affecting layout or hit-testing. */}
            <div
              aria-hidden="true"
              className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
            >
              <div
                className="animate-drift absolute -top-[22rem] -left-[16rem] size-[46rem] rounded-full blur-[130px]"
                style={{ background: "var(--glow-primary)" }}
              />
              <div
                className="animate-drift absolute -top-[10rem] -right-[20rem] size-[38rem] rounded-full blur-[130px] [animation-delay:-8s]"
                style={{ background: "var(--glow-cyan)" }}
              />
              <div
                className="animate-drift absolute -bottom-[26rem] left-1/3 size-[42rem] rounded-full blur-[140px] [animation-delay:-15s]"
                style={{ background: "var(--glow-primary)" }}
              />
            </div>

            <Header />
            <main className="relative z-10 flex flex-1 flex-col">{children}</main>
            <Toaster position="bottom-right" richColors />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
