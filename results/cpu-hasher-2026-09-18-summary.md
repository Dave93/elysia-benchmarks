# Elysia vs Django — recorded observations

## bench — results/cpu-hasher-2026-09-18.json

Status: **passed**. Mode: **full-duration settings**. Started: 2026-09-18T18:15:56.257Z.

Configured repeats: 3. Recorded iterations/windows: 18.

- **E**: Elysia / Bun / Drizzle + Bun SQL
- **E-native**: Elysia / Bun / Bun.SHA256 hasher

Parity evidence: passed in this invocation.

Warmup 5s; measured duration 30s; concurrency 10, 100, 500.

Numbers are medians of valid recorded windows, not pooled latency percentiles. Invalid/missing windows are explicitly excluded, not repaired; incomplete groups are not comparable.

### API / database routes

| Config | Case | c | Valid / recorded | Success req/s | Success req per tree CPU-second | p50 ms | p99 ms | Mean tree RSS MiB | Tree CPU cores | Non-2xx incl. others | Transport errors (overlap) |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|

### CPU / crypto route (separate diagnostic)

Different crypto bindings prevent framework-only attribution.

| Config | Case | c | Valid / recorded | Success req/s | Success req per tree CPU-second | p50 ms | p99 ms | Mean tree RSS MiB | Tree CPU cores | Non-2xx incl. others | Transport errors (overlap) |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| E | cpu | 10 | 3/3 | 204.4 | 173 | 44.13 | 92.42 | 71.01 | 1.18 | 0 | 0 |
| E | cpu | 100 | 3/3 | 208.3 | 171 | 474.07 | 552.97 | 73.98 | 1.22 | 0 | 0 |
| E | cpu | 500 | 3/3 | 209.1 | 171 | 2373.45 | 3381.22 | 76.94 | 1.22 | 0 | 0 |
| E-native | cpu | 10 | 3/3 | 526.7 | 523 | 17.27 | 36.27 | 136.08 | 1.01 | 0 | 0 |
| E-native | cpu | 100 | 3/3 | 528.7 | 524 | 188.61 | 199.45 | 143.64 | 1.01 | 0 | 0 |
| E-native | cpu | 500 | 3/3 | 528.6 | 524 | 944.16 | 965.94 | 144.43 | 1.01 | 0 | 0 |

Quick preflight: 2/2 valid; excluded from measured summary.

Recorded host 1-minute load average: min 3.68, median 4.57, max 5.88. Advisory only; no automatic contention/significance inference.

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
  "date": "2026-09-18T18:15:56.258Z",
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
      "id": "E-native",
      "label": "Elysia / Bun / Bun.SHA256 hasher",
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
        "PYTHONHASHSEED": "0",
        "CPU_HASHER": "bun-native"
      },
      "sensitivity": true
    }
  ],
  "caveat": "Same-host macOS laptop, API + Postgres + load generator; no CPU affinity or causal framework-only attribution"
}
```

</details>
