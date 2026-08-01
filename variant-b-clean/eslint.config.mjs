import { defineConfig, globalIgnores } from "eslint/config";
import boundaries from "eslint-plugin-boundaries";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

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
            {
              group: ["@/generated/prisma", "@/generated/prisma/**"],
              message:
                "Generirani Prisma Client ostaje u infrastrukturnom sloju.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/generated/prisma", "@/generated/prisma/**"],
              message: "app ne smije izravno koristiti generirani Prisma Client.",
            },
          ],
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
