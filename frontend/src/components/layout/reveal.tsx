"use client";

import type { ElementType, ReactNode } from "react";

import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

interface RevealProps {
  children: ReactNode;
  /** Stagger offset in ms, for grouped items entering together. */
  delay?: number;
  className?: string;
  as?: ElementType;
}

/** Fades + slides an element in the first time it enters the viewport.
 * Pure CSS transition driven by one class toggle (see .reveal in
 * globals.css) — no animation library, respects prefers-reduced-motion
 * at both the hook and CSS level. */
export function Reveal({ children, delay = 0, className, as: Tag = "div" }: RevealProps) {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <Tag
      ref={ref}
      className={cn("reveal", inView && "in-view", className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
