"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu } from "lucide-react";
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
        "group relative rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-200",
        isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
      {/* Spectral underline: full width on the active route, wiping in on hover. */}
      <span
        aria-hidden="true"
        className={cn(
          "bg-spectral absolute inset-x-3 -bottom-px h-px origin-left transition-transform duration-300 ease-out",
          isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
        )}
      />
    </Link>
  );
}

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="glass sticky top-0 z-40 border-b border-border/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group flex items-center gap-2.5 font-semibold tracking-tight"
        >
          <LogoMark className="size-7 transition-transform duration-500 ease-out group-hover:rotate-90" />
          <span className="font-display text-[1.0625rem] tracking-tight">SocialLens</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.href} {...link} />
          ))}
        </nav>

        <div className="hidden md:block">
          <Button
            size="lg"
            className="group h-9 gap-1.5 px-4"
            nativeButton={false}
            render={<Link href="/analyze" />}
          >
            Analyze Content
            <ArrowRight
              className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Button>
        </div>

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
            <nav className="flex flex-col gap-1 px-4" aria-label="Primary">
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
    </header>
  );
}
