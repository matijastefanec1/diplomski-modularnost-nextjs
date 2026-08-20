import { defineConfig, globalIgnores } from "eslint/config";
import boundaries from "eslint-plugin-boundaries";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const generatedPrismaImport = {
  regex: "(^|/)generated/prisma(?:/|$)",
  message: "Generirani Prisma Client ostaje u infrastrukturnom sloju.",
};

const architectureFiles = [
  "app/**/*.{ts,tsx}",
  "src/**/*.{ts,tsx}",
  "tests/architecture-fixtures/**/*.{ts,tsx}",
];

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    files: architectureFiles,
    plugins: {
      boundaries,
    },
    settings: {
      "boundaries/elements": [
        { type: "app", pattern: "app" },
        { type: "domain", pattern: "domain" },
        { type: "application", pattern: "application" },
        { type: "infrastructure", pattern: "infrastructure" },
        { type: "presentation", pattern: "presentation" },
      ],
      "boundaries/files": [
        {
          category: "composition-root",
          pattern: "**/src/composition-root.ts",
        },
      ],
    },
    rules: {
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          policies: [
            {
              from: { element: { type: "app" } },
              allow: { to: { element: { type: "presentation" } } },
            },
            {
              from: { element: { type: "presentation" } },
              allow: { to: { element: { type: "application" } } },
            },
            {
              from: { element: { type: "presentation" } },
              allow: { to: { file: { categories: "composition-root" } } },
            },
            {
              from: { element: { type: "application" } },
              allow: { to: { element: { type: "domain" } } },
            },
            {
              from: { element: { type: "infrastructure" } },
              allow: {
                to: {
                  element: {
                    types: { anyOf: ["application", "domain"] },
                  },
                },
              },
            },
            {
              from: { file: { categories: "composition-root" } },
              allow: {
                to: {
                  element: {
                    types: { anyOf: ["application", "infrastructure"] },
                  },
                },
              },
            },
          ],
        },
      ],
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  {
    files: ["**/src/domain/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^(?!\\.)",
              message: "Domenski sloj ne smije imati vanjske uvoze.",
            },
            generatedPrismaImport,
          ],
        },
      ],
    },
  },
  {
    files: ["**/src/application/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^(?!\\.)",
              message:
                "Aplikacijski sloj smije ovisiti samo o vlastitim modulima i domeni.",
            },
            generatedPrismaImport,
          ],
        },
      ],
    },
  },
  {
    files: ["**/src/presentation/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/src/infrastructure",
                "@/src/infrastructure/*",
                "@/src/infrastructure/**",
              ],
              message:
                "Prezentacijski sloj koristi aplikacijske use-caseove, ne infrastrukturu.",
            },
            generatedPrismaImport,
            {
              group: ["next-auth", "next-auth/*", "next-auth/**"],
              message:
                "Auth.js mehanika dolazi isključivo kroz composition root.",
            },
          ],
        },
      ],
    },
  },
  {
    // Prefiks `**/` drži pravila primjenjivima i na arhitekturne fixture
    files: ["**/app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              ...generatedPrismaImport,
              message: "app ne smije izravno koristiti generirani Prisma Client.",
            },
            {
              group: ["next-auth", "next-auth/*", "next-auth/**"],
              message:
                "Auth.js mehanika dolazi isključivo kroz composition root.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["**/src/composition-root*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [generatedPrismaImport],
        },
      ],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "generated/prisma/**",
    "next-env.d.ts",
  ]),
]);
