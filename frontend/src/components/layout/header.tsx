"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/layout/logo";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const NAV_LINKS = [
  { href: "/analyze", label: "Analyze" },
  { href: "/history", label: "History" },
  { href: "/insights", label: "Insights" },
];

function NavLink({
  href,
  label,
  onNavigate,
}: {
  href: string;
  label: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "text-sm transition-colors",
        isActive ? "text-foreground underline decoration-primary underline-offset-4" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );
}

/** A masthead, not a SaaS navbar — no floating glass pill, no filled
 * corner button. Two stacked rows like a publication header: the mark
 * on its own line, a thin rule, then navigation presented as a plain
 * text line rather than pill-shaped nav items. The one action is a
 * bracket-style text button (monospace, no fill) — reads as a document
 * command, not a marketing CTA. */
export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="group flex items-center gap-2.5">
            <LogoMark className="size-6 transition-transform duration-200 ease-out group-hover:scale-105" />
            <span className="font-display text-lg">SocialLens</span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.href} {...link} />
            ))}
          </nav>

          <Link
            href="/analyze"
            className="hidden items-center gap-1 border border-primary px-4 py-1.5 font-mono text-xs font-medium tracking-wide text-primary uppercase transition-colors hover:bg-primary hover:text-primary-foreground md:inline-flex"
          >
            Analyze&nbsp;→
          </Link>

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu" />
              }
            >
              <Menu className="size-5" aria-hidden="true" />
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2.5">
                  <LogoMark className="size-6" />
                  SocialLens
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4 px-4" aria-label="Primary">
                {NAV_LINKS.map((link) => (
                  <NavLink key={link.href} {...link} onNavigate={() => setMobileMenuOpen(false)} />
                ))}
              </nav>
              <div className="mt-auto p-4">
                <Button
                  className="w-full"
                  nativeButton={false}
                  render={<Link href="/analyze" onClick={() => setMobileMenuOpen(false)} />}
                >
                  Analyze Content
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
