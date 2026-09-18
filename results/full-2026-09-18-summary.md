# Elysia vs Django — recorded observations

## bench — results/full-2026-09-18.json

Status: **passed**. Mode: **full-duration settings**. Started: 2026-09-18T04:29:51.157Z.

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
| E | health | 10 | 3/3 | 119312.1 | 109271 | 0.07 | 0.18 | 58.41 | 1.08 | 0 | 0 |
| E | health | 100 | 3/3 | 128296.9 | 127541 | 0.75 | 1.54 | 54.11 | 1.01 | 0 | 0 |
| E | health | 500 | 3/3 | 126413.3 | 125891 | 3.85 | 5.39 | 46.45 | 1.00 | 0 | 0 |
| E | echo | 10 | 3/3 | 101708.7 | 95568 | 0.08 | 0.21 | 64.79 | 1.06 | 0 | 0 |
| E | echo | 100 | 3/3 | 101574.4 | 102732 | 0.91 | 2.04 | 56.05 | 0.99 | 0 | 0 |
| E | echo | 500 | 3/3 | 99609.7 | 99249 | 4.82 | 7.39 | 57.60 | 1.00 | 0 | 0 |
| E | me | 10 | 3/3 | 23455.6 | 17834 | 0.37 | 1.17 | 92.83 | 1.32 | 0 | 0 |
| E | me | 100 | 3/3 | 23626.9 | 17470 | 3.86 | 8.85 | 89.96 | 1.36 | 0 | 0 |
| E | me | 500 | 3/3 | 23110.6 | 15981 | 21.15 | 34.70 | 105.77 | 1.44 | 0 | 0 |
| E | user | 10 | 3/3 | 29321.3 | 27507 | 0.31 | 0.99 | 92.05 | 1.07 | 0 | 0 |
| E | user | 100 | 3/3 | 31098.0 | 28177 | 2.98 | 5.89 | 97.37 | 1.10 | 0 | 0 |
| E | user | 500 | 3/3 | 29638.7 | 25447 | 16.65 | 23.96 | 112.34 | 1.17 | 0 | 0 |
| E | list | 10 | 3/3 | 22259.3 | 20552 | 0.42 | 1.20 | 113.69 | 1.08 | 0 | 0 |
| E | list | 100 | 3/3 | 22592.3 | 19146 | 4.18 | 8.31 | 113.05 | 1.19 | 0 | 0 |
| E | list | 500 | 3/3 | 21778.3 | 17071 | 22.50 | 35.95 | 114.21 | 1.27 | 0 | 0 |
| E | order | 10 | 3/3 | 23196.3 | 22648 | 0.37 | 1.29 | 121.85 | 1.02 | 0 | 0 |
| E | order | 100 | 3/3 | 25976.4 | 24345 | 3.47 | 9.30 | 115.27 | 1.07 | 0 | 0 |
| E | order | 500 | 3/3 | 18136.2 | 20362 | 20.24 | 69.75 | 119.47 | 0.89 | 0 | 0 |
| N-sync | health | 10 | 3/3 | 2382.9 | 2104 | 3.99 | 8.33 | 84.40 | 1.13 | 0 | 0 |
| N-sync | health | 100 | 3/3 | 2374.9 | 2124 | 40.11 | 73.71 | 84.86 | 1.13 | 0 | 0 |
| N-sync | health | 500 | 3/3 | 2411.9 | 2157 | 195.94 | 345.32 | 50.81 | 1.12 | 0 | 0 |
| N-sync | echo | 10 | 3/3 | 2158.6 | 1953 | 4.34 | 10.05 | 53.73 | 1.11 | 0 | 0 |
| N-sync | echo | 100 | 3/3 | 2254.1 | 2033 | 42.25 | 76.77 | 50.00 | 1.12 | 0 | 0 |
| N-sync | echo | 500 | 3/3 | 2254.6 | 2038 | 209.80 | 378.32 | 48.99 | 1.10 | 0 | 0 |
| N-sync | me | 10 | 3/3 | 1324.3 | 1139 | 7.07 | 15.57 | 78.79 | 1.16 | 0 | 0 |
| N-sync | me | 100 | 3/3 | 1358.1 | 1145 | 70.74 | 141.75 | 68.66 | 1.18 | 0 | 0 |
| N-sync | me | 500 | 3/3 | 1348.8 | 1139 | 355.69 | 591.59 | 68.27 | 1.17 | 0 | 0 |
| N-sync | user | 10 | 3/3 | 1438.8 | 1221 | 6.54 | 14.15 | 69.37 | 1.18 | 0 | 0 |
| N-sync | user | 100 | 3/3 | 1454.6 | 1221 | 65.55 | 124.23 | 76.62 | 1.19 | 0 | 0 |
| N-sync | user | 500 | 3/3 | 1437.7 | 1201 | 327.90 | 541.39 | 75.35 | 1.19 | 0 | 0 |
| N-sync | list | 10 | 3/3 | 1313.6 | 1140 | 7.05 | 16.11 | 70.70 | 1.15 | 0 | 0 |
| N-sync | list | 100 | 3/3 | 1345.7 | 1154 | 71.47 | 117.62 | 68.69 | 1.18 | 0 | 0 |
| N-sync | list | 500 | 3/3 | 1372.5 | 1174 | 352.90 | 684.56 | 76.46 | 1.18 | 0 | 0 |
| N-sync | order | 10 | 3/3 | 1450.7 | 1215 | 6.56 | 14.86 | 60.26 | 1.18 | 0 | 0 |
| N-sync | order | 100 | 3/3 | 1454.5 | 1235 | 65.21 | 121.83 | 74.97 | 1.19 | 0 | 0 |
| N-sync | order | 500 | 3/3 | 1456.0 | 1237 | 318.24 | 735.25 | 75.93 | 1.18 | 0 | 0 |
| N-async | health | 10 | 3/3 | 3411.5 | 2931 | 2.75 | 6.04 | 70.63 | 1.17 | 0 | 0 |
| N-async | health | 100 | 3/3 | 2651.5 | 2263 | 35.66 | 75.77 | 92.13 | 1.17 | 0 | 0 |
| N-async | health | 500 | 3/3 | 2074.9 | 1570 | 155.86 | 485.88 | 151.61 | 1.32 | 0 | 0 |
| N-async | echo | 10 | 3/3 | 3159.7 | 2714 | 3.01 | 7.21 | 120.84 | 1.15 | 0 | 0 |
| N-async | echo | 100 | 3/3 | 2567.2 | 2207 | 37.93 | 72.28 | 130.45 | 1.16 | 0 | 0 |
| N-async | echo | 500 | 3/3 | 2014.3 | 1546 | 160.38 | 409.75 | 161.46 | 1.31 | 0 | 0 |
| N-async | me | 10 | 3/3 | 1442.4 | 1242 | 6.63 | 14.99 | 127.50 | 1.17 | 0 | 0 |
| N-async | me | 100 | 3/3 | 1322.9 | 1129 | 71.75 | 140.48 | 129.37 | 1.17 | 0 | 0 |
| N-async | me | 500 | 3/3 | 1125.7 | 936 | 425.06 | 807.86 | 154.02 | 1.20 | 0 | 0 |
| N-async | user | 10 | 3/3 | 1483.6 | 1250 | 6.47 | 13.54 | 126.39 | 1.18 | 0 | 0 |
| N-async | user | 100 | 3/3 | 1388.0 | 1170 | 69.08 | 121.13 | 130.33 | 1.18 | 0 | 0 |
| N-async | user | 500 | 3/3 | 1181.4 | 974 | 403.56 | 742.67 | 154.03 | 1.21 | 0 | 0 |
| N-async | list | 10 | 3/3 | 1459.8 | 1232 | 6.62 | 13.98 | 130.18 | 1.17 | 0 | 0 |
| N-async | list | 100 | 3/3 | 1351.6 | 1142 | 71.46 | 137.70 | 133.90 | 1.18 | 0 | 0 |
| N-async | list | 500 | 3/3 | 1124.6 | 942 | 418.81 | 772.38 | 151.85 | 1.20 | 0 | 0 |
| N-async | order | 10 | 3/3 | 1524.7 | 1291 | 6.19 | 14.88 | 121.63 | 1.18 | 0 | 0 |
| N-async | order | 100 | 3/3 | 1396.1 | 1180 | 68.04 | 133.13 | 122.73 | 1.18 | 0 | 0 |
| N-async | order | 500 | 3/3 | 1134.5 | 922 | 430.05 | 722.53 | 142.34 | 1.23 | 0 | 0 |

### CPU / crypto route (separate diagnostic)

Different crypto bindings prevent framework-only attribution.

| Config | Case | c | Valid / recorded | Success req/s | Success req per tree CPU-second | p50 ms | p99 ms | Mean tree RSS MiB | Tree CPU cores | Non-2xx incl. others | Transport errors (overlap) |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| E | cpu | 10 | 3/3 | 180.1 | 158 | 49.68 | 108.41 | 116.72 | 1.14 | 0 | 0 |
| E | cpu | 100 | 3/3 | 179.2 | 156 | 547.03 | 804.15 | 92.36 | 1.15 | 0 | 0 |
| E | cpu | 500 | 3/3 | 180.2 | 157 | 2754.53 | 3235.72 | 77.33 | 1.14 | 0 | 0 |
| N-sync | cpu | 10 | 3/3 | 204.5 | 204 | 47.55 | 84.89 | 75.87 | 1.01 | 0 | 0 |
| N-sync | cpu | 100 | 3/3 | 208.6 | 208 | 476.00 | 915.68 | 75.66 | 1.00 | 0 | 0 |
| N-sync | cpu | 500 | 3/3 | 206.2 | 205 | 2405.00 | 11631.97 | 75.74 | 1.00 | 0 | 0 |
| N-async | cpu | 10 | 3/3 | 208.7 | 208 | 47.25 | 59.04 | 120.84 | 1.00 | 0 | 0 |
| N-async | cpu | 100 | 3/3 | 207.8 | 208 | 471.12 | 1687.46 | 127.55 | 1.00 | 0 | 0 |
| N-async | cpu | 500 | 3/3 | 211.0 | 209 | 567.97 | 31868.17 | 127.30 | 1.01 | 0 | 0 |

Quick preflight: 21/21 valid; excluded from measured summary.

Recorded host 1-minute load average: min 5.67, median 12.07, max 26.50. Advisory only; no automatic contention/significance inference.

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
- No failed window is retried or removed. A window measured while foreign CPU (every process outside the server tree, this harness, bombardier and the fixture's Postgres backends) averaged at or above the contention gate is re-measured after the machine is quiet again; the contended attempt stays in the record under contendedAttempts and never enters a summary. Warmup is retained but excluded from summaries.
- Repeats are outermost; configuration order rotates by one each round. Each configuration gets a fresh process each round.

Raw generator JSON, stdout/stderr, exit status and resource samples remain in the source JSON. A passing run does not establish causal framework speed, cost savings, or statistical significance.

<details><summary>Recorded environment</summary>

```json
{
  "date": "2026-09-18T04:29:51.157Z",
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
