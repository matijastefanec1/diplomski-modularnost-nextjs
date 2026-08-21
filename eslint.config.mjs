import { defineConfig } from "eslint/config";
import boundaries from "eslint-plugin-boundaries";
import tseslint from "typescript-eslint";

const repositoryFiles = [
  "variant-a-feature-based/**/*.{ts,tsx}",
  "variant-b-clean/**/*.{ts,tsx}",
  "e2e/**/*.{ts,tsx}",
  "tests/repository-architecture-fixtures/**/*.{ts,tsx}",
];

export default defineConfig([
  {
    files: repositoryFiles,
    languageOptions: {
      parser: tseslint.parser,
    },
    plugins: {
      boundaries,
    },
    settings: {
      "import/resolver": {
        typescript: {
          project: "tsconfig.repository-architecture.json",
        },
      },
      "boundaries/elements": [
        { type: "variant-a", pattern: "variant-a-feature-based" },
        { type: "variant-b", pattern: "variant-b-clean" },
        { type: "e2e", pattern: "e2e" },
      ],
    },
    rules: {
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          policies: [
            {
              from: { element: { type: "variant-a" } },
              allow: { to: { element: { type: "variant-a" } } },
            },
            {
              from: { element: { type: "variant-b" } },
              allow: { to: { element: { type: "variant-b" } } },
            },
            {
              from: { element: { type: "e2e" } },
              allow: { to: { element: { type: "e2e" } } },
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      "variant-a-feature-based/**/*.{ts,tsx}",
      "tests/repository-architecture-fixtures/**/variant-a-feature-based/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@splitscore/variant-b",
                "@splitscore/variant-b/**",
                "@splitscore/e2e",
                "@splitscore/e2e/**",
              ],
              message: "Varijanta A ne smije uvoziti drugi workspace modul.",
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      "variant-b-clean/**/*.{ts,tsx}",
      "tests/repository-architecture-fixtures/**/variant-b-clean/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@splitscore/variant-a",
                "@splitscore/variant-a/**",
                "@splitscore/e2e",
                "@splitscore/e2e/**",
              ],
              message: "Varijanta B ne smije uvoziti drugi workspace modul.",
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      "e2e/**/*.{ts,tsx}",
      "tests/repository-architecture-fixtures/**/e2e/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@splitscore/variant-a",
                "@splitscore/variant-a/**",
                "@splitscore/variant-b",
                "@splitscore/variant-b/**",
              ],
              message: "Zajednički E2E ne smije uvoziti aplikacijski kod.",
            },
          ],
        },
      ],
    },
  },
]);
