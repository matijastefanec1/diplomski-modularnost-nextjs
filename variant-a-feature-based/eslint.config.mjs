import { defineConfig, globalIgnores } from "eslint/config";
import boundaries from "eslint-plugin-boundaries";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const architectureFiles = [
  "app/**/*.{ts,tsx}",
  "features/**/*.{ts,tsx}",
  "shared/**/*.{ts,tsx}",
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
        {
          type: "feature",
          pattern: "features/*",
          capture: ["featureName"],
        },
        { type: "shared", pattern: "shared" },
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
              allow: { to: { element: { type: "shared" } } },
            },
            {
              from: { element: { type: "app" } },
              allow: {
                to: {
                  element: {
                    type: "feature",
                    fileInternalPath: ["index.ts", "index.tsx"],
                  },
                },
              },
            },
            {
              from: { element: { type: "feature" } },
              allow: { to: { element: { type: "shared" } } },
            },
            {
              from: {
                element: {
                  type: "feature",
                  captured: { featureName: "matches" },
                },
              },
              allow: {
                to: {
                  element: {
                    type: "feature",
                    captured: { featureName: "scoring" },
                    fileInternalPath: ["index.ts", "index.tsx"],
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
    files: ["shared/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features", "@/features/*", "@/features/**"],
              message: "shared ne smije ovisiti o značajkama.",
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
              group: ["@/features/*/*", "@/features/*/**"],
              message: "Značajke se uvoze isključivo preko index.ts.",
            },
            {
              group: ["@/generated/prisma", "@/generated/prisma/**"],
              message: "App rute ne smiju izravno koristiti Prismu.",
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
