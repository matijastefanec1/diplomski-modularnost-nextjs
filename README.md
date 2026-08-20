# SplitScore

Praktični dio diplomskog rada: ista aplikacija implementirana
**dvaput**, radi usporedbe organizacije koda. Varijanta A organizirana je prema
značajkama, varijanta B slojevito. Funkcionalnost, tehnološki stog, Prisma
model, tekst sučelja i vanjski testni ugovor identični su u obje varijante;
**organizacija koda jedina je promatrana varijabla**.

Opseg su tri poddomene: bodovanje i rang-lista, mečevi i profili igrača. To
obuhvaća registraciju i prijavu, evidenciju isključivo 2v2 meča s dva ili tri
valjana seta, potvrdu ili osporavanje u roku od 48 sati te transakcijsko
bodovanje sva četiri sudionika.

## Struktura

| Putanja | Sadržaj |
| --- | --- |
| [`variant-a-feature-based/`](variant-a-feature-based/README.md) | `features/*`, `shared/` i tanki `app/` |
| [`variant-b-clean/`](variant-b-clean/README.md) | slojevi `domain`, `application`, `infrastructure`, `presentation` |
| `e2e/` | jedini zajednički paket, promatra obje aplikacije izvana |
| `scripts/` | paritet Prisme i seeda te mjerni alati evaluacije |
| `tests/` | izvršni ugovor topologije uvoza na razini repozitorija |
| `docker/` | PostgreSQL s dvjema izoliranim bazama |

Varijante ne dijele nijednu liniju aplikacijskog koda; dupliciranje je
metodološki namjerno. Arhitekturna pravila nisu dokument nego konfiguracija u
`eslint.config.mjs`, koju testovi pokreću nad namjerno neispravnim primjerima.

## Preduvjeti

Node.js 24.15.0, pnpm 11.4.0 preko Corepacka, Docker Compose, slobodni portovi
5432 i 3000 te Chromium za Playwright.

## Prvo pokretanje

```powershell
Copy-Item .env.example .env
Copy-Item variant-a-feature-based/.env.example variant-a-feature-based/.env
Copy-Item variant-b-clean/.env.example variant-b-clean/.env
pnpm install --frozen-lockfile
pnpm db:up
pnpm db:migrate:a
pnpm db:migrate:b
pnpm db:seed
pnpm --filter @splitscore/e2e exec playwright install chromium
```

U svaku varijantnu `.env` datoteku upiši zaseban `AUTH_SECRET`, primjerice iz
`openssl rand -base64 32`; stvarne `.env` datoteke ostaju ignorirane. Jedan
PostgreSQL kontejner poslužuje dvije izolirane baze, pri čemu A koristi samo
`splitscore_a`, a B samo `splitscore_b`.

## Pokretanje

```powershell
pnpm dev:a
```

Obje aplikacije slušaju na `http://127.0.0.1:3000`, pa se pokreću jedna po
jedna; za drugu varijantu vrijedi `pnpm dev:b`. Prijava iz sintetičkog seeda:

```text
ana@seed.splitscore.test / SplitScore2026
```

## Provjere

```powershell
pnpm verify
```

Pokreće cijeli CI-ekvivalentni lanac za obje varijante: topologiju uvoza,
paritet Prisme, lint, arhitekturne granice, provjeru tipova, unit testove,
Prisma generate i validate, build, migracije, integraciju i po 21 zajednički
E2E scenarij. Traži pokrenut Docker, a aktivni `dev:a` ili `dev:b` mora se
ugasiti prije E2E-a iste varijante jer Next.js ne dopušta drugi dev server nad
istim projektom.

Pojedinačne provjere postoje kao `lint:a|b`, `typecheck:a|b`, `unit:a|b`,
`build:a|b`, `db:smoke:a|b`, `e2e:a|b` i `verify:a|b`.

## Mjerni alati

Brojčani rezultati usporedbe iz pisanog dijela rada reproduciraju se nad ovim
kodom, istim naredbama za obje varijante:

```powershell
pnpm evaluation:coverage:a
node scripts/evaluation-dependency-graph.mjs --variant a --output <prefiks>
node scripts/evaluation-prisma-imports.mjs --variant a --output <artefakt.json>
```

## Čišćenje razvojnih podataka

```powershell
pnpm db:clean:preflight
pnpm db:clean:a -- --scope=e2e
```
