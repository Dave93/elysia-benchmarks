# Implementation log

## 2026-09-16

- Original benchmark has seven routes, Elysia 2.0.0-beta.12, ordinary + AOT builds. Copied source/build manifests and lockfiles only; no old measurements or dependencies copied.
- `bun install`, Elysia install and both builds succeeded with Bun 1.4.2.
- 18:25:23Z: ordinary production build `GET http://127.0.0.1:3100/health` returned HTTP 200, `{"status":"ok"}`. This is a smoke check, not a throughput result.
- Isolated database name from original `bench_saas`; seed requires RESEED=1 before replacing existing fixture and refuses nonlocal/nonfixture database names.
- CPU seed string remains `elysia-vs-nest` intentionally: preserve original algorithm input, not a user-facing product label.
- Research and deployment choices are recorded under docs/research; this remains a first implemented fixture, not a publication-quality completed benchmark.
- Django 6.1.1, Ninja 1.7.0, psycopg binary/pool and current Gunicorn/Uvicorn installed with uv lock. Local CPython is 3.14.6; upstream 3.14.7 not silently substituted.
- Ninja response mapping with NOT_SET as a mapping value is unsupported; removed that approach. Non-200 responses use documented HttpResponse passthrough + same orjson encoding, avoiding additional response-schema work.
- Gunicorn worker shutdown outlived master-only shutdown; explicit descendant signalling and port release check fixed sequential parity. Direct gthread check confirmed worker PID visibility.
- First smoke script omitted Authorization forwarding and returned 401 on /me for every stack. Retained results/smoke.json as INVALID. Fixed by reusing cases.ts bombardierArgs; isolated /me regression check: 69,354 successful requests, 0 HTTP failures, 0 others over 3s. Added automated argument propagation test.
- Corrected smoke comparison: 3 configs × 7 routes × 3s, no HTTP/transport errors. These are not statistically repeated benchmark conclusions.
- Parity: 38 cases on E, E-aot, N-sync, N-async passed. Three Python contract/query/rounding tests passed. Elysia tsc and uv sync --locked passed. 18 Bun tests / 92 assertions passed.
- Independent direct Uvicorn + curl E2E completed outside harness: results/authoritative-e2e.txt contains exact bodies, 200/201 statuses, curl exit codes 0, persisted insert assertion, server termination and no remaining listener. Other direct negative checks confirmed 401/404/422. Inherited 31-byte JWT secret causes PyJWT warning; not hidden.
- Main harness quick pass completed: results/quick-verification.json status=passed, 21/21 valid windows. Quick startup 6/6 and noise 10/10 windows passed; results/quick-summary.md generated from explicit inputs. Final Bun suite: 19 tests / 97 assertions. No full-duration run was started.
- Bombardier version metadata is empty in existing quick artifacts because its version command writes outside captured stdout; retain this limitation and capture executable hash/version before a publication run.
- Artifact UTC clock still reported 2026-09-16 when conversation local date advanced to September 17; files preserve measured system timestamps rather than rewriting them.

## 2026-09-17

- Full run `results/full-20260917T005031Z.json` was killed and is not a result. Every Django window at c=500, plus N-async `/cpu` at c=100 and E `/cpu` at c=500, failed warmup with "warmup failed: N non-2xx responses; N transport errors". Cause: bombardier's default 2 s request timeout, macOS `kern.ipc.somaxconn` at 128, and a fail-closed warmup. A saturated Django queue answers slower than 2 s, and the listen backlog drops connections. Fix: every bombardier call now passes `-t 180s`, the SIGKILL guard moved to duration + 240 s, and the run host got `sudo sysctl -w kern.ipc.somaxconn=4096` (resets on reboot; recorded in env as `somaxconn`).
- Two earlier attempts died from outside: once the laptop lid closed and the machine slept, once another Claude Code session killed the process tree. Harness v2 adds a contention gate (foreign CPU sampled once a second, window re-measured when the mean reaches 450 %, attempt kept under `contendedAttempts`), sleep detection by wall-clock gap over 10 s, and `RESUME=<old json>` to carry valid windows over after an interruption. Runs start under `caffeinate -dimsu`.

## 2026-09-18

- Full run `results/full-2026-09-18.json`, 09:29–12:18 local, status passed: 189/189 windows valid, 3 rounds × 3 configs × 7 routes × c=10/100/500. Eight contended attempts were discarded and re-measured. Sources, in the order they showed up: Spotlight indexing, Chrome and Arc, a bun script from a `miss` worktree session, supacode running `git diff` across `miss` worktrees, Raycast. The longest stall was about 15 minutes on E `/health` c=500 in round 3.
- E `/order` falls at c=500 in every round (18.1k, 20.3k, 14.5k success req/s against 26.0k, 26.6k, 19.8k at c=100). The drop repeats, so it is not one noisy window; round 3 is lower across the board for E `/order`, and that round ran while the machine was busiest. Not investigated further in this run.
- Summary: `results/full-2026-09-18-summary.md`. Noise floor and boot diagnostics exist only as quick runs; a full-duration noise run is still missing.
- Bombardier version string is still empty in env; the executable hash is recorded instead.
