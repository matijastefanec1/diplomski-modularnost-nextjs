# SplitScore - varijanta A (feature-based)

Organiziran prema značajkama. Funkcionalno i vizualno
identična [varijanti B](../variant-b-clean/README.md); razlikuju se samo
vlasništvo nad kodom i smjerovi ovisnosti.

## Struktura

```text
app/                    tanke rute i root layout
features/auth/          Auth.js tok i korisnički izbornik
features/players/       registracija i javni profil
features/matches/       evidencija, povijest, detalj i odluka
features/scoring/       rang-lista i čista pravila bodovanja
shared/                 generički UI, Prisma singleton i neutralni alati
prisma/                 schema i migracije
```

Svaka značajka okuplja svoj UI, Server Actions, upite, validaciju i domenska
pravila koja joj pripadaju. `app/` je tanki App Router adapter, a `shared/`
ostaje generički i domenski neutralan.

## Granice

- značajka je izvana dostupna samo kroz `features/<značajka>/index.ts`;
- `shared/` ne smije uvoziti `features/`, a `app/` ne dira Prisma Client;
- među značajkama dopuštena su tri smjera, uvijek kroz javno sučelje:
  `matches → scoring`, `matches → auth` i `players → auth`;
- `features/matches/lib` i `features/scoring/lib` nemaju Next.js, Auth.js ni
  Prismu.

Pravila su zapisana u `eslint.config.mjs` i prijavljuju se kao greška, a
`tests/architecture.test.ts` pokreće tu istu konfiguraciju nad namjerno
neispravnim primjerima i tvrdi da je prijavljeno konkretno pravilo.

Namjerna karakteristika ovog pristupa, koju rad mjeri: značajke smiju izravno
koristiti generirane Prisma tipove sve do prezentacije, za razliku od varijante
B. Čisti `lib` moduli su jedina iznimka.

## Naredbe

```powershell
pnpm dev:a
pnpm verify:a
pnpm evaluation:coverage:a
```

Postavljanje okoline, baze, seeda i cleanupa opisano je u
[korijenskom README-ju](../README.md).
