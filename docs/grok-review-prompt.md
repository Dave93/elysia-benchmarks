# Independent Grok review prompt

Act as a skeptical Python/Django performance engineer. Review the design below BEFORE seeing results. Aim to find unfair advantages for EITHER side, not to predict a winner. Search current PRIMARY sources, cite exact URLs and versions, distinguish measured evidence from marketing benchmarks.

We are adapting a local Elysia vs Nest benchmark to Elysia vs Django. Original fixture: Elysia 2.0.0-beta.12, Bun 1.4.2, Drizzle 0.45.2 + Bun SQL pool max 10, PostgreSQL 17.10. New installed Python environment: CPython 3.14.6 with GIL, Django 6.1.1, Django Ninja 1.7.0, Pydantic 2.13.5, psycopg binary 3.3.5 + psycopg-pool 3.3.1, orjson 3.12.0, PyJWT 2.14.0. All transitive dependencies locked with uv.

Seven routes: GET health JSON; POST echo validating name length 1..100, email, age integer 0..150, tags <=10 strings; GET me verifies HS256 JWT then SELECT one user; GET users/:id SELECT one; GET users?page=7&limit=20 ordered SELECT (no COUNT); POST orders validates, INSERT RETURNING, numeric(12,2) string output, HTTP 201; GET cpu?n=15000 chained SHA256 hexadecimal text starting from `elysia-vs-nest`, synchronous in both. 50k users / 200k orders, same physical schema/indexes/data. UTC milliseconds, same keys and JSON types. Django uses projected values() reads rather than model hydration. No output schema validation unless enabled in both.

Main candidates: (1) Elysia ordinary build, (2) Django Ninja synchronous views, Gunicorn 26.2.0 gthread 1 worker / 10 threads with psycopg pool max 10 and CONN_MAX_AGE=0, (3) Ninja async views Uvicorn 1 worker uvloop + httptools with Django ORM async methods (sync bridge, not native async driver). Elysia AOT and Granian potentially sensitivities. Production, no access logs, no sessions/admin/browser-auth middleware, loopback-only fixtures. No per-request connection creation. Do not compare against Django runserver or pretend one sync Gunicorn worker represents optimized Django.

Harness: canonical JSON and negative-case parity gate, 5s warmup + 3x30s c10/100/500, configuration rotation per repeat, order-table reset before each write window AFTER warmup, raw Bombardier output plus successful responses / elapsed time, errors retained. CPU from CPU-time deltas for full process tree, RSS summed including master (shared-page caveat). Same macOS M4 Pro laptop hosts client/server/Postgres, so exploratory not production server economics. No framework-only attribution across Python/JS, no direct cloud-cost extrapolation.

Please answer:
1. Which PRIMARY Django deployment should headline, and why? Are both WSGI and ASGI required? Does async ORM use synchronous internals in this exact version?
2. What hidden request lifecycle, pooling, thread or validation overhead can skew results? Any request-context async connection leaks?
3. Is `.values(...).filter(...).first()` versus Drizzle select fair? What SQL should inserts return? How to verify query count without DEBUG during timing?
4. Does orjson add unfair advantage or represent a sensible native optimized baseline? When use DRF as a separate named baseline?
5. Gunicorn gthread vs Uvicorn vs Granian: concrete preregistered settings and reasons; avoid choosing the server after seeing which beats the other language.
6. How to add an equal-resource multi-worker lane (CPU allocation, total pool budget, load balancer and process-tree accounting on both sides)? Why not infer it from rps/core of one process?
7. Validation parity traps: numeric-string coercion, bool-as-int, unknown keys, email normalisation, decimal rounding and HTTP errors. Which should be native semantics sensitivity vs aligned portable contract?
8. Top ten ways this study could still make a misleading claim, and exact falsification tests.
9. Is any alternative Python package mature enough for main results, or only sensitivity (e.g. third-party native async Django backend, free-threaded Python)?

Return a recommended experiment matrix, blocking issues, optional improvements, sources and unresolved uncertainties. Do not invent benchmark numbers.
