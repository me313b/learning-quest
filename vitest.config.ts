import { defineConfig } from "vitest/config";
import path from "path";

// Unit tests for the pure game logic (rewards, levels, adaptive difficulty).
// These run without Next.js or a browser, so they're fast and catch regressions
// in the rules that decide difficulty and earned video time.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
