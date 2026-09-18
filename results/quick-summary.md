# Elysia vs Django — recorded observations

## bench — results/quick-verification.json

Status: **passed**. Mode: **quick — plumbing only**. Started: 2026-09-16T19:12:57.759Z.

Configured repeats: 1. Recorded iterations/windows: 21.

- **E**: Elysia / Bun / Drizzle + Bun SQL
- **N-sync**: Django Ninja / Gunicorn gthread / Django ORM
- **N-async**: Django Ninja / Uvicorn uvloop httptools / Django async ORM interface

Parity evidence: passed in this invocation.

Warmup 1s; measured duration 3s; concurrency 10.

Numbers are medians of valid recorded windows, not pooled latency percentiles. Invalid/missing windows are explicitly excluded, not repaired; incomplete groups are not comparable.

### API / database routes

| Config | Case | c | Valid / recorded | Success req/s | p50 ms | p99 ms | Mean tree RSS MiB | Tree CPU cores | Non-2xx incl. others | Transport errors (overlap) |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| E | health | 10 | 1/1 | 99948.1 | 0.09 | 0.18 | 61.81 | 1.07 | 0 | 0 |
| E | echo | 10 | 1/1 | 81127.4 | 0.10 | 0.27 | 74.93 | 0.96 | 0 | 0 |
| E | me | 10 | 1/1 | 22405.9 | 0.41 | 1.14 | 117.79 | 1.28 | 0 | 0 |
| E | user | 10 | 1/1 | 27024.2 | 0.35 | 0.95 | 119.50 | 1.06 | 0 | 0 |
| E | list | 10 | 1/1 | 21044.6 | 0.44 | 1.10 | 131.46 | 1.04 | 0 | 0 |
| E | order | 10 | 1/1 | 23550.0 | 0.39 | 1.04 | 136.38 | 1.05 | 0 | 0 |
| N-sync | health | 10 | 1/1 | 2530.7 | 3.87 | 6.90 | 84.46 | 1.17 | 0 | 0 |
| N-sync | echo | 10 | 1/1 | 2346.3 | 4.14 | 7.77 | 85.36 | 1.16 | 0 | 0 |
| N-sync | me | 10 | 1/1 | 1426.3 | 6.77 | 12.32 | 99.63 | 1.20 | 0 | 0 |
| N-sync | user | 10 | 1/1 | 1361.4 | 7.06 | 14.36 | 99.66 | 1.22 | 0 | 0 |
| N-sync | list | 10 | 1/1 | 1369.2 | 6.81 | 18.23 | 77.59 | 1.17 | 0 | 0 |
| N-sync | order | 10 | 1/1 | 1625.8 | 6.02 | 10.41 | 73.95 | 1.24 | 0 | 0 |
| N-async | health | 10 | 1/1 | 3698.8 | 2.65 | 3.53 | 69.70 | 1.18 | 0 | 0 |
| N-async | echo | 10 | 1/1 | 3416.2 | 2.86 | 3.65 | 69.98 | 1.17 | 0 | 0 |
| N-async | me | 10 | 1/1 | 1591.7 | 6.20 | 9.03 | 81.64 | 1.19 | 0 | 0 |
| N-async | user | 10 | 1/1 | 1529.5 | 6.45 | 9.33 | 81.98 | 1.20 | 0 | 0 |
| N-async | list | 10 | 1/1 | 1563.3 | 6.13 | 17.14 | 82.11 | 1.18 | 0 | 0 |
| N-async | order | 10 | 1/1 | 1769.0 | 5.61 | 7.86 | 82.24 | 1.22 | 0 | 0 |

### CPU / crypto route (separate diagnostic)

Different crypto bindings prevent framework-only attribution.

| Config | Case | c | Valid / recorded | Success req/s | p50 ms | p99 ms | Mean tree RSS MiB | Tree CPU cores | Non-2xx incl. others | Transport errors (overlap) |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| E | cpu | 10 | 1/1 | 203.3 | 42.26 | 156.55 | 138.08 | 1.11 | 0 | 0 |
| N-sync | cpu | 10 | 1/1 | 212.8 | 45.41 | 88.98 | 73.93 | 1.00 | 0 | 0 |
| N-async | cpu | 10 | 1/1 | 214.5 | 45.05 | 85.37 | 82.09 | 0.98 | 0 | 0 |

Recorded host 1-minute load average: min 3.87, median 4.47, max 5.01. Advisory only; no automatic contention/significance inference.

### Limitations / recorded protocol

- Quick runs test plumbing only. Full benchmark automatically requires parity plus a recorded quick preflight before full windows.
- Successful RPS = req2xx / bombardier result.timeTakenSeconds; wallSeconds also includes client startup/exit.
- Latency includes timed attempts, including failures, not a success-only distribution. 2xx is the generator's status granularity; exact status/semantics checked by parity.
- Non-2xx includes others; transport errors overlap status buckets and must not be added to them. errorRate and transportErrorRate are separate rates over total status buckets.
- Process-tree RSS sums supervisor and workers and may double-count shared pages; CPU is coarse ps CPU-time deltas over the recorded sample span.
- Process churn or unavailable samples invalidate resource measurements. Very short-lived children between samples cannot be accounted for.
- Host 1/5/15-minute load averages are advisory context only, not foreign CPU, contention proof, or statistical significance.
- API, client and database share a laptop; no CPU affinity, cross-language causal attribution, or cloud cost extrapolation.
- CPU route uses different crypto bindings and must be reported separately from API/DB conclusions.
- No failed windows are silently retried or removed. Warmup is retained but excluded from summaries.
- Repeats are outermost; configuration order rotates by one each round. Each configuration gets a fresh process each round.

Raw generator JSON, stdout/stderr, exit status and resource samples remain in the source JSON. A passing run does not establish causal framework speed, cost savings, or statistical significance.

<details><summary>Recorded environment</summary>

```json
{
  "date": "2026-09-16T19:12:57.759Z",
  "bun": "1.4.2",
  "bunRevision": "744846f844374847c902b5e7fd59b4342a51ef99",
  "cpu": "Apple M4 Pro",
  "cores": "14",
  "macos": "27.0",
  "postgres": "psql (PostgreSQL) 17.10 (Homebrew)",
  "bombardier": "",
  "python": "Python 3.14.6",
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

---

## boot — results/boot-quick.json

Status: **passed**. Mode: **quick — plumbing only**. Started: 2026-09-16T19:15:35.863Z.

Configured repeats: 2. Recorded iterations/windows: 6.

- **E**: Elysia / Bun / Drizzle + Bun SQL
- **N-sync**: Django Ninja / Gunicorn gthread / Django ORM
- **N-async**: Django Ninja / Uvicorn uvloop httptools / Django async ORM interface

Parity evidence: passed in this invocation.

Fresh-process boot only; OS and database caches were not flushed.

| Config | Valid / recorded | Median ready ms | Median first DB ms |
|---|---:|---:|---:|
| E | 2/2 | 88.68 | 14.90 |
| N-sync | 2/2 | 186.85 | 55.02 |
| N-async | 2/2 | 211.35 | 55.94 |
### Limitations / recorded protocol

- New process on each iteration, not cold OS/page/DB caches. Parity ran first and warms shared caches.
- Readiness includes spawn through successful health polling. First DB request is measured through full body read and validated, with a 10-second timeout.
- Config order rotates each round; no cross-language compilation/DX or cost claims.

Raw generator JSON, stdout/stderr, exit status and resource samples remain in the source JSON. A passing run does not establish causal framework speed, cost savings, or statistical significance.

<details><summary>Recorded environment</summary>

```json
{
  "date": "2026-09-16T19:15:35.863Z",
  "bun": "1.4.2",
  "bunRevision": "744846f844374847c902b5e7fd59b4342a51ef99",
  "cpu": "Apple M4 Pro",
  "cores": "14",
  "macos": "27.0",
  "postgres": "psql (PostgreSQL) 17.10 (Homebrew)",
  "bombardier": "",
  "python": "Python 3.14.6",
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

---

## noise — results/noise-quick.json

Status: **passed**. Mode: **quick — plumbing only**. Started: 2026-09-16T19:15:49.742Z.

Configured repeats: 5. Recorded iterations/windows: 10.

- **E**: Elysia / Bun / Drizzle + Bun SQL

Parity evidence: passed in this invocation.

Warmup 1s; measured duration 3s; concurrency 10.

Numbers are medians of valid recorded windows, not pooled latency percentiles. Invalid/missing windows are explicitly excluded, not repaired; incomplete groups are not comparable.

### API / database routes

| Config | Case | c | Valid / recorded | Success req/s | p50 ms | p99 ms | Mean tree RSS MiB | Tree CPU cores | Non-2xx incl. others | Transport errors (overlap) |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| E | health | 10 | 5/5 | 97900.2 | 0.09 | 0.18 | 61.95 | 1.07 | 0 | 0 |
| E | user | 10 | 5/5 | 27724.2 | 0.35 | 0.92 | 109.84 | 1.06 | 0 | 0 |

### Observed same-config variability

Population CV and (max−min)/min describe these samples only; neither is a significance threshold.

- E/health/c=10: n=5, population CV=0.0397, observed range/min=11.50%.
- E/user/c=10: n=5, population CV=0.0392, observed range/min=10.54%.

Recorded host 1-minute load average: min 3.48, median 4.27, max 4.54. Advisory only; no automatic contention/significance inference.

### Limitations / recorded protocol

- Quick runs test plumbing only. Full benchmark automatically requires parity plus a recorded quick preflight before full windows.
- Successful RPS = req2xx / bombardier result.timeTakenSeconds; wallSeconds also includes client startup/exit.
- Latency includes timed attempts, including failures, not a success-only distribution. 2xx is the generator's status granularity; exact status/semantics checked by parity.
- Non-2xx includes others; transport errors overlap status buckets and must not be added to them. errorRate and transportErrorRate are separate rates over total status buckets.
- Process-tree RSS sums supervisor and workers and may double-count shared pages; CPU is coarse ps CPU-time deltas over the recorded sample span.
- Process churn or unavailable samples invalidate resource measurements. Very short-lived children between samples cannot be accounted for.
- Host 1/5/15-minute load averages are advisory context only, not foreign CPU, contention proof, or statistical significance.
- API, client and database share a laptop; no CPU affinity, cross-language causal attribution, or cloud cost extrapolation.
- CPU route uses different crypto bindings and must be reported separately from API/DB conclusions.
- No failed windows are silently retried or removed. Warmup is retained but excluded from summaries.
- Five same-config process-start repetitions describe observed variability, not a universal noise floor or significance threshold.

Raw generator JSON, stdout/stderr, exit status and resource samples remain in the source JSON. A passing run does not establish causal framework speed, cost savings, or statistical significance.

<details><summary>Recorded environment</summary>

```json
{
  "date": "2026-09-16T19:15:49.742Z",
  "bun": "1.4.2",
  "bunRevision": "744846f844374847c902b5e7fd59b4342a51ef99",
  "cpu": "Apple M4 Pro",
  "cores": "14",
  "macos": "27.0",
  "postgres": "psql (PostgreSQL) 17.10 (Homebrew)",
  "bombardier": "",
  "python": "Python 3.14.6",
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
    }
  ],
  "caveat": "Same-host macOS laptop, API + Postgres + load generator; no CPU affinity or causal framework-only attribution"
}
```

</details>
