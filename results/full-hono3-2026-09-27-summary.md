# Elysia benchmarks — recorded observations (E, H, H-mirror)

## bench — results/full-hono3-2026-09-27.json

Status: **passed**. Mode: **full-duration settings**. Started: 2026-09-27T06:28:49.913Z.

Configured repeats: 3. Recorded iterations/windows: 189.

- **E**: Elysia / Bun / Drizzle + Bun SQL
- **H**: Hono / Bun / Drizzle + Bun SQL
- **H-mirror**: Hono / Bun / Drizzle + Bun SQL / exact-mirror cleaner

Parity evidence: passed in this invocation.

Warmup 5s; measured duration 30s; concurrency 10, 100, 500.

Numbers are medians of valid recorded windows, not pooled latency percentiles. Invalid/missing windows are explicitly excluded, not repaired; incomplete groups are not comparable.

### API / database routes

| Config | Case | c | Valid / recorded | Success req/s | Success req per tree CPU-second | p50 ms | p99 ms | Mean tree RSS MiB | Tree CPU cores | Non-2xx incl. others | Transport errors (overlap) |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| E | health | 10 | 3/3 | 131056.2 | 119566 | 0.07 | 0.14 | 61.90 | 1.10 | 0 | 0 |
| E | health | 100 | 3/3 | 142488.9 | 137924 | 0.73 | 1.24 | 64.12 | 1.03 | 0 | 0 |
| E | health | 500 | 3/3 | 141963.8 | 138042 | 3.55 | 4.42 | 64.15 | 1.03 | 0 | 0 |
| E | echo | 10 | 3/3 | 120942.5 | 112290 | 0.07 | 0.17 | 77.11 | 1.08 | 0 | 0 |
| E | echo | 100 | 3/3 | 126490.4 | 122751 | 0.74 | 1.34 | 79.32 | 1.03 | 0 | 0 |
| E | echo | 500 | 3/3 | 125121.4 | 121743 | 3.95 | 4.87 | 81.17 | 1.03 | 0 | 0 |
| E | me | 10 | 3/3 | 28014.8 | 20965 | 0.32 | 0.89 | 106.30 | 1.34 | 0 | 0 |
| E | me | 100 | 3/3 | 27984.5 | 20043 | 3.47 | 4.84 | 111.09 | 1.40 | 0 | 0 |
| E | me | 500 | 3/3 | 27295.5 | 18764 | 18.30 | 20.83 | 128.36 | 1.46 | 0 | 0 |
| E | user | 10 | 3/3 | 35522.1 | 32657 | 0.27 | 0.71 | 130.74 | 1.09 | 0 | 0 |
| E | user | 100 | 3/3 | 35934.9 | 31926 | 2.70 | 3.85 | 134.47 | 1.13 | 0 | 0 |
| E | user | 500 | 3/3 | 35261.5 | 29383 | 14.37 | 16.69 | 139.56 | 1.20 | 0 | 0 |
| E | list | 10 | 3/3 | 26088.5 | 23838 | 0.38 | 0.87 | 145.81 | 1.09 | 0 | 0 |
| E | list | 100 | 3/3 | 25938.6 | 21679 | 3.81 | 5.43 | 146.90 | 1.20 | 0 | 0 |
| E | list | 500 | 3/3 | 25558.0 | 19807 | 19.54 | 24.03 | 149.64 | 1.29 | 0 | 0 |
| E | order | 10 | 3/3 | 28711.4 | 26444 | 0.33 | 0.80 | 154.83 | 1.08 | 0 | 0 |
| E | order | 100 | 3/3 | 30789.1 | 27402 | 3.15 | 4.69 | 160.18 | 1.12 | 0 | 0 |
| E | order | 500 | 3/3 | 29880.9 | 25268 | 16.72 | 19.66 | 165.77 | 1.18 | 0 | 0 |
| H | health | 10 | 3/3 | 129481.6 | 117874 | 0.07 | 0.15 | 52.20 | 1.10 | 0 | 0 |
| H | health | 100 | 3/3 | 139201.6 | 134520 | 0.75 | 1.23 | 54.19 | 1.03 | 0 | 0 |
| H | health | 500 | 3/3 | 138563.3 | 134520 | 3.66 | 4.31 | 56.78 | 1.03 | 0 | 0 |
| H | echo | 10 | 3/3 | 99906.8 | 92589 | 0.08 | 0.23 | 71.14 | 1.08 | 0 | 0 |
| H | echo | 100 | 3/3 | 103350.4 | 98113 | 0.90 | 1.70 | 72.30 | 1.05 | 0 | 0 |
| H | echo | 500 | 3/3 | 100776.5 | 96201 | 4.82 | 6.04 | 81.48 | 1.05 | 0 | 0 |
| H | me | 10 | 3/3 | 27792.7 | 20698 | 0.32 | 0.88 | 105.44 | 1.34 | 0 | 0 |
| H | me | 100 | 3/3 | 27835.7 | 19655 | 3.53 | 4.70 | 111.24 | 1.42 | 0 | 0 |
| H | me | 500 | 3/3 | 27227.7 | 18316 | 18.34 | 21.14 | 116.71 | 1.49 | 0 | 0 |
| H | user | 10 | 3/3 | 32078.4 | 29304 | 0.30 | 0.77 | 126.69 | 1.09 | 0 | 0 |
| H | user | 100 | 3/3 | 32966.5 | 28878 | 2.98 | 4.05 | 129.81 | 1.14 | 0 | 0 |
| H | user | 500 | 3/3 | 32409.8 | 26281 | 15.40 | 17.82 | 142.47 | 1.23 | 0 | 0 |
| H | list | 10 | 3/3 | 23757.8 | 21618 | 0.41 | 0.93 | 144.21 | 1.10 | 0 | 0 |
| H | list | 100 | 3/3 | 23713.1 | 19749 | 4.20 | 5.73 | 145.06 | 1.20 | 0 | 0 |
| H | list | 500 | 3/3 | 23537.8 | 18345 | 21.25 | 25.67 | 145.84 | 1.28 | 0 | 0 |
| H | order | 10 | 3/3 | 24608.4 | 22647 | 0.39 | 0.91 | 148.69 | 1.09 | 0 | 0 |
| H | order | 100 | 3/3 | 26373.1 | 23424 | 3.72 | 5.36 | 150.68 | 1.13 | 0 | 0 |
| H | order | 500 | 3/3 | 25134.4 | 20843 | 19.98 | 22.84 | 154.09 | 1.20 | 0 | 0 |
| H-mirror | health | 10 | 3/3 | 129425.4 | 117909 | 0.07 | 0.15 | 53.11 | 1.10 | 0 | 0 |
| H-mirror | health | 100 | 3/3 | 139159.2 | 134521 | 0.75 | 1.24 | 54.65 | 1.03 | 0 | 0 |
| H-mirror | health | 500 | 3/3 | 137652.9 | 133719 | 3.69 | 4.32 | 55.07 | 1.03 | 0 | 0 |
| H-mirror | echo | 10 | 3/3 | 114608.0 | 105171 | 0.08 | 0.18 | 60.96 | 1.09 | 0 | 0 |
| H-mirror | echo | 100 | 3/3 | 119575.7 | 114269 | 0.80 | 1.39 | 62.33 | 1.05 | 0 | 0 |
| H-mirror | echo | 500 | 3/3 | 117940.8 | 112964 | 4.21 | 5.12 | 63.79 | 1.04 | 0 | 0 |
| H-mirror | me | 10 | 3/3 | 27701.1 | 20608 | 0.32 | 0.88 | 97.06 | 1.34 | 0 | 0 |
| H-mirror | me | 100 | 3/3 | 27813.5 | 19572 | 3.53 | 4.72 | 101.72 | 1.42 | 0 | 0 |
| H-mirror | me | 500 | 3/3 | 27318.4 | 18393 | 18.30 | 20.48 | 108.09 | 1.50 | 0 | 0 |
| H-mirror | user | 10 | 3/3 | 32994.8 | 30059 | 0.29 | 0.76 | 113.04 | 1.10 | 0 | 0 |
| H-mirror | user | 100 | 3/3 | 33964.1 | 29621 | 2.88 | 3.95 | 119.98 | 1.15 | 0 | 0 |
| H-mirror | user | 500 | 3/3 | 33589.2 | 27311 | 14.88 | 17.11 | 129.04 | 1.24 | 0 | 0 |
| H-mirror | list | 10 | 3/3 | 24542.5 | 22230 | 0.40 | 0.89 | 132.92 | 1.10 | 0 | 0 |
| H-mirror | list | 100 | 3/3 | 24544.5 | 20376 | 4.06 | 5.58 | 133.50 | 1.21 | 0 | 0 |
| H-mirror | list | 500 | 3/3 | 24271.1 | 18753 | 20.58 | 25.00 | 140.66 | 1.30 | 0 | 0 |
| H-mirror | order | 10 | 3/3 | 28508.0 | 25911 | 0.33 | 0.79 | 143.36 | 1.10 | 0 | 0 |
| H-mirror | order | 100 | 3/3 | 30907.2 | 26958 | 3.16 | 4.61 | 145.40 | 1.15 | 0 | 0 |
| H-mirror | order | 500 | 3/3 | 30071.9 | 24680 | 16.60 | 19.20 | 146.50 | 1.22 | 0 | 0 |

### CPU / crypto route (separate diagnostic)

Different crypto bindings prevent framework-only attribution.

| Config | Case | c | Valid / recorded | Success req/s | Success req per tree CPU-second | p50 ms | p99 ms | Mean tree RSS MiB | Tree CPU cores | Non-2xx incl. others | Transport errors (overlap) |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| E | cpu | 10 | 3/3 | 236.6 | 202 | 38.17 | 79.99 | 166.82 | 1.17 | 0 | 0 |
| E | cpu | 100 | 3/3 | 234.9 | 200 | 422.20 | 452.27 | 166.88 | 1.18 | 0 | 0 |
| E | cpu | 500 | 3/3 | 234.3 | 199 | 2129.84 | 2191.36 | 166.88 | 1.18 | 0 | 0 |
| H | cpu | 10 | 3/3 | 231.3 | 196 | 39.19 | 81.17 | 155.49 | 1.18 | 0 | 0 |
| H | cpu | 100 | 3/3 | 232.9 | 197 | 425.09 | 451.75 | 155.52 | 1.18 | 0 | 0 |
| H | cpu | 500 | 3/3 | 232.3 | 196 | 2150.03 | 2250.00 | 155.56 | 1.19 | 0 | 0 |
| H-mirror | cpu | 10 | 3/3 | 230.8 | 193 | 39.25 | 81.50 | 146.97 | 1.19 | 0 | 0 |
| H-mirror | cpu | 100 | 3/3 | 230.0 | 192 | 430.28 | 454.60 | 147.02 | 1.20 | 0 | 0 |
| H-mirror | cpu | 500 | 3/3 | 231.5 | 193 | 2153.94 | 2220.32 | 147.01 | 1.20 | 0 | 0 |

Quick preflight: 21/21 valid; excluded from measured summary.

Recorded host 1-minute load average: min 2.62, median 4.91, max 13.11. Advisory only; no automatic contention/significance inference.

### Limitations / recorded protocol

- Quick runs test plumbing only. Full benchmark automatically requires parity plus a recorded quick preflight before full windows.
- Successful RPS = req2xx / bombardier result.timeTakenSeconds; wallSeconds also includes client startup/exit.
- Latency includes timed attempts, including failures, not a success-only distribution. 2xx is the generator's status granularity; exact status/semantics checked by parity.
- Non-2xx includes others; transport errors overlap status buckets and must not be added to them. errorRate and transportErrorRate are separate rates over total status buckets.
- Process-tree RSS sums supervisor and workers and may double-count shared pages; CPU is coarse ps CPU-time deltas over the recorded sample span.
- Process churn or unavailable samples invalidate resource measurements. Very short-lived children between samples cannot be accounted for.
- Foreign CPU is sampled once a second during every measured window and must average below 200% (100% = one core); the harness also waits for that before each window. Host load averages remain advisory context only.
- API, client and database share a laptop; no CPU affinity, cross-language causal attribution, or cloud cost extrapolation.
- CPU route uses different crypto bindings and must be reported separately from API/DB conclusions.
- Postgres runs CHECKPOINT before every warmup and measured window, so checkpoints left over from earlier windows cannot land in this one; a checkpoint the window's own writes force is kept and counted under pgCheckpoints.
- No failed window is retried or removed. A window measured while foreign CPU (every process outside the server tree, this harness, bombardier and the fixture's Postgres backends) averaged at or above the contention gate is re-measured after the machine is quiet again; the contended attempt stays in the record under contendedAttempts and never enters a summary. Warmup is retained but excluded from summaries.
- Repeats are outermost; configuration order rotates by one each round. Each configuration gets a fresh process each round.

Raw generator JSON, stdout/stderr, exit status and resource samples remain in the source JSON. A passing run does not establish causal framework speed, cost savings, or statistical significance.

<details><summary>Recorded environment</summary>

```json
{
  "date": "2026-09-27T06:28:49.913Z",
  "bun": "1.4.2",
  "bunRevision": "744846f844374847c902b5e7fd59b4342a51ef99",
  "cpu": "Apple M4 Pro",
  "cores": "14",
  "macos": "27.0",
  "postgres": "psql (PostgreSQL) 17.10 (Homebrew)",
  "bombardier": "",
  "python": "Python 3.14.6",
  "bombardierSha256": "da01d10a3dc5410d4cc041feee863583a03c9fa439f9f884e7fa12f9b4db78ff",
  "somaxconn": "4096",
  "ordersAutovacuum": "off",
  "contentionGatePct": 200,
  "honoManifest": {
    "name": "hono-api",
    "private": true,
    "type": "module",
    "scripts": {
      "dev": "bun --watch src/index.ts",
      "build": "bun build.ts",
      "start": "NODE_ENV=production bun dist/index.js",
      "typecheck": "tsc --noEmit"
    },
    "dependencies": {
      "hono": "4.13.8",
      "typebox": "1.3.26",
      "exact-mirror": "1.2.4"
    },
    "devDependencies": {
      "@types/bun": "^1.3.14",
      "typescript": "^5.9.0"
    },
    "_comment": "drizzle-orm, postgres and jose are deliberately absent: db.ts, auth.ts and cpu.ts are imported from apps/elysia-api so both configurations share one driver instance and one JWT implementation. typebox is pinned to 1.3.26, the exact version Elysia 2.0.0-beta.12 resolves, and validation is compiled — the 2026-09-27 run used interpreted @sinclair/typebox 0.34 and was confounded on every validated route (results/friction-log.md)."
  },
  "pythonPackages": "annotated-types==0.8.0\nanyio==4.15.1\nasgiref==3.12.1\nclick==8.5.0\ndjango==6.1.1\ndjango-ninja==1.7.0\ngunicorn==26.2.0\nh11==0.16.0\nhttptools==0.8.0\nidna==3.19\norjson==3.12.0\npsycopg==3.3.5\npsycopg-binary==3.3.5\npsycopg-pool==3.3.1\npydantic==2.13.5\npydantic-core==2.46.5\npyjwt==2.14.0\npython-dotenv==1.2.3\npyyaml==6.0.3\nsqlparse==0.6.0\ntyping-extensions==4.16.0\ntyping-inspection==0.4.4\nuvicorn==0.53.0\nuvloop==0.22.1\nwatchfiles==1.2.0\nwebsockets==17.1",
  "elysiaManifest": {
    "name": "elysia-api",
    "private": true,
    "type": "module",
    "scripts": {
      "dev": "bun --watch src/index.ts",
      "build": "bun build.ts",
      "build:aot": "bun build-aot.ts",
      "start": "NODE_ENV=production bun dist/index.js",
      "typecheck": "tsc --noEmit"
    },
    "dependencies": {
      "elysia": "2.0.0-beta.12",
      "drizzle-orm": "^0.45.2",
      "postgres": "^3.4.9",
      "jose": "^6.2.11"
    },
    "devDependencies": {
      "@types/bun": "^1.3.14",
      "typescript": "^5.9.0"
    }
  },
  "locks": {
    "bun.lock": "2c1fc796f16c7db1e32633eae212d875f048625786beb6142135fc5ea4f788cd",
    "apps/elysia-api/bun.lock": "64898b89e79f0991058533eca815d7c5006714db571f24485c9630af917bdbc6",
    "apps/hono-api/bun.lock": "b5e75ab0d53e9b81423f48c6da0a8f8085d39de300026fff554e1448515ecca9",
    "apps/django-api/uv.lock": "a6db2b7a79cd3e1911cd567f65b1028e7327e06a759342968f8f9f3e909f309b"
  },
  "configs": [
    {
      "id": "E",
      "label": "Elysia / Bun / Drizzle + Bun SQL",
      "cmd": [
        "bun",
        "apps/elysia-api/dist/index.js"
      ],
      "env": {
        "NODE_ENV": "production",
        "PORT": "3100",
        "DATABASE_URL": "postgres://postgres@localhost:5432/bench_elysia_django",
        "PYTHONPATH": "apps/django-api",
        "DJANGO_SETTINGS_MODULE": "config.settings",
        "PYTHONHASHSEED": "0"
      }
    },
    {
      "id": "H",
      "label": "Hono / Bun / Drizzle + Bun SQL",
      "cmd": [
        "bun",
        "apps/hono-api/dist/index.js"
      ],
      "env": {
        "NODE_ENV": "production",
        "PORT": "3100",
        "DATABASE_URL": "postgres://postgres@localhost:5432/bench_elysia_django",
        "PYTHONPATH": "apps/django-api",
        "DJANGO_SETTINGS_MODULE": "config.settings",
        "PYTHONHASHSEED": "0"
      }
    },
    {
      "id": "H-mirror",
      "label": "Hono / Bun / Drizzle + Bun SQL / exact-mirror cleaner",
      "cmd": [
        "bun",
        "apps/hono-api/dist/index.js"
      ],
      "env": {
        "NODE_ENV": "production",
        "PORT": "3100",
        "DATABASE_URL": "postgres://postgres@localhost:5432/bench_elysia_django",
        "PYTHONPATH": "apps/django-api",
        "DJANGO_SETTINGS_MODULE": "config.settings",
        "PYTHONHASHSEED": "0",
        "HONO_CLEANER": "mirror"
      }
    }
  ],
  "caveat": "Same-host macOS laptop, API + Postgres + load generator; no CPU affinity or causal framework-only attribution"
}
```

</details>

---

## noise — results/noise-hono3-2026-09-27.json

Status: **passed**. Mode: **full-duration settings**. Started: 2026-09-27T06:13:06.610Z.

Configured repeats: 5. Recorded iterations/windows: 10.

- **H**: Hono / Bun / Drizzle + Bun SQL

Parity evidence: passed in this invocation.

Warmup 5s; measured duration 30s; concurrency 100.

Numbers are medians of valid recorded windows, not pooled latency percentiles. Invalid/missing windows are explicitly excluded, not repaired; incomplete groups are not comparable.

### API / database routes

| Config | Case | c | Valid / recorded | Success req/s | Success req per tree CPU-second | p50 ms | p99 ms | Mean tree RSS MiB | Tree CPU cores | Non-2xx incl. others | Transport errors (overlap) |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| H | health | 100 | 5/5 | 140277.5 | 135427 | 0.74 | 1.24 | 51.75 | 1.04 | 0 | 0 |
| H | user | 100 | 5/5 | 32277.7 | 28142 | 3.06 | 4.09 | 104.08 | 1.15 | 0 | 0 |

### Observed same-config variability

Population CV and (max−min)/min describe these samples only; neither is a significance threshold.

- H/health/c=100: n=5, population CV=0.0017, observed range/min=0.41%.
- H/user/c=100: n=5, population CV=0.0047, observed range/min=1.32%.

Recorded host 1-minute load average: min 3.56, median 6.02, max 11.51. Advisory only; no automatic contention/significance inference.

### Limitations / recorded protocol

- Quick runs test plumbing only. Full benchmark automatically requires parity plus a recorded quick preflight before full windows.
- Successful RPS = req2xx / bombardier result.timeTakenSeconds; wallSeconds also includes client startup/exit.
- Latency includes timed attempts, including failures, not a success-only distribution. 2xx is the generator's status granularity; exact status/semantics checked by parity.
- Non-2xx includes others; transport errors overlap status buckets and must not be added to them. errorRate and transportErrorRate are separate rates over total status buckets.
- Process-tree RSS sums supervisor and workers and may double-count shared pages; CPU is coarse ps CPU-time deltas over the recorded sample span.
- Process churn or unavailable samples invalidate resource measurements. Very short-lived children between samples cannot be accounted for.
- Foreign CPU is sampled once a second during every measured window and must average below 200% (100% = one core); the harness also waits for that before each window. Host load averages remain advisory context only.
- API, client and database share a laptop; no CPU affinity, cross-language causal attribution, or cloud cost extrapolation.
- CPU route uses different crypto bindings and must be reported separately from API/DB conclusions.
- Postgres runs CHECKPOINT before every warmup and measured window, so checkpoints left over from earlier windows cannot land in this one; a checkpoint the window's own writes force is kept and counted under pgCheckpoints.
- No failed window is retried or removed. A window measured while foreign CPU (every process outside the server tree, this harness, bombardier and the fixture's Postgres backends) averaged at or above the contention gate is re-measured after the machine is quiet again; the contended attempt stays in the record under contendedAttempts and never enters a summary. Warmup is retained but excluded from summaries.
- Five same-config process-start repetitions describe observed variability, not a universal noise floor or significance threshold.

Raw generator JSON, stdout/stderr, exit status and resource samples remain in the source JSON. A passing run does not establish causal framework speed, cost savings, or statistical significance.

<details><summary>Recorded environment</summary>

```json
{
  "date": "2026-09-27T06:13:06.610Z",
  "bun": "1.4.2",
  "bunRevision": "744846f844374847c902b5e7fd59b4342a51ef99",
  "cpu": "Apple M4 Pro",
  "cores": "14",
  "macos": "27.0",
  "postgres": "psql (PostgreSQL) 17.10 (Homebrew)",
  "bombardier": "",
  "python": "Python 3.14.6",
  "bombardierSha256": "da01d10a3dc5410d4cc041feee863583a03c9fa439f9f884e7fa12f9b4db78ff",
  "somaxconn": "4096",
  "ordersAutovacuum": "default (on)",
  "contentionGatePct": 200,
  "honoManifest": {
    "name": "hono-api",
    "private": true,
    "type": "module",
    "scripts": {
      "dev": "bun --watch src/index.ts",
      "build": "bun build.ts",
      "start": "NODE_ENV=production bun dist/index.js",
      "typecheck": "tsc --noEmit"
    },
    "dependencies": {
      "hono": "4.13.8",
      "typebox": "1.3.26",
      "exact-mirror": "1.2.4"
    },
    "devDependencies": {
      "@types/bun": "^1.3.14",
      "typescript": "^5.9.0"
    },
    "_comment": "drizzle-orm, postgres and jose are deliberately absent: db.ts, auth.ts and cpu.ts are imported from apps/elysia-api so both configurations share one driver instance and one JWT implementation. typebox is pinned to 1.3.26, the exact version Elysia 2.0.0-beta.12 resolves, and validation is compiled — the 2026-09-27 run used interpreted @sinclair/typebox 0.34 and was confounded on every validated route (results/friction-log.md)."
  },
  "pythonPackages": "annotated-types==0.8.0\nanyio==4.15.1\nasgiref==3.12.1\nclick==8.5.0\ndjango==6.1.1\ndjango-ninja==1.7.0\ngunicorn==26.2.0\nh11==0.16.0\nhttptools==0.8.0\nidna==3.19\norjson==3.12.0\npsycopg==3.3.5\npsycopg-binary==3.3.5\npsycopg-pool==3.3.1\npydantic==2.13.5\npydantic-core==2.46.5\npyjwt==2.14.0\npython-dotenv==1.2.3\npyyaml==6.0.3\nsqlparse==0.6.0\ntyping-extensions==4.16.0\ntyping-inspection==0.4.4\nuvicorn==0.53.0\nuvloop==0.22.1\nwatchfiles==1.2.0\nwebsockets==17.1",
  "elysiaManifest": {
    "name": "elysia-api",
    "private": true,
    "type": "module",
    "scripts": {
      "dev": "bun --watch src/index.ts",
      "build": "bun build.ts",
      "build:aot": "bun build-aot.ts",
      "start": "NODE_ENV=production bun dist/index.js",
      "typecheck": "tsc --noEmit"
    },
    "dependencies": {
      "elysia": "2.0.0-beta.12",
      "drizzle-orm": "^0.45.2",
      "postgres": "^3.4.9",
      "jose": "^6.2.11"
    },
    "devDependencies": {
      "@types/bun": "^1.3.14",
      "typescript": "^5.9.0"
    }
  },
  "locks": {
    "bun.lock": "2c1fc796f16c7db1e32633eae212d875f048625786beb6142135fc5ea4f788cd",
    "apps/elysia-api/bun.lock": "64898b89e79f0991058533eca815d7c5006714db571f24485c9630af917bdbc6",
    "apps/hono-api/bun.lock": "b5e75ab0d53e9b81423f48c6da0a8f8085d39de300026fff554e1448515ecca9",
    "apps/django-api/uv.lock": "a6db2b7a79cd3e1911cd567f65b1028e7327e06a759342968f8f9f3e909f309b"
  },
  "configs": [
    {
      "id": "H",
      "label": "Hono / Bun / Drizzle + Bun SQL",
      "cmd": [
        "bun",
        "apps/hono-api/dist/index.js"
      ],
      "env": {
        "NODE_ENV": "production",
        "PORT": "3100",
        "DATABASE_URL": "postgres://postgres@localhost:5432/bench_elysia_django",
        "PYTHONPATH": "apps/django-api",
        "DJANGO_SETTINGS_MODULE": "config.settings",
        "PYTHONHASHSEED": "0"
      }
    }
  ],
  "caveat": "Same-host macOS laptop, API + Postgres + load generator; no CPU affinity or causal framework-only attribution"
}
```

</details>
