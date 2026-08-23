import { defineConfig, devices } from "@playwright/test";

/** One E2E happy-path test (upload → process → results) against the
 * real Next.js app. The backend's own API responses are mocked via
 * page.route() rather than running a real FastAPI + Gemini + Tesseract
 * stack — this test verifies the frontend's real component wiring,
 * routing, and rendering, not backend behavior (which has its own,
 * separate, much larger test suite). See docs/decisions.md. */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
