# Elysia vs Django: benchmark specification

Status: run of record `results/full-2026-09-18b.json` (harness v3, 2026-09-18). Granian, multi-worker and equal-resource Linux lanes are not measured.

## Scope

Port the seven-route SaaS slice from `../elysia_vs_nest`, not its historical measurements. Compare complete stacks, not an isolated framework or programming language effect. No predetermined winner.

- Elysia 2 beta / Bun / Drizzle / Bun SQL; same pinned Elysia as original.
- Same Elysia with AOT build as sensitivity.
- Django Ninja / Pydantic 2 / Django ORM / psycopg binary + pool / orjson.
- Compare synchronous WSGI and asynchronous ASGI deployment rather than assuming async is faster.
- Add alternative server as sensitivity where dependencies permit. DRF is a distinct API stack, not synonymous with Django; do not label Ninja results DRF results.

## Workload

`GET /health`, `POST /echo`, `GET /me`, `GET /users/:id`, `GET /users?page=7&limit=20`, `POST /orders`, `GET /cpu?n=15000`.
Same deterministic 50,000 users and 200,000 orders, numeric(12,2), timestamp milliseconds UTC, JWT HS256, pool maximum 10. CPU uses identical chained SHA256 bytes, but different crypto bindings: report separately from API/DB conclusions.

## Fairness improvements over original

Use isolated database `bench_elysia_django`; never drop `bench_saas`. Fail closed on parity before measurement. Validate expected statuses and response semantics, including negative requests and DB insert persistence. Canonical JSON equality ignores property order, not data types; strip only generated order id/time, validate those separately.

One application worker is a diagnostic, not proof of equal CPU allocation: include supervisor and worker processes in resource sampling. CPU from process CPU-time deltas, not lifetime `%CPU`. Explicitly document thread count, global connection budget and ASGI sync bridge. Do not extrapolate single-worker laptop data into cloud bills.

Production mode, loopback-only listeners, no development reload, access logging, sessions, admin or browser authentication middleware. Bearer-only benchmark fixture, not deployable application. Native optimized dependencies are allowed on both sides. No caches or database durability changes.

Rotate configuration order per repeat. Discard warmup; full defaults 5s + 3x30s, concurrency 10/100/500. Quick runs are plumbing only. Reset order data before each insert measurement including after warmup. Preserve raw load-generator output, HTTP errors and transport errors. Flag any contaminated/failed windows; never silently turn them into valid results. Report successful throughput, latency, process-tree RSS and CPU with laptop/client/database caveats.

## Deliverables and gates

Research notes + source URLs + independent Grok review prompt; two apps and lockfiles; seed, parity, benchmark, noise, boot and report tools; automated harness tests; recorded smoke results. Full run only after parity and quick pass; no old results copied. DX and financial modeling require a separately justified cross-language protocol (Python has no directly equivalent mandatory bundling step).
