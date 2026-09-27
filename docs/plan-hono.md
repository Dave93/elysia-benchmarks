# Plan — add Hono as a fourth configuration, and publish Elysia vs Hono

Agreed 2026-09-22. This is the first article subject this project
has chosen from measured demand rather than from what was already built.

## Why Hono, and why now

Google Suggest, 81 alphabet-expanded probes, 2026-09-21
(saved outside this repo):

- `elysia vs ` → **`elysia vs hono` first**.
- `elysia js vs ` → **`elysia js vs hono` first**, from an independent probe.
- Then express, fastify, nestjs, golang/go/fiber, fastapi, rust.
- `elysia django` → **empty completion list**. The article this repo already
  published targets a query nobody types.

Suggest ranks subjects; it cannot size them. The number arrives only from
Search Console, four weeks after publish. That is the verification leg, not a
prediction, and nothing in the article may claim traffic.

## The design constraint that decides whether this is worth doing

The Django comparison moves two variables at once — runtime and framework —
and the article has to spend paragraphs untangling them. **Hono runs on Bun,
so this one does not have to.** Hold everything constant except the framework:

| held constant | E (existing) | H (new) |
|---|---|---|
| runtime | Bun 1.4.2 | Bun 1.4.2 |
| driver | Drizzle over Bun SQL | same module, unchanged |
| schema, seed, indexes | `bench/schema.sql`, 50k users / 200k orders | same |
| validation schemas | TypeBox | **the same TypeBox objects**, via `@hono/typebox-validator` |
| JWT | `jose`, HS256 | same module, unchanged |
| hasher | `node:crypto` chained SHA-256 | same module, unchanged |
| build | `bun build --target bun`, NODE_ENV=production | same |

Only `app.ts` differs. `db.ts`, `auth.ts`, `cpu.ts` and `schema.ts` are
imported from the existing app rather than copied, so a divergence is
impossible rather than merely unlikely.

**If the two sides cannot share the same TypeBox schemas, stop and say so in
the article.** A validator difference disguised as a framework difference is
the single most likely way for this comparison to lie, and it is the mistake
the Django article's `/cpu` row already documents in another form.

## Versions to pin (checked on npm 2026-09-22)

- `hono` 4.13.8
- `@hono/typebox-validator` 1.1.0 (TypeBox middleware; the reason this
  comparison can isolate the framework)

## Steps

1. `apps/hono-api/` — package.json, `src/app.ts`, `src/index.ts`, `build.ts`.
   Re-export `db`, `auth`, `cpu`, `schema` from `apps/elysia-api/src/`.
2. Seven routes, responses **byte-identical** to E: `/health`, `POST /echo`,
   `/cpu?n=`, `/users/:id`, `/users?page=&limit=`, `POST /orders`, `/me`.
   Status codes matter too: 201 on create, 401 unauthenticated, 404 missing.
3. Add `{ id: "H", label: "Hono / Bun / Drizzle + Bun SQL" }` to `CONFIGS` in
   `bench/lib.ts`.
4. `bun bench/parity.ts` with `CONFIGS=E,H` — all 38 contract checks must pass
   **before any load is generated**. Byte-for-byte is the gate, not "close
   enough"; a differing error body is a finding to report, not to smooth over.
5. Noise floor on H alone, the same way the existing floor was taken.
6. Full matrix `CONFIGS=E,H` × 7 routes × c=10/100/500 × 3 rounds, rotated
   order, fresh process per round, `caffeinate -dimsu`, Spotlight off,
   `bombardier -t 180s`, `kern.ipc.somaxconn=4096`, CHECKPOINT before every
   window. Every trap the Django run hit is written down in
   `results/friction-log.md`; read it before starting, not after.
7. Report, then the article through `content-graph-flow` with a skeptic that
   recomputes every number from the run of record.

## What this benchmark will not claim

- Nothing about Hono on Node, Deno or workers. One runtime was the point.
- No memory verdict. One process serves every route in a fixed order, so RSS
  is a high-water mark of the sequence, and the Django article already had to
  refuse this claim.
- No multi-worker or production-shape claim. One process each, one laptop,
  load generator on the same machine.
- No "X is better". The output is where the framework step is worth something
  and where it disappears into the noise floor.

## Honest risks, written before the work

- **Hono may be faster.** The article ships either way, with the same
  arithmetic. A benchmark that can only produce one answer is not one.
- Hono's router and validator middleware may make some routes non-comparable
  (coercion differences on query parameters are the likely spot). Parity
  catches it; if it cannot be fixed without special-casing, the route leaves
  the matrix with the reason stated.
- ~~The repo is named `elysia_vs_django`.~~ Renamed 2026-09-27 to
  `elysia_benchmarks` locally and `Dave93/elysia-benchmarks` on GitHub; the
  old GitHub URL answers 301 to the new one, so published links still resolve.
