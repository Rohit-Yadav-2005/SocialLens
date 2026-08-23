import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    exclude: ["node_modules", ".next", "e2e"],
    // "forks" (the default pool) spawns child processes, which this
    // sandboxed environment doesn't reliably support — worker startup
    // just times out. Worker threads run in-process instead.
    pool: "threads",
  },
});
