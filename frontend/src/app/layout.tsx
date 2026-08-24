import type { Metadata } from "next";
import { Calistoga, Geist, Geist_Mono } from "next/font/google";
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

/** Display face for headings — a warm slab-serif with real character
 * (not a "quirky variable soft-serif" like Fraunces, itself now an
 * AI-template default). next/font/google only has Calistoga's normal
 * style registered (no italic face available, unlike Google Fonts'
 * own catalog) — pull quotes use CSS `italic` on this regular weight
 * instead, a browser-synthesized slant rather than a true italic
 * design, which is a fine, imperceptible fallback here. */
const calistoga = Calistoga({
  variable: "--font-display-family",
  subsets: ["latin"],
  weight: "400",
  style: "normal",
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
      className={`${geistSans.variable} ${geistMono.variable} ${calistoga.variable} h-full antialiased`}
    >
      <body className="grain flex min-h-full flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <QueryProvider>
            <Header />
            <main className="flex flex-1 flex-col">{children}</main>
            <Toaster position="bottom-right" richColors />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
