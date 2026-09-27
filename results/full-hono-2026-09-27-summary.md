# Elysia benchmarks — recorded observations (E, H; confounded run, see friction-log)

## bench — results/full-hono-2026-09-27.json

Status: **passed**. Mode: **full-duration settings**. Started: 2026-09-26T19:27:58.378Z.

Configured repeats: 3. Recorded iterations/windows: 126.

- **E**: Elysia / Bun / Drizzle + Bun SQL
- **H**: Hono / Bun / Drizzle + Bun SQL

Parity evidence: passed in this invocation.

Warmup 5s; measured duration 30s; concurrency 10, 100, 500.

Numbers are medians of valid recorded windows, not pooled latency percentiles. Invalid/missing windows are explicitly excluded, not repaired; incomplete groups are not comparable.

### API / database routes

| Config | Case | c | Valid / recorded | Success req/s | Success req per tree CPU-second | p50 ms | p99 ms | Mean tree RSS MiB | Tree CPU cores | Non-2xx incl. others | Transport errors (overlap) |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| E | health | 10 | 3/3 | 132276.6 | 120529 | 0.07 | 0.14 | 61.89 | 1.10 | 0 | 0 |
| E | health | 100 | 3/3 | 143512.2 | 138988 | 0.72 | 1.23 | 64.12 | 1.03 | 0 | 0 |
| E | health | 500 | 3/3 | 143103.1 | 139140 | 3.48 | 4.39 | 64.23 | 1.03 | 0 | 0 |
| E | echo | 10 | 3/3 | 123484.6 | 114566 | 0.07 | 0.17 | 76.69 | 1.08 | 0 | 0 |
| E | echo | 100 | 3/3 | 129020.4 | 125318 | 0.72 | 1.34 | 77.97 | 1.03 | 0 | 0 |
| E | echo | 500 | 3/3 | 127674.2 | 124175 | 3.80 | 4.82 | 78.13 | 1.03 | 0 | 0 |
| E | me | 10 | 3/3 | 28427.1 | 21259 | 0.32 | 0.88 | 105.60 | 1.34 | 0 | 0 |
| E | me | 100 | 3/3 | 28391.5 | 20314 | 3.43 | 4.75 | 110.60 | 1.40 | 0 | 0 |
| E | me | 500 | 3/3 | 27675.8 | 19106 | 18.05 | 20.59 | 118.83 | 1.44 | 0 | 0 |
| E | user | 10 | 3/3 | 36231.1 | 33338 | 0.26 | 0.69 | 121.33 | 1.09 | 0 | 0 |
| E | user | 100 | 3/3 | 36168.3 | 32178 | 2.69 | 3.79 | 125.21 | 1.12 | 0 | 0 |
| E | user | 500 | 3/3 | 35725.1 | 30010 | 14.01 | 16.18 | 133.72 | 1.19 | 0 | 0 |
| E | list | 10 | 3/3 | 26340.2 | 24066 | 0.38 | 0.87 | 141.43 | 1.09 | 0 | 0 |
| E | list | 100 | 3/3 | 25936.1 | 21705 | 3.81 | 5.40 | 150.81 | 1.19 | 0 | 0 |
| E | list | 500 | 3/3 | 25916.2 | 20138 | 19.29 | 23.35 | 153.25 | 1.29 | 0 | 0 |
| E | order | 10 | 3/3 | 28704.5 | 26488 | 0.33 | 0.77 | 158.02 | 1.08 | 0 | 0 |
| E | order | 100 | 3/3 | 30843.6 | 27548 | 3.12 | 4.79 | 158.52 | 1.12 | 0 | 0 |
| E | order | 500 | 3/3 | 30162.8 | 25341 | 16.56 | 19.44 | 159.17 | 1.19 | 0 | 0 |
| H | health | 10 | 3/3 | 130108.2 | 118784 | 0.07 | 0.15 | 47.61 | 1.10 | 0 | 0 |
| H | health | 100 | 3/3 | 140244.4 | 136217 | 0.74 | 1.22 | 49.07 | 1.03 | 0 | 0 |
| H | health | 500 | 3/3 | 139610.6 | 136141 | 3.60 | 4.21 | 49.45 | 1.03 | 0 | 0 |
| H | echo | 10 | 3/3 | 114093.6 | 105530 | 0.07 | 0.19 | 72.09 | 1.08 | 0 | 0 |
| H | echo | 100 | 3/3 | 119222.7 | 114578 | 0.78 | 1.48 | 72.71 | 1.04 | 0 | 0 |
| H | echo | 500 | 3/3 | 116966.0 | 112594 | 4.13 | 5.28 | 74.52 | 1.04 | 0 | 0 |
| H | me | 10 | 3/3 | 28162.7 | 20946 | 0.32 | 0.86 | 95.80 | 1.34 | 0 | 0 |
| H | me | 100 | 3/3 | 28101.0 | 19758 | 3.51 | 4.62 | 100.16 | 1.42 | 0 | 0 |
| H | me | 500 | 3/3 | 27655.4 | 18483 | 18.07 | 20.33 | 116.31 | 1.50 | 0 | 0 |
| H | user | 10 | 3/3 | 34637.3 | 31496 | 0.27 | 0.72 | 118.12 | 1.10 | 0 | 0 |
| H | user | 100 | 3/3 | 34919.8 | 30480 | 2.82 | 3.77 | 132.23 | 1.15 | 0 | 0 |
| H | user | 500 | 3/3 | 34645.7 | 28173 | 14.41 | 16.78 | 139.20 | 1.23 | 0 | 0 |
| H | list | 10 | 3/3 | 25865.4 | 23287 | 0.38 | 0.84 | 140.70 | 1.11 | 0 | 0 |
| H | list | 100 | 3/3 | 25528.0 | 20994 | 3.91 | 5.37 | 140.74 | 1.22 | 0 | 0 |
| H | list | 500 | 3/3 | 25533.2 | 19498 | 19.58 | 24.21 | 140.86 | 1.31 | 0 | 0 |
| H | order | 10 | 3/3 | 28560.7 | 25909 | 0.33 | 0.75 | 141.78 | 1.10 | 0 | 0 |
| H | order | 100 | 3/3 | 30628.4 | 26632 | 3.21 | 4.64 | 141.94 | 1.15 | 0 | 0 |
| H | order | 500 | 3/3 | 29849.3 | 24582 | 16.73 | 19.27 | 144.49 | 1.21 | 0 | 0 |

### CPU / crypto route (separate diagnostic)

Different crypto bindings prevent framework-only attribution.

| Config | Case | c | Valid / recorded | Success req/s | Success req per tree CPU-second | p50 ms | p99 ms | Mean tree RSS MiB | Tree CPU cores | Non-2xx incl. others | Transport errors (overlap) |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| E | cpu | 10 | 3/3 | 240.7 | 206 | 37.59 | 77.87 | 159.53 | 1.17 | 0 | 0 |
| E | cpu | 100 | 3/3 | 241.0 | 205 | 411.69 | 428.31 | 159.49 | 1.17 | 0 | 0 |
| E | cpu | 500 | 3/3 | 239.0 | 203 | 2093.23 | 2125.13 | 159.52 | 1.17 | 0 | 0 |
| H | cpu | 10 | 3/3 | 234.9 | 197 | 38.59 | 79.74 | 144.92 | 1.19 | 0 | 0 |
| H | cpu | 100 | 3/3 | 237.8 | 198 | 417.71 | 434.69 | 144.92 | 1.20 | 0 | 0 |
| H | cpu | 500 | 3/3 | 238.9 | 199 | 2090.78 | 2116.12 | 144.92 | 1.20 | 0 | 0 |

Quick preflight: 14/14 valid; excluded from measured summary.

Recorded host 1-minute load average: min 2.29, median 4.71, max 7.70. Advisory only; no automatic contention/significance inference.

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
  "date": "2026-09-26T19:27:58.378Z",
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
      "@hono/typebox-validator": "1.1.0",
      "@sinclair/typebox": "^0.34.33"
    },
    "devDependencies": {
      "@types/bun": "^1.3.14",
      "typescript": "^5.9.0"
    },
    "_comment": "drizzle-orm, postgres and jose are deliberately absent: db.ts, auth.ts and cpu.ts are imported from apps/elysia-api so both configurations share one driver instance and one JWT implementation, not merely matching versions."
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
    "apps/hono-api/bun.lock": "d62bfdd4f2e687c53d54a4567756779eee53a14e833ac25e1f2f0cfb8e03338c",
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
    }
  ],
  "caveat": "Same-host macOS laptop, API + Postgres + load generator; no CPU affinity or causal framework-only attribution"
}
```

</details>

---

## noise — results/noise-hono-2026-09-27.json

Status: **passed**. Mode: **full-duration settings**. Started: 2026-09-26T19:21:02.477Z.

Configured repeats: 5. Recorded iterations/windows: 10.

- **H**: Hono / Bun / Drizzle + Bun SQL

Parity evidence: passed in this invocation.

Warmup 5s; measured duration 30s; concurrency 100.

Numbers are medians of valid recorded windows, not pooled latency percentiles. Invalid/missing windows are explicitly excluded, not repaired; incomplete groups are not comparable.

### API / database routes

| Config | Case | c | Valid / recorded | Success req/s | Success req per tree CPU-second | p50 ms | p99 ms | Mean tree RSS MiB | Tree CPU cores | Non-2xx incl. others | Transport errors (overlap) |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| H | health | 100 | 5/5 | 140215.2 | 135981 | 0.74 | 1.23 | 47.31 | 1.03 | 0 | 0 |
| H | user | 100 | 5/5 | 35016.6 | 30189 | 2.83 | 3.74 | 94.12 | 1.16 | 0 | 0 |

### Observed same-config variability

Population CV and (max−min)/min describe these samples only; neither is a significance threshold.

- H/health/c=100: n=5, population CV=0.0034, observed range/min=0.97%.
- H/user/c=100: n=5, population CV=0.0134, observed range/min=3.88%.

Recorded host 1-minute load average: min 3.22, median 4.97, max 7.49. Advisory only; no automatic contention/significance inference.

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
  "date": "2026-09-26T19:21:02.477Z",
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
      "@hono/typebox-validator": "1.1.0",
      "@sinclair/typebox": "^0.34.33"
    },
    "devDependencies": {
      "@types/bun": "^1.3.14",
      "typescript": "^5.9.0"
    },
    "_comment": "drizzle-orm, postgres and jose are deliberately absent: db.ts, auth.ts and cpu.ts are imported from apps/elysia-api so both configurations share one driver instance and one JWT implementation, not merely matching versions."
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
    "apps/hono-api/bun.lock": "d62bfdd4f2e687c53d54a4567756779eee53a14e833ac25e1f2f0cfb8e03338c",
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
