import "@testing-library/jest-dom/vitest";

// jsdom doesn't implement matchMedia. Several components check
// prefers-reduced-motion (useCountUp, useInView) — default it to
// "reduced" so those hooks resolve to their final value immediately in
// tests, rather than mid-animation. Tests assert on rendered content,
// not animation timing; a test that specifically needs to exercise the
// animated path can override this per-file.
if (!window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: query.includes("prefers-reduced-motion"),
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
