import { defineConfig, globalIgnores } from "eslint/config";
import boundaries from "eslint-plugin-boundaries";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const generatedPrismaImport = {
  regex: "(^|/)generated/prisma(?:/|$)",
  message: "Ovaj modul ne smije izravno koristiti generirani Prisma Client.",
};

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
            {
              // evidencija meča treba prijavljenog igrača, a identitet ne smije kroz formu
              // auth ne uvozi nijednu značajku, pa ciklusa nema
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
                    captured: { featureName: "auth" },
                    fileInternalPath: ["index.ts", "index.tsx"],
                  },
                },
              },
            },
            {
              // registracija je u players i prijavljuje igrača kroz javno sučelje autha
              // obrnuti smjer ostaje zabranjen, zato authorize() radi vlastiti upit
              from: {
                element: {
                  type: "feature",
                  captured: { featureName: "players" },
                },
              },
              allow: {
                to: {
                  element: {
                    type: "feature",
                    captured: { featureName: "auth" },
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
    // Prefiks `**/` drži pravila primjenjivima i na arhitekturne fixture
    files: ["**/shared/**/*.{ts,tsx}"],
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
    files: ["**/features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/*/*", "@/features/*/**"],
              message: "Značajke se uvoze isključivo preko index.ts.",
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      "**/features/matches/lib/**/*.{ts,tsx}",
      "**/features/scoring/lib/**/*.{ts,tsx}",
    ],
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
              ...generatedPrismaImport,
              message: "Čisti lib moduli ne smiju uvoziti Prismu.",
            },
            {
              group: ["@prisma/*"],
              message: "Čisti lib moduli ne smiju uvoziti Prismu.",
            },
            {
              regex: "(^|/)shared/lib/prisma(?:$|[/.])",
              message:
                "Čisti lib moduli ne smiju uvoziti shared Prisma adapter.",
            },
            {
              group: ["next", "next/*", "next/**"],
              message: "Čisti lib moduli ne smiju uvoziti Next.js.",
            },
            {
              group: ["next-auth", "next-auth/*", "@auth/*"],
              message: "Čisti lib moduli ne smiju uvoziti Auth.js.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["**/app/**/*.{ts,tsx}"],
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
              ...generatedPrismaImport,
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
