# SplitScore - varijanta B (clean/layered)

Organiziran slojevito. Funkcionalno i vizualno identična
[varijanti A](../variant-a-feature-based/README.md); razlikuju se samo
vlasništvo nad kodom i smjerovi ovisnosti.

## Struktura

```text
app/                         tanke App Router rute
src/domain/                  čisti entiteti i domenska pravila
src/application/             use-caseovi i portovi
src/infrastructure/          Prisma repozitoriji, mapperi i Auth.js
src/presentation/            stranice, forme, Server Actions i UI
src/composition-root.ts      jedino mjesto sastavljanja adaptera
prisma/                      schema i migracije
```

Domenska pravila ne znaju za okvir ni bazu, use-caseovi ovise o portovima,
infrastruktura te portove implementira Prismom, a prezentacija poziva
use-caseove.

## Granice

- smjer je `presentation/infrastructure → application → domain`;
- `domain/` i `application/` nemaju nijedan vanjski uvoz ni `@/` alias;
- `presentation/` ne uvozi infrastrukturu ni generirani Prisma Client;
- samo `composition-root.ts` smije istodobno vidjeti application i
  infrastructure.

Pravila su zapisana u `eslint.config.mjs` i prijavljuju se kao greška, a
`tests/architecture.test.ts` pokreće tu istu konfiguraciju nad namjerno
neispravnim primjerima i tvrdi da je prijavljeno konkretno pravilo. Uz
negativne, provjerava se i dopuštena iznimka kompozicijskog korijena.

Namjerna karakteristika ovog pristupa, koju rad mjeri: generirani Prisma tipovi
ne izlaze iz infrastrukture, pa se plaća većim brojem datoteka kroz koje jedna
funkcionalnost prolazi.

## Naredbe

```powershell
pnpm dev:b
pnpm verify:b
pnpm evaluation:coverage:b
```

Postavljanje okoline, baze, seeda i cleanupa opisano je u
[korijenskom README-ju](../README.md).
