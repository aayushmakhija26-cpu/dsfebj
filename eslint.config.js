import { FlatCompat } from "@eslint/eslintrc";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

/** @type {import("eslint").Linter.Config[]} */
const config = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    rules: {
      // Enforce consistent imports
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      // Prevent accidental any usage
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Require explicit return types on exported functions
      "@typescript-eslint/explicit-module-boundary-types": "off",
      // No floating promises — important for async tRPC mutations
      "@typescript-eslint/no-floating-promises": "warn",
      // No non-null assertions — prefer proper null checks
      "@typescript-eslint/no-non-null-assertion": "warn",
      // No PII in console.log
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "dist/**",
      "build/**",
      "coverage/**",
      "playwright-report/**",
      "prisma/generated/**",
      "public/**",
      "eslint.config.js",
      "next-env.d.ts",
    ],
  },
];

export default config;
