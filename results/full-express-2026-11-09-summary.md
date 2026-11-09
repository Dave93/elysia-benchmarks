# Benchmark run — recorded observations

## bench — results/full-express-2026-11-09-resumed.json

Status: **passed**. Mode: **full-duration settings**. Started: 2026-11-09T09:27:44.796Z.

Configured repeats: 3. Recorded iterations/windows: 252.

- **E**: Elysia / Bun / Drizzle + Bun SQL
- **X-bun**: Express / Bun / Drizzle + Bun SQL
- **X-bun-pg**: Express / Bun / Drizzle + postgres.js
- **X-node**: Express / Node / Drizzle + postgres.js

Parity evidence: passed in this invocation.

Warmup 5s; measured duration 30s; concurrency 10, 100, 500.

Numbers are medians of valid recorded windows, not pooled latency percentiles. Invalid/missing windows are explicitly excluded, not repaired; incomplete groups are not comparable.

### API / database routes

| Config | Case | c | Valid / recorded | Success req/s | Success req per tree CPU-second | p50 ms | p99 ms | Mean tree RSS MiB | Tree CPU cores | Non-2xx incl. others | Transport errors (overlap) |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| E | health | 10 | 3/3 | 59967.8 | 57953 | 0.15 | 0.38 | 55.32 | 1.03 | 0 | 0 |
| E | health | 100 | 3/3 | 57545.8 | 56488 | 1.81 | 2.67 | 53.60 | 1.02 | 0 | 0 |
| E | health | 500 | 3/3 | 56764.5 | 55792 | 9.22 | 10.87 | 53.71 | 1.02 | 0 | 0 |
| E | echo | 10 | 3/3 | 44105.4 | 42566 | 0.18 | 0.57 | 59.07 | 1.04 | 0 | 0 |
| E | echo | 100 | 3/3 | 43136.9 | 42036 | 2.11 | 3.75 | 57.39 | 1.03 | 0 | 0 |
| E | echo | 500 | 3/3 | 42221.0 | 41252 | 11.15 | 16.47 | 57.65 | 1.02 | 0 | 0 |
| E | me | 10 | 3/3 | 7947.3 | 6846 | 1.11 | 2.91 | 75.50 | 1.16 | 0 | 0 |
| E | me | 100 | 3/3 | 9172.0 | 7507 | 10.70 | 16.78 | 75.96 | 1.22 | 0 | 0 |
| E | me | 500 | 3/3 | 8948.5 | 6881 | 55.33 | 75.66 | 82.54 | 1.30 | 0 | 0 |
| E | user | 10 | 3/3 | 9946.4 | 9344 | 0.93 | 2.22 | 80.94 | 1.06 | 0 | 0 |
| E | user | 100 | 3/3 | 10683.4 | 9631 | 9.27 | 13.81 | 81.00 | 1.10 | 0 | 0 |
| E | user | 500 | 3/3 | 10416.1 | 8800 | 47.57 | 67.00 | 84.46 | 1.17 | 0 | 0 |
| E | list | 10 | 3/3 | 7357.9 | 6898 | 1.27 | 2.84 | 83.78 | 1.07 | 0 | 0 |
| E | list | 100 | 3/3 | 7811.0 | 6641 | 12.66 | 20.33 | 82.09 | 1.18 | 0 | 0 |
| E | list | 500 | 3/3 | 7839.9 | 6280 | 63.32 | 90.37 | 84.63 | 1.24 | 0 | 0 |
| E | order | 10 | 3/3 | 7403.5 | 7167 | 1.24 | 3.07 | 84.15 | 1.03 | 0 | 0 |
| E | order | 100 | 3/3 | 8543.8 | 7967 | 11.39 | 20.61 | 85.83 | 1.07 | 0 | 0 |
| E | order | 500 | 3/3 | 8621.4 | 7681 | 57.06 | 84.61 | 88.33 | 1.12 | 0 | 0 |
| X-bun | health | 10 | 3/3 | 32048.5 | 30979 | 0.26 | 0.98 | 78.86 | 1.04 | 0 | 0 |
| X-bun | health | 100 | 3/3 | 29985.6 | 28836 | 3.12 | 5.24 | 77.75 | 1.04 | 0 | 0 |
| X-bun | health | 500 | 3/3 | 29112.6 | 27768 | 16.62 | 22.92 | 85.80 | 1.05 | 0 | 0 |
| X-bun | echo | 10 | 3/3 | 19706.0 | 18886 | 0.42 | 1.44 | 90.92 | 1.04 | 0 | 0 |
| X-bun | echo | 100 | 3/3 | 19218.5 | 18677 | 4.99 | 7.58 | 79.68 | 1.03 | 0 | 0 |
| X-bun | echo | 500 | 3/3 | 19125.4 | 18412 | 25.65 | 34.59 | 89.82 | 1.04 | 0 | 0 |
| X-bun | me | 10 | 3/3 | 6074.6 | 5389 | 1.48 | 3.65 | 94.10 | 1.13 | 0 | 0 |
| X-bun | me | 100 | 3/3 | 7680.4 | 6496 | 12.84 | 19.17 | 98.60 | 1.18 | 0 | 0 |
| X-bun | me | 500 | 3/3 | 7528.1 | 5903 | 65.49 | 87.69 | 105.53 | 1.28 | 0 | 0 |
| X-bun | user | 10 | 3/3 | 7098.1 | 6806 | 1.30 | 3.02 | 101.93 | 1.05 | 0 | 0 |
| X-bun | user | 100 | 3/3 | 7975.4 | 7340 | 12.36 | 18.69 | 102.47 | 1.08 | 0 | 0 |
| X-bun | user | 500 | 3/3 | 8018.6 | 6803 | 61.77 | 84.71 | 112.95 | 1.18 | 0 | 0 |
| X-bun | list | 10 | 3/3 | 5448.3 | 5156 | 1.72 | 3.83 | 103.18 | 1.06 | 0 | 0 |
| X-bun | list | 100 | 3/3 | 6083.5 | 5305 | 16.20 | 24.88 | 102.10 | 1.15 | 0 | 0 |
| X-bun | list | 500 | 3/3 | 6134.7 | 4936 | 80.86 | 114.70 | 117.32 | 1.24 | 0 | 0 |
| X-bun | order | 10 | 3/3 | 5308.4 | 5176 | 1.75 | 4.01 | 103.04 | 1.02 | 0 | 0 |
| X-bun | order | 100 | 3/3 | 6295.8 | 5912 | 15.56 | 26.21 | 106.49 | 1.06 | 0 | 0 |
| X-bun | order | 500 | 3/3 | 6248.9 | 5499 | 78.72 | 110.14 | 115.06 | 1.14 | 0 | 0 |
| X-bun-pg | health | 10 | 3/3 | 31766.1 | 30633 | 0.26 | 1.00 | 79.88 | 1.03 | 0 | 0 |
| X-bun-pg | health | 100 | 3/3 | 29410.1 | 28223 | 3.17 | 5.35 | 78.52 | 1.04 | 0 | 0 |
| X-bun-pg | health | 500 | 3/3 | 28667.4 | 27381 | 16.85 | 23.18 | 86.62 | 1.05 | 0 | 0 |
| X-bun-pg | echo | 10 | 3/3 | 19594.4 | 18784 | 0.43 | 1.43 | 87.40 | 1.04 | 0 | 0 |
| X-bun-pg | echo | 100 | 3/3 | 19474.3 | 18931 | 4.92 | 7.51 | 79.75 | 1.03 | 0 | 0 |
| X-bun-pg | echo | 500 | 3/3 | 19280.5 | 18590 | 25.30 | 34.05 | 87.34 | 1.04 | 0 | 0 |
| X-bun-pg | me | 10 | 3/3 | 5439.3 | 4777 | 1.65 | 4.08 | 98.50 | 1.14 | 0 | 0 |
| X-bun-pg | me | 100 | 3/3 | 5049.3 | 4178 | 19.30 | 31.81 | 101.03 | 1.21 | 0 | 0 |
| X-bun-pg | me | 500 | 3/3 | 4764.0 | 3779 | 103.27 | 140.59 | 113.23 | 1.26 | 0 | 0 |
| X-bun-pg | user | 10 | 3/3 | 5872.3 | 5515 | 1.53 | 3.79 | 96.65 | 1.06 | 0 | 0 |
| X-bun-pg | user | 100 | 3/3 | 5646.6 | 5019 | 17.28 | 29.65 | 102.13 | 1.12 | 0 | 0 |
| X-bun-pg | user | 500 | 3/3 | 5161.2 | 4323 | 95.42 | 130.61 | 115.29 | 1.19 | 0 | 0 |
| X-bun-pg | list | 10 | 3/3 | 4308.4 | 3995 | 2.11 | 5.56 | 101.13 | 1.08 | 0 | 0 |
| X-bun-pg | list | 100 | 3/3 | 4069.2 | 3444 | 24.03 | 40.20 | 103.92 | 1.18 | 0 | 0 |
| X-bun-pg | list | 500 | 3/3 | 3863.2 | 3169 | 127.34 | 163.82 | 117.76 | 1.22 | 0 | 0 |
| X-bun-pg | order | 10 | 3/3 | 4471.1 | 4566 | 2.08 | 4.96 | 101.25 | 0.98 | 0 | 0 |
| X-bun-pg | order | 100 | 3/3 | 4231.0 | 3939 | 22.46 | 41.72 | 107.21 | 1.08 | 0 | 0 |
| X-bun-pg | order | 500 | 3/3 | 4170.9 | 3660 | 116.47 | 159.22 | 121.12 | 1.14 | 0 | 0 |
| X-node | health | 10 | 3/3 | 21571.0 | 21574 | 0.39 | 1.02 | 95.41 | 1.00 | 0 | 0 |
| X-node | health | 100 | 3/3 | 21050.7 | 21033 | 4.53 | 7.11 | 107.41 | 1.00 | 0 | 0 |
| X-node | health | 500 | 3/3 | 21241.0 | 21231 | 22.50 | 34.47 | 144.69 | 1.00 | 0 | 0 |
| X-node | echo | 10 | 3/3 | 15759.2 | 15504 | 0.53 | 1.46 | 165.20 | 1.02 | 0 | 0 |
| X-node | echo | 100 | 3/3 | 15321.6 | 15070 | 6.21 | 10.63 | 165.20 | 1.02 | 0 | 0 |
| X-node | echo | 500 | 3/3 | 14085.2 | 13763 | 33.88 | 51.26 | 130.34 | 1.02 | 0 | 0 |
| X-node | me | 10 | 3/3 | 3698.2 | 3291 | 2.52 | 5.55 | 170.11 | 1.12 | 0 | 0 |
| X-node | me | 100 | 3/3 | 3573.6 | 3158 | 27.32 | 44.00 | 164.70 | 1.13 | 0 | 0 |
| X-node | me | 500 | 3/3 | 3390.3 | 2943 | 146.32 | 182.02 | 210.52 | 1.15 | 0 | 0 |
| X-node | user | 10 | 3/3 | 4152.7 | 3919 | 2.23 | 4.64 | 171.47 | 1.06 | 0 | 0 |
| X-node | user | 100 | 3/3 | 4196.4 | 3902 | 23.18 | 38.64 | 173.86 | 1.07 | 0 | 0 |
| X-node | user | 500 | 3/3 | 3923.4 | 3584 | 124.05 | 161.79 | 215.02 | 1.10 | 0 | 0 |
| X-node | list | 10 | 3/3 | 3383.0 | 3174 | 2.78 | 5.45 | 165.39 | 1.07 | 0 | 0 |
| X-node | list | 100 | 3/3 | 3411.1 | 3180 | 28.65 | 45.33 | 169.57 | 1.08 | 0 | 0 |
| X-node | list | 500 | 3/3 | 3191.2 | 2682 | 154.29 | 194.87 | 217.03 | 1.19 | 0 | 0 |
| X-node | order | 10 | 3/3 | 3548.1 | 3657 | 2.66 | 5.58 | 195.86 | 0.97 | 0 | 0 |
| X-node | order | 100 | 3/3 | 3497.9 | 3352 | 27.72 | 47.36 | 193.83 | 1.05 | 0 | 0 |
| X-node | order | 500 | 3/3 | 3319.5 | 3055 | 146.59 | 196.44 | 218.65 | 1.09 | 0 | 0 |

### CPU / crypto route (separate diagnostic)

Different crypto bindings prevent framework-only attribution.

| Config | Case | c | Valid / recorded | Success req/s | Success req per tree CPU-second | p50 ms | p99 ms | Mean tree RSS MiB | Tree CPU cores | Non-2xx incl. others | Transport errors (overlap) |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| E | cpu | 10 | 3/3 | 54.6 | 46 | 165.80 | 355.49 | 79.92 | 1.18 | 0 | 0 |
| E | cpu | 100 | 3/3 | 54.2 | 45 | 1833.05 | 1960.18 | 76.16 | 1.19 | 0 | 0 |
| E | cpu | 500 | 3/3 | 53.4 | 45 | 9383.26 | 9497.27 | 75.81 | 1.19 | 0 | 0 |
| X-bun | cpu | 10 | 3/3 | 51.8 | 44 | 188.23 | 355.29 | 108.71 | 1.16 | 0 | 0 |
| X-bun | cpu | 100 | 3/3 | 52.2 | 45 | 1911.83 | 1991.51 | 90.93 | 1.17 | 0 | 0 |
| X-bun-pg | cpu | 10 | 3/3 | 52.1 | 45 | 188.09 | 236.56 | 99.38 | 1.16 | 0 | 0 |
| X-bun-pg | cpu | 100 | 3/3 | 52.7 | 45 | 1895.33 | 1973.93 | 95.42 | 1.16 | 0 | 0 |
| X-bun-pg | cpu | 500 | 3/3 | 52.4 | 45 | 9439.29 | 10455.76 | 96.13 | 1.16 | 0 | 0 |
| X-node | cpu | 10 | 3/3 | 54.9 | 55 | 171.74 | 351.34 | 242.02 | 1.00 | 0 | 0 |
| X-node | cpu | 100 | 3/3 | 54.3 | 54 | 757.59 | 31490.96 | 239.92 | 1.00 | 0 | 0 |
| X-node | cpu | 500 | 3/3 | 53.3 | 53 | 863.66 | 39016.34 | 203.64 | 1.00 | 0 | 0 |
| X-bun | cpu | 500 | 3/3 | 52.0 | 44 | 9526.20 | 10111.36 | 94.03 | 1.17 | 0 | 0 |

Quick preflight: 28/28 valid; excluded from measured summary.

Recorded host 1-minute load average: min 1.52, median 2.91, max 5.80. Advisory only; no automatic contention/significance inference.

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
  "linux": {
    "cpuModel": "Intel(R) Core(TM) i3-10100 CPU @ 3.60GHz",
    "logicalCpus": "8",
    "kernel": "7.0.0-42-generic",
    "os": "Ubuntu 26.04.1 LTS",
    "cpuGovernor": "powersave",
    "netCoreSomaxconn": "4096",
    "memTotal": "MemTotal:       15758428 kB"
  },
  "postgresServer": "PostgreSQL 17.11 on x86_64-pc-linux-musl, compiled by gcc (Alpine 15.2.0) 15.2.0, 64-bit",
  "node": "v26.10.0",
  "date": "2026-11-09T09:27:44.899Z",
  "bun": "1.4.2",
  "bunRevision": "744846f844374847c902b5e7fd59b4342a51ef99",
  "cpu": "unavailable",
  "cores": "unavailable",
  "macos": "unavailable",
  "postgres": "psql (PostgreSQL) 18.6 (Ubuntu 18.6-0ubuntu0.26.04.1)",
  "bombardier": "",
  "python": "unavailable",
  "bombardierSha256": "d3dc4a9ecec3f8bd43f8c196ad533cb4b79ca55b11fc74c3184231e00a95bc0b",
  "somaxconn": "unavailable",
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
  "expressManifest": {
    "name": "express-api",
    "private": true,
    "type": "module",
    "scripts": {
      "build": "bun build.ts",
      "typecheck": "tsc --noEmit"
    },
    "dependencies": {
      "express": "5.3.0",
      "typebox": "1.4.6",
      "exact-mirror": "1.2.7"
    },
    "devDependencies": {
      "@types/bun": "^1.3.14",
      "@types/express": "5.0.6",
      "typescript": "^5.9.0"
    },
    "_comment": "drizzle-orm, postgres and jose are deliberately absent: db.ts, auth.ts and cpu.ts are imported from apps/elysia-api, as apps/hono-api does, so all three frameworks share one driver module and one JWT implementation. typebox 1.4.6 and exact-mirror 1.2.7 are the exact versions apps/elysia-api installs for Elysia 2.0.0-rc.4 (npm latest on 2026-11-09; its peer ranges are typebox >= 1.3.35 and exact-mirror >= 1.2.7, and these are the newest of each): Express gets Elysia's own validator and cleaner, so the measured difference is Express itself."
  },
  "pythonPackages": "unavailable",
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
      "drizzle-orm": "^0.45.2",
      "elysia": "2.0.0-rc.4",
      "exact-mirror": "1.2.7",
      "jose": "^6.2.11",
      "postgres": "^3.4.9",
      "typebox": "1.4.6"
    },
    "devDependencies": {
      "@types/bun": "^1.3.14",
      "typescript": "^5.9.0"
    }
  },
  "locks": {
    "bun.lock": "2c1fc796f16c7db1e32633eae212d875f048625786beb6142135fc5ea4f788cd",
    "apps/elysia-api/bun.lock": "2a99d924a04e19ec104a4649e0b3361227a5e811fb921ed51fb632cd94d7312b",
    "apps/hono-api/bun.lock": "b5e75ab0d53e9b81423f48c6da0a8f8085d39de300026fff554e1448515ecca9",
    "apps/express-api/bun.lock": "9d0846fe4c0757e938b2a3f31e9f4f707261cd7378a98c9e1f7870a7811d6a75",
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
        "DATABASE_URL": "postgres://postgres@127.0.0.1:5433/bench_elysia_django",
        "PYTHONPATH": "apps/django-api",
        "DJANGO_SETTINGS_MODULE": "config.settings",
        "PYTHONHASHSEED": "0"
      }
    },
    {
      "id": "X-bun",
      "label": "Express / Bun / Drizzle + Bun SQL",
      "cmd": [
        "bun",
        "apps/express-api/dist/index.js"
      ],
      "env": {
        "NODE_ENV": "production",
        "PORT": "3100",
        "DATABASE_URL": "postgres://postgres@127.0.0.1:5433/bench_elysia_django",
        "PYTHONPATH": "apps/django-api",
        "DJANGO_SETTINGS_MODULE": "config.settings",
        "PYTHONHASHSEED": "0"
      }
    },
    {
      "id": "X-bun-pg",
      "label": "Express / Bun / Drizzle + postgres.js",
      "cmd": [
        "bun",
        "apps/express-api/dist-node/index.js"
      ],
      "env": {
        "NODE_ENV": "production",
        "PORT": "3100",
        "DATABASE_URL": "postgres://postgres@127.0.0.1:5433/bench_elysia_django",
        "PYTHONPATH": "apps/django-api",
        "DJANGO_SETTINGS_MODULE": "config.settings",
        "PYTHONHASHSEED": "0",
        "DB_DRIVER": "postgresjs"
      }
    },
    {
      "id": "X-node",
      "label": "Express / Node / Drizzle + postgres.js",
      "cmd": [
        "node",
        "apps/express-api/dist-node/index.js"
      ],
      "env": {
        "NODE_ENV": "production",
        "PORT": "3100",
        "DATABASE_URL": "postgres://postgres@127.0.0.1:5433/bench_elysia_django",
        "PYTHONPATH": "apps/django-api",
        "DJANGO_SETTINGS_MODULE": "config.settings",
        "PYTHONHASHSEED": "0"
      }
    }
  ],
  "caveat": "Same-host Linux desktop, API + Postgres + load generator on one machine; no CPU affinity or causal framework-only attribution"
}
```

</details>

---

## noise — results/noise-express-2026-11-09.json

Status: **passed**. Mode: **full-duration settings**. Started: 2026-11-09T09:20:31.500Z.

Configured repeats: 5. Recorded iterations/windows: 10.

- **E**: Elysia / Bun / Drizzle + Bun SQL

Parity evidence: passed in this invocation.

Warmup 5s; measured duration 30s; concurrency 100.

Numbers are medians of valid recorded windows, not pooled latency percentiles. Invalid/missing windows are explicitly excluded, not repaired; incomplete groups are not comparable.

### API / database routes

| Config | Case | c | Valid / recorded | Success req/s | Success req per tree CPU-second | p50 ms | p99 ms | Mean tree RSS MiB | Tree CPU cores | Non-2xx incl. others | Transport errors (overlap) |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| E | health | 100 | 5/5 | 56983.1 | 55702 | 1.81 | 2.88 | 56.86 | 1.02 | 0 | 0 |
| E | user | 100 | 5/5 | 10483.4 | 9501 | 9.34 | 14.59 | 77.37 | 1.11 | 0 | 0 |

### Observed same-config variability

Population CV and (max−min)/min describe these samples only; neither is a significance threshold.

- E/health/c=100: n=5, population CV=0.0039, observed range/min=1.03%.
- E/user/c=100: n=5, population CV=0.0065, observed range/min=1.75%.

Recorded host 1-minute load average: min 2.26, median 2.84, max 4.09. Advisory only; no automatic contention/significance inference.

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
  "linux": {
    "cpuModel": "Intel(R) Core(TM) i3-10100 CPU @ 3.60GHz",
    "logicalCpus": "8",
    "kernel": "7.0.0-42-generic",
    "os": "Ubuntu 26.04.1 LTS",
    "cpuGovernor": "powersave",
    "netCoreSomaxconn": "4096",
    "memTotal": "MemTotal:       15758428 kB"
  },
  "postgresServer": "PostgreSQL 17.11 on x86_64-pc-linux-musl, compiled by gcc (Alpine 15.2.0) 15.2.0, 64-bit",
  "node": "v26.10.0",
  "date": "2026-11-09T09:20:31.536Z",
  "bun": "1.4.2",
  "bunRevision": "744846f844374847c902b5e7fd59b4342a51ef99",
  "cpu": "unavailable",
  "cores": "unavailable",
  "macos": "unavailable",
  "postgres": "psql (PostgreSQL) 18.6 (Ubuntu 18.6-0ubuntu0.26.04.1)",
  "bombardier": "",
  "python": "unavailable",
  "bombardierSha256": "d3dc4a9ecec3f8bd43f8c196ad533cb4b79ca55b11fc74c3184231e00a95bc0b",
  "somaxconn": "unavailable",
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
  "expressManifest": {
    "name": "express-api",
    "private": true,
    "type": "module",
    "scripts": {
      "build": "bun build.ts",
      "typecheck": "tsc --noEmit"
    },
    "dependencies": {
      "express": "5.3.0",
      "typebox": "1.4.6",
      "exact-mirror": "1.2.7"
    },
    "devDependencies": {
      "@types/bun": "^1.3.14",
      "@types/express": "5.0.6",
      "typescript": "^5.9.0"
    },
    "_comment": "drizzle-orm, postgres and jose are deliberately absent: db.ts, auth.ts and cpu.ts are imported from apps/elysia-api, as apps/hono-api does, so all three frameworks share one driver module and one JWT implementation. typebox 1.4.6 and exact-mirror 1.2.7 are the exact versions apps/elysia-api installs for Elysia 2.0.0-rc.4 (npm latest on 2026-11-09; its peer ranges are typebox >= 1.3.35 and exact-mirror >= 1.2.7, and these are the newest of each): Express gets Elysia's own validator and cleaner, so the measured difference is Express itself."
  },
  "pythonPackages": "unavailable",
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
      "drizzle-orm": "^0.45.2",
      "elysia": "2.0.0-rc.4",
      "exact-mirror": "1.2.7",
      "jose": "^6.2.11",
      "postgres": "^3.4.9",
      "typebox": "1.4.6"
    },
    "devDependencies": {
      "@types/bun": "^1.3.14",
      "typescript": "^5.9.0"
    }
  },
  "locks": {
    "bun.lock": "2c1fc796f16c7db1e32633eae212d875f048625786beb6142135fc5ea4f788cd",
    "apps/elysia-api/bun.lock": "2a99d924a04e19ec104a4649e0b3361227a5e811fb921ed51fb632cd94d7312b",
    "apps/hono-api/bun.lock": "b5e75ab0d53e9b81423f48c6da0a8f8085d39de300026fff554e1448515ecca9",
    "apps/express-api/bun.lock": "9d0846fe4c0757e938b2a3f31e9f4f707261cd7378a98c9e1f7870a7811d6a75",
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
        "DATABASE_URL": "postgres://postgres@127.0.0.1:5433/bench_elysia_django",
        "PYTHONPATH": "apps/django-api",
        "DJANGO_SETTINGS_MODULE": "config.settings",
        "PYTHONHASHSEED": "0"
      }
    }
  ],
  "caveat": "Same-host Linux desktop, API + Postgres + load generator on one machine; no CPU affinity or causal framework-only attribution"
}
```

</details>
