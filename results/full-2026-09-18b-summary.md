# Elysia vs Django — recorded observations

## bench — results/full-2026-09-18b.json

Status: **passed**. Mode: **full-duration settings**. Started: 2026-09-18T16:00:49.907Z.

Configured repeats: 3. Recorded iterations/windows: 189.

- **E**: Elysia / Bun / Drizzle + Bun SQL
- **N-sync**: Django Ninja / Gunicorn gthread / Django ORM
- **N-async**: Django Ninja / Uvicorn uvloop httptools / Django async ORM interface

Parity evidence: passed in this invocation.

Warmup 5s; measured duration 30s; concurrency 10, 100, 500.

Numbers are medians of valid recorded windows, not pooled latency percentiles. Invalid/missing windows are explicitly excluded, not repaired; incomplete groups are not comparable.

### API / database routes

| Config | Case | c | Valid / recorded | Success req/s | Success req per tree CPU-second | p50 ms | p99 ms | Mean tree RSS MiB | Tree CPU cores | Non-2xx incl. others | Transport errors (overlap) |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| E | health | 10 | 3/3 | 127370.4 | 116449 | 0.07 | 0.15 | 64.98 | 1.10 | 0 | 0 |
| E | health | 100 | 3/3 | 138992.4 | 135097 | 0.73 | 1.37 | 65.77 | 1.03 | 0 | 0 |
| E | health | 500 | 3/3 | 137333.0 | 134588 | 3.67 | 4.57 | 65.80 | 1.02 | 0 | 0 |
| E | echo | 10 | 3/3 | 110089.7 | 103432 | 0.08 | 0.18 | 77.24 | 1.07 | 0 | 0 |
| E | echo | 100 | 3/3 | 115798.4 | 113399 | 0.87 | 1.48 | 77.83 | 1.02 | 0 | 0 |
| E | echo | 500 | 3/3 | 113836.2 | 112357 | 4.42 | 5.31 | 77.88 | 1.02 | 0 | 0 |
| E | me | 10 | 3/3 | 25205.6 | 19076 | 0.35 | 0.99 | 105.55 | 1.32 | 0 | 0 |
| E | me | 100 | 3/3 | 26013.5 | 18731 | 3.67 | 6.55 | 111.01 | 1.39 | 0 | 0 |
| E | me | 500 | 3/3 | 24964.9 | 17295 | 19.69 | 24.80 | 135.59 | 1.45 | 0 | 0 |
| E | user | 10 | 3/3 | 32187.5 | 29929 | 0.29 | 0.80 | 137.25 | 1.08 | 0 | 0 |
| E | user | 100 | 3/3 | 33431.7 | 29832 | 2.83 | 4.88 | 139.44 | 1.13 | 0 | 0 |
| E | user | 500 | 3/3 | 32398.7 | 27614 | 15.32 | 21.09 | 149.81 | 1.18 | 0 | 0 |
| E | list | 10 | 3/3 | 24200.3 | 22225 | 0.40 | 0.99 | 157.11 | 1.09 | 0 | 0 |
| E | list | 100 | 3/3 | 24523.6 | 20460 | 3.93 | 6.96 | 157.60 | 1.20 | 0 | 0 |
| E | list | 500 | 3/3 | 23700.1 | 18449 | 20.74 | 29.85 | 160.74 | 1.28 | 0 | 0 |
| E | order | 10 | 3/3 | 25120.7 | 24110 | 0.35 | 1.00 | 163.89 | 1.04 | 0 | 0 |
| E | order | 100 | 3/3 | 28507.6 | 25664 | 3.30 | 6.10 | 163.99 | 1.11 | 0 | 0 |
| E | order | 500 | 3/3 | 27561.7 | 23541 | 17.86 | 27.03 | 164.26 | 1.16 | 0 | 0 |
| N-sync | health | 10 | 3/3 | 2647.6 | 2293 | 3.65 | 6.62 | 84.43 | 1.16 | 0 | 0 |
| N-sync | health | 100 | 3/3 | 2706.6 | 2363 | 36.12 | 51.24 | 84.92 | 1.15 | 0 | 0 |
| N-sync | health | 500 | 3/3 | 2703.7 | 2371 | 178.52 | 345.42 | 86.63 | 1.14 | 0 | 0 |
| N-sync | echo | 10 | 3/3 | 2492.4 | 2178 | 3.87 | 7.03 | 87.52 | 1.14 | 0 | 0 |
| N-sync | echo | 100 | 3/3 | 2548.9 | 2239 | 38.27 | 59.18 | 87.52 | 1.14 | 0 | 0 |
| N-sync | echo | 500 | 3/3 | 2544.0 | 2250 | 189.44 | 350.34 | 87.70 | 1.13 | 0 | 0 |
| N-sync | me | 10 | 3/3 | 1591.2 | 1321 | 6.05 | 10.76 | 100.19 | 1.20 | 0 | 0 |
| N-sync | me | 100 | 3/3 | 1611.1 | 1331 | 60.45 | 93.95 | 100.59 | 1.21 | 0 | 0 |
| N-sync | me | 500 | 3/3 | 1608.3 | 1329 | 300.70 | 502.29 | 102.46 | 1.21 | 0 | 0 |
| N-sync | user | 10 | 3/3 | 1684.1 | 1380 | 5.73 | 10.03 | 102.52 | 1.21 | 0 | 0 |
| N-sync | user | 100 | 3/3 | 1707.5 | 1389 | 57.23 | 88.72 | 102.52 | 1.22 | 0 | 0 |
| N-sync | user | 500 | 3/3 | 1697.1 | 1383 | 287.28 | 466.79 | 102.53 | 1.22 | 0 | 0 |
| N-sync | list | 10 | 3/3 | 1624.8 | 1334 | 5.95 | 10.40 | 102.61 | 1.21 | 0 | 0 |
| N-sync | list | 100 | 3/3 | 1644.9 | 1353 | 59.45 | 82.28 | 102.62 | 1.21 | 0 | 0 |
| N-sync | list | 500 | 3/3 | 1640.9 | 1345 | 296.92 | 464.95 | 102.63 | 1.21 | 0 | 0 |
| N-sync | order | 10 | 3/3 | 1737.3 | 1413 | 5.56 | 9.93 | 102.73 | 1.22 | 0 | 0 |
| N-sync | order | 100 | 3/3 | 1751.9 | 1421 | 55.80 | 77.38 | 102.73 | 1.23 | 0 | 0 |
| N-sync | order | 500 | 3/3 | 1739.8 | 1414 | 281.99 | 455.18 | 102.82 | 1.22 | 0 | 0 |
| N-async | health | 10 | 3/3 | 3871.7 | 3261 | 2.50 | 3.39 | 70.70 | 1.19 | 0 | 0 |
| N-async | health | 100 | 3/3 | 3198.7 | 2656 | 30.20 | 54.67 | 94.77 | 1.20 | 0 | 0 |
| N-async | health | 500 | 3/3 | 2312.2 | 1596 | 152.21 | 371.11 | 160.34 | 1.45 | 0 | 0 |
| N-async | echo | 10 | 3/3 | 3588.9 | 3055 | 2.70 | 3.71 | 128.86 | 1.17 | 0 | 0 |
| N-async | echo | 100 | 3/3 | 2996.5 | 2510 | 32.39 | 55.98 | 140.13 | 1.19 | 0 | 0 |
| N-async | echo | 500 | 3/3 | 2223.4 | 1571 | 152.86 | 378.45 | 175.73 | 1.42 | 0 | 0 |
| N-async | me | 10 | 3/3 | 1696.6 | 1410 | 5.82 | 8.93 | 135.76 | 1.20 | 0 | 0 |
| N-async | me | 100 | 3/3 | 1545.5 | 1308 | 62.99 | 96.79 | 142.31 | 1.18 | 0 | 0 |
| N-async | me | 500 | 3/3 | 1362.0 | 1100 | 352.93 | 548.66 | 169.41 | 1.24 | 0 | 0 |
| N-async | user | 10 | 3/3 | 1798.4 | 1480 | 5.49 | 8.38 | 148.16 | 1.21 | 0 | 0 |
| N-async | user | 100 | 3/3 | 1637.5 | 1374 | 59.38 | 94.91 | 152.24 | 1.19 | 0 | 0 |
| N-async | user | 500 | 3/3 | 1431.2 | 1147 | 335.17 | 656.78 | 170.45 | 1.25 | 0 | 0 |
| N-async | list | 10 | 3/3 | 1720.6 | 1423 | 5.73 | 8.86 | 149.10 | 1.21 | 0 | 0 |
| N-async | list | 100 | 3/3 | 1582.1 | 1323 | 61.83 | 95.45 | 153.20 | 1.19 | 0 | 0 |
| N-async | list | 500 | 3/3 | 1380.3 | 1111 | 349.26 | 539.56 | 171.16 | 1.24 | 0 | 0 |
| N-async | order | 10 | 3/3 | 1854.3 | 1515 | 5.32 | 8.53 | 149.21 | 1.22 | 0 | 0 |
| N-async | order | 100 | 3/3 | 1672.0 | 1372 | 58.14 | 88.35 | 153.29 | 1.22 | 0 | 0 |
| N-async | order | 500 | 3/3 | 1458.8 | 1150 | 329.17 | 534.14 | 171.34 | 1.27 | 0 | 0 |

### CPU / crypto route (separate diagnostic)

Different crypto bindings prevent framework-only attribution.

| Config | Case | c | Valid / recorded | Success req/s | Success req per tree CPU-second | p50 ms | p99 ms | Mean tree RSS MiB | Tree CPU cores | Non-2xx incl. others | Transport errors (overlap) |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| E | cpu | 10 | 3/3 | 212.6 | 182 | 42.45 | 89.02 | 164.55 | 1.17 | 0 | 0 |
| E | cpu | 100 | 3/3 | 211.7 | 181 | 465.59 | 586.65 | 164.56 | 1.17 | 0 | 0 |
| E | cpu | 500 | 3/3 | 209.2 | 178 | 2392.99 | 2497.52 | 164.55 | 1.17 | 0 | 0 |
| N-sync | cpu | 10 | 3/3 | 217.0 | 215 | 45.41 | 80.67 | 102.83 | 1.01 | 0 | 0 |
| N-sync | cpu | 100 | 3/3 | 222.1 | 220 | 444.88 | 1009.13 | 102.84 | 1.01 | 0 | 0 |
| N-sync | cpu | 500 | 3/3 | 221.3 | 219 | 1094.86 | 31986.49 | 102.95 | 1.01 | 0 | 0 |
| N-async | cpu | 10 | 3/3 | 222.2 | 221 | 44.31 | 52.68 | 149.77 | 1.01 | 0 | 0 |
| N-async | cpu | 100 | 3/3 | 224.0 | 221 | 439.40 | 1294.18 | 159.64 | 1.01 | 0 | 0 |
| N-async | cpu | 500 | 3/3 | 221.6 | 220 | 541.10 | 31933.32 | 161.56 | 1.01 | 0 | 0 |

Quick preflight: 21/21 valid; excluded from measured summary.

Recorded host 1-minute load average: min 2.82, median 5.51, max 30.45. Advisory only; no automatic contention/significance inference.

### Limitations / recorded protocol

- Quick runs test plumbing only. Full benchmark automatically requires parity plus a recorded quick preflight before full windows.
- Successful RPS = req2xx / bombardier result.timeTakenSeconds; wallSeconds also includes client startup/exit.
- Latency includes timed attempts, including failures, not a success-only distribution. 2xx is the generator's status granularity; exact status/semantics checked by parity.
- Non-2xx includes others; transport errors overlap status buckets and must not be added to them. errorRate and transportErrorRate are separate rates over total status buckets.
- Process-tree RSS sums supervisor and workers and may double-count shared pages; CPU is coarse ps CPU-time deltas over the recorded sample span.
- Process churn or unavailable samples invalidate resource measurements. Very short-lived children between samples cannot be accounted for.
- Foreign CPU is sampled once a second during every measured window and must average below 450% (100% = one core); the harness also waits for that before each window. Host load averages remain advisory context only.
- API, client and database share a laptop; no CPU affinity, cross-language causal attribution, or cloud cost extrapolation.
- CPU route uses different crypto bindings and must be reported separately from API/DB conclusions.
- Postgres runs CHECKPOINT before every warmup and measured window, so checkpoints left over from earlier windows cannot land in this one; a checkpoint the window's own writes force is kept and counted under pgCheckpoints.
- No failed window is retried or removed. A window measured while foreign CPU (every process outside the server tree, this harness, bombardier and the fixture's Postgres backends) averaged at or above the contention gate is re-measured after the machine is quiet again; the contended attempt stays in the record under contendedAttempts and never enters a summary. Warmup is retained but excluded from summaries.
- Repeats are outermost; configuration order rotates by one each round. Each configuration gets a fresh process each round.

Raw generator JSON, stdout/stderr, exit status and resource samples remain in the source JSON. A passing run does not establish causal framework speed, cost savings, or statistical significance.

<details><summary>Recorded environment</summary>

```json
{
  "date": "2026-09-18T16:00:49.907Z",
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
      "id": "N-sync",
      "label": "Django Ninja / Gunicorn gthread / Django ORM",
      "cmd": [
        "apps/django-api/.venv/bin/python",
        "-m",
        "gunicorn",
        "config.wsgi:application",
        "--bind",
        "127.0.0.1:3100",
        "--workers",
        "1",
        "--worker-class",
        "gthread",
        "--threads",
        "10",
        "--keep-alive",
        "5",
        "--timeout",
        "60",
        "--access-logfile",
        "/dev/null",
        "--log-level",
        "warning"
      ],
      "env": {
        "NODE_ENV": "production",
        "PORT": "3100",
        "DATABASE_URL": "postgres://postgres@localhost:5432/bench_elysia_django",
        "PYTHONPATH": "apps/django-api",
        "DJANGO_SETTINGS_MODULE": "config.settings",
        "PYTHONHASHSEED": "0",
        "API_MODE": "sync"
      }
    },
    {
      "id": "N-async",
      "label": "Django Ninja / Uvicorn uvloop httptools / Django async ORM interface",
      "cmd": [
        "apps/django-api/.venv/bin/python",
        "-m",
        "uvicorn",
        "config.asgi:application",
        "--host",
        "127.0.0.1",
        "--port",
        "3100",
        "--workers",
        "1",
        "--loop",
        "uvloop",
        "--http",
        "httptools",
        "--lifespan",
        "off",
        "--no-access-log",
        "--no-server-header",
        "--log-level",
        "warning"
      ],
      "env": {
        "NODE_ENV": "production",
        "PORT": "3100",
        "DATABASE_URL": "postgres://postgres@localhost:5432/bench_elysia_django",
        "PYTHONPATH": "apps/django-api",
        "DJANGO_SETTINGS_MODULE": "config.settings",
        "PYTHONHASHSEED": "0",
        "API_MODE": "async"
      }
    }
  ],
  "caveat": "Same-host macOS laptop, API + Postgres + load generator; no CPU affinity or causal framework-only attribution"
}
```

</details>
