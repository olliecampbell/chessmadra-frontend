import globals from "globals";
import typescriptParser from "@typescript-eslint/parser";
import typescriptPlugin from "@typescript-eslint/eslint-plugin";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import path from "path";
import { fileURLToPath } from "url";

// mimic CommonJS variables -- not needed if using CommonJS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended, // optional
});

export default [
  {
    ignores: ["dist/**/*", ".solid/**/*", "landing_page_src/**/*"],
  },
  js.configs.recommended,
  ...compat.config({
    plugins: ["solid", "unused-imports"],
    extends: [
      "eslint:recommended",
      "plugin:solid/typescript",
      "plugin:@typescript-eslint/recommended",
    ],
    rules: {
      "unused-imports/no-unused-imports-ts": 2,
    },
  }),
  {
    files: ["**/*.{ts,tsx,js}"],
    ignores: ["/dist", "/.solid"],

    plugins: {
      typescript: typescriptPlugin,
    },
    languageOptions: {
      parser: typescriptParser,

      globals: {
        ...globals.browser,
      },
    },
  },
];
