# Elysia vs Django — benchmark data pack

Seven equivalent SaaS-slice routes, adapted from `../elysia_vs_nest`, with an explicitly named Python stack rather than an intentionally weak `runserver` baseline. The run of record is `results/full-2026-09-18b.json` (harness v3, 2026-09-18): 3 configurations × 7 routes × c=10/100/500 × 3 rounds, 189/189 windows valid. Quick and smoke artifacts below are plumbing checks only.

## Configurations

- `E`: Elysia **2.0.0-beta.12**, Bun **1.4.2**, Drizzle + Bun SQL.
- `N-sync`: Django **6.1.1**, Ninja **1.7.0**, CPython **3.14.6**, Gunicorn **26.2.0** gthread, one worker / ten threads.
- `N-async`: same Django API under Uvicorn **0.53.0**, uvloop + httptools, async ORM interface.
- `E-aot`: optional Elysia AOT sensitivity, same source/dependencies. Not part of the full matrix.
- `E-native`: `/cpu` diagnostic only, same build with `CPU_HASHER=bun-native` (`Bun.SHA256.hash` instead of `node:crypto`).

Both Django modes use Pydantic 2, orjson and psycopg binary + connection pool max 10. Async ORM here is a synchronous ORM bridge, **not native async SQL**. Full dependency pins are in `bun.lock`, `apps/elysia-api/bun.lock`, `apps/django-api/uv.lock`.

## Research and decisions

- [Django deployment research](docs/research/deployment.md): primary sources, WSGI/ASGI, GIL, workers, psycopg pools, Uvicorn/Granian/Gunicorn.
- [API-library research](docs/research/api-libraries.md): Ninja/DRF/Pydantic/orjson/JWT, validation and ORM fairness.
- [Methodology and limitations](docs/methodology.md).
- [Specification](docs/spec.md).
- [Independent Grok review prompt](docs/grok-review-prompt.md): ready to paste; no Grok response has been obtained yet.

Research recommends investigating Granian, DRF, latest Python patch, stable Elysia, and equal-resource Linux/multi-worker lanes. These are **not implemented or measured**; the run of record was published without them. Do not present this as exhaustive “best possible Python vs best possible JS”.

## Setup (macOS, project root)

Requires Bun, uv, PostgreSQL 17, bombardier, psql and lsof. Uses local PostgreSQL user `postgres`, port 5432 by default. Python 3.14.6 must be installed or available through uv.

```sh
bun install --frozen-lockfile
bun install --cwd apps/elysia-api --frozen-lockfile
uv sync --locked --project apps/django-api
bun run build
bun run seed
```

Seed creates **`bench_elysia_django` only**, leaving original `bench_saas` untouched. Replacing an existing fixture requires `RESEED=1 bun run seed`; it is destructive to that fixture. No FORCE disconnect. Do not run seed/reset against a shared or valuable database.

## Verification

```sh
bun test bench
apps/django-api/.venv/bin/python apps/django-api/manage.py check
PYTHONPATH=apps/django-api DJANGO_SETTINGS_MODULE=config.settings \
  apps/django-api/.venv/bin/python -c 'import django; django.setup(); import unittest; r=unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromName("api.tests")); raise SystemExit(not r.wasSuccessful())'
bun run parity
CONFIGS=E,E-aot,N-sync,N-async bun run parity
```

Parity performs 38 contract checks per configuration, including all seven happy paths, negative inputs, default pagination, JWT failures, unknown fields and inserted-row persistence. 422 diagnostics remain framework-native: compare rejection/status, not error-message wording. SQL tests use the dedicated seeded DB and create/delete one order; not a production-safe test suite.

## Measurements

```sh
# Short, fail-closed smoke comparison, unique output path required:
SMOKE_DURATION=3s OUT=results/my-smoke.json bun bench/smoke.ts

# Main harness: parity first; quick is NOT publication-quality:
BENCH_QUICK=1 OUT=results/my-quick.json bun run bench

# Optional startup/noise diagnostics and explicit report inputs:
BENCH_QUICK=1 OUT=results/my-boot.json bun run boot
BENCH_QUICK=1 CONFIGS=E OUT=results/my-noise.json bun run noise
OUT=results/my-summary.md bun run report results/my-quick.json results/my-boot.json results/my-noise.json

# Full run on an idle, plugged-in host (do not run while building):
# Includes its own parity + quick preflight before full-duration windows.
OUT=results/my-full.json bun run bench
```

Inspect each command's recorded metadata, raw errors and samples before reporting any ratio. `CONFIGS=E,N-sync,N-async`, `CASES=health,echo,me,user,list,order,cpu`, `CONC=10,100,500` restrict the main matrix. The full matrix takes many minutes; resource sampling covers the server tree, not only Gunicorn's master. Laptop + client + database contention is not a cloud-server result.

## Results

- `results/full-2026-09-18b.json` + `results/full-2026-09-18b-summary.md`: **run of record**, harness v3 (CHECKPOINT before every window, in-window checkpoints recorded). 189/189 valid, zero contended attempts, zero in-window checkpoints.
- `results/cpu-hasher-2026-09-18.json` + summary: `/cpu` diagnostic, E (`node:crypto`) vs E-native (`Bun.SHA256.hash`), 3 rounds.
- `results/full-2026-09-18.json` + summary: earlier full run on harness v2, superseded; checkpoints forced by earlier windows' WAL landed in E `/order` windows.
- Noise floor and boot exist only as quick runs (below); no full-duration noise floor was measured.

## Existing diagnostic artifacts

- `results/authoritative-e2e.txt`: direct Uvicorn + curl check outside the harness, all seven routes, exact stdout/stderr/exit codes, inserted-row persistence and listener cleanup; FINAL=PASS.
- `results/parity.json`: successful contract verification, including AOT (overwritten only by explicit standalone parity command).
- `results/elysia-health-baseline.json`: first Elysia-only 3s load-generator check.
- `results/smoke.json`: **INVALID old smoke harness** — omitted Authorization on `/me`; retained only for audit, never compare these numbers.
- `results/smoke-me-fixed.json`: isolated regression check after header fix.
- `results/smoke-corrected.json`: three configs × seven routes, 3s measured windows, zero HTTP/transport errors; **smoke only**, no repeated statistical result.
- `results/quick-verification.json`: main harness, 21/21 valid windows, parity evidence, raw generator output and tree resource samples.
- `results/boot-quick.json`, `results/noise-quick.json`: passed quick startup/noise diagnostics. Observed short-window range/min ~10–12%, not a confidence interval.
- `results/quick-summary.md`: generated summary of all three main-harness diagnostic files.
- `results/friction-log.md`: implementation/verification history.

`/health`, `/echo`, `/users/:id`, `/users`, `/orders`, `/me`, `/cpu` listen on **127.0.0.1:3100** during tests. The apps deliberately omit production security features, use a public fixture JWT key, expose unauthenticated writes/CPU work, and must **never be deployed**.

No DX or monetary-cost claims are copied from the Nest benchmark. Comparing a mandatory JS build with Python's optional compilation, or projecting laptop single-worker numbers into server bills, would require a separate justified protocol.
