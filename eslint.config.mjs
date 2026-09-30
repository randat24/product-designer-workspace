import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

// Next.js rules (core web vitals, TypeScript) plus the full accessibility set
// (docs/QUALITY_REVIEW.md C3, C5: labelled controls, no clickable divs).
const config = [
  { ignores: [".next/**", "node_modules/**", "supabase/**", "next-env.d.ts", "playwright-report/**", "test-results/**"] },
  ...compat.extends("next/core-web-vitals", "next/typescript", "plugin:jsx-a11y/recommended"),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      // Autofocus is used on purpose for the first field of creation forms.
      "jsx-a11y/no-autofocus": "off",
    },
  },
];

export default config;
