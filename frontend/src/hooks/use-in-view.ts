"use client";

import { useEffect, useRef, useState } from "react";

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** True once the element has entered the viewport (stays true after —
 * this is a one-time reveal trigger, not a visibility tracker). Under
 * prefers-reduced-motion, returns true immediately and never observes at
 * all, so those users get content without a suppressed-but-still-deferred
 * mount. */
export function useInView<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T | null>(null);
  const [reduced] = useState(prefersReducedMotion);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (reduced) return;

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, reduced]);

  return { ref, inView: reduced ? true : inView };
}
