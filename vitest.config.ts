import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: [
      "tests/unit/**/*.{test,spec}.{ts,tsx}",
      "tests/integration/**/*.{test,spec}.{ts,tsx}",
      "src/**/*.{test,spec}.{ts,tsx}",
    ],
    exclude: ["node_modules", ".next", "tests/e2e"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.d.ts",
        "src/app/**",     // Next.js pages tested via E2E
        "src/components/**", // React components tested via E2E
        "src/env.js",
        "src/**/index.ts",
        "src/server/**",  // Phase 2+ (tRPC, database)
        "src/i18n/**",    // Phase 2+ (internationalization)
        "src/middleware.ts", // Phase 2+ (auth, RBAC)
        "src/services/auth/**", // Auth services tested via integration tests
        "src/services/vault/**", // Vault services tested via E2E
        "src/services/jobs/**", // Job queue services tested via E2E
        "src/services/wizard/draftPersistence.ts", // Client-side persistence tested via E2E
        "src/services/workflow/**", // Workflow tested via E2E
        "node_modules",
      ],
      thresholds: {
        statements: 50,
        branches: 70,
        functions: 50,
        lines: 50,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "server-only": path.resolve(__dirname, "tests/__mocks__/server-only.ts"),
    },
  },
});
