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

- Full run `results/full-2026-09-18.json`, 09:29–12:18 local, status passed: 189/189 windows valid, 3 rounds × 3 configs × 7 routes × c=10/100/500. Eight contended attempts were discarded and re-measured. Sources, in the order they showed up: Spotlight indexing, Chrome and Arc, a bun script from another project's worktree session, a git client running `git diff` across that project's worktrees, Raycast. The longest stall was about 15 minutes on E `/health` c=500 in round 3.
- E `/order` falls at c=500 in every round (18.1k, 20.3k, 14.5k success req/s against 26.0k, 26.6k, 19.8k at c=100). The drop repeats, so it is not one noisy window; round 3 is lower across the board for E `/order`, and that round ran while the machine was busiest. Not investigated further in this run.
- Summary: `results/full-2026-09-18-summary.md`. Noise floor and boot diagnostics exist only as quick runs; a full-duration noise run is still missing.
- Bombardier version string is still empty in env; the executable hash is recorded instead.
- Spotlight indexing was switched off for good (`sudo mdutil -a -i off`) after it showed up as foreign load in the morning run.
- Full run v3 `results/full-2026-09-18b.json`, 21:00–23:14 local: 189/189 valid, zero contended attempts, zero checkpoints inside any measured window. With a CHECKPOINT before every window, E `/order` c=500 median is 27.6k success req/s (was 18.1k). One dip remains, round 2 at 20.2k with no checkpoint in the window; the cause is unknown and the median is unaffected.
- `/cpu` hasher diagnostic `results/cpu-hasher-2026-09-18.json`: new sensitivity config E-native uses `Bun.SHA256.hash` instead of `node:crypto` `createHash`, same chained hex algorithm, parity passed. Medians 527–529 against 204–209 success req/s, about 2.5×. E also burns 1.2 cores against 1.0 for E-native, which points to allocation and GC from a Hash object per iteration. Django `hashlib` measured 205–222 in the main run, so the "Django wins /cpu" reading only holds for Bun's Node-compatibility API. E stays on `node:crypto` for comparability with elysia-vs-nest.

## 2026-09-19

- Correction on the v2 `/order` diagnosis: the v2 run did not record `pgCheckpoints`. The checkpoint cause rests on the Postgres server log (`log_checkpoints = on`): the run had five `checkpoint starting: wal` events, each within seconds of an E `/order` measured window (09:48:07 vs 09:48:12; 11:06:16 vs 11:06:22; 11:07:03 vs 11:07:03; 11:45:36 vs 11:45:29; 11:46:39 vs 11:46:47, eight seconds early, during reset and warmup). Four of those five windows dipped: r1 c=500 18,136, r2 c=500 20,268, r3 c=100 19,795, r3 c=500 14,545 success req/s. The fifth, r2 c=100 at 26,589, was the highest c=100 window of the three. That is timing correlation, and the v3 rerun removing the dip supports it; neither is a per-window measurement.
- Per-route RSS in the summary tables reflects process history, not the route. Each configuration runs all 21 windows of a round in one process, in a fixed case order, so RSS climbs as a high-water mark: E in round 1 goes 65 MiB (`/health`) → 106 (`/me`) → 157 (`/list`) → 165 (`/cpu`), N-async 71 → 159 within `/health` alone, N-sync 84 → 103. In the hasher diagnostic, where E serves only `/cpu`, it sits at 71–77 MiB against 165 in the main table. Compare RSS only at matching positions in the sequence, or quote the round-level range.
- README, `docs/spec.md` and `docs/methodology.md` updated to name the run of record and state that Granian, multi-worker and equal-resource Linux lanes were not measured. Local home paths scrubbed from `results/authoritative-e2e.txt`.

## 2026-09-24 — cron ran the whole Hono matrix on background scheduling, ~3x slow

The first overnight run of `CONFIGS=E,H` (`results/full-hono-2026-09-24.json`,
126/126 windows valid, harness said "passed") is **not a run of record and must
not be quoted**. E's own numbers came out about a third of the Django run of
record on the same machine and the same code: `/health` c=100 46,632 against
138,992, `/users/:id` 11,914 against 33,432, `/cpu` 59 against 212. Both
configurations were slowed alike, and the tree used ~1.0 core in every window,
so the harness's CPU and contention gates saw nothing wrong.

Cause, measured the same morning with one 300k-iteration SHA-256 loop:
terminal 85 ms; started by cron 227 and 246 ms; `taskpolicy -b` 437 ms;
`taskpolicy -B -p $$` from inside the cron job 266 ms (does not lift it);
LaunchAgent with `ProcessType=Interactive` 90 ms. cron's children are scheduled
as background work on Apple Silicon. No low-power mode, no thermal warning.

The same-code `/cpu` route is why the file cannot be rescued by taking E/H
ratios: both sides call one `sha256Loop` from one module, yet H read 7% faster
on it at every concurrency. At ~60 req/s the framework is invisible on that
route, so the 7% is the scheduler, and it would be sitting inside every other
ratio too.

Fixes: `scripts/overnight-hono.sh` now runs a throttle self-test in preflight
and refuses above 150 ms; it is started by `scripts/dev.davr.hono-overnight.plist`,
not cron; it refuses to start outside 01:00-05:00 so a missed calendar fire on
wake cannot land in a working morning. A second defect in the cron version:
its self-removing `crontab -` failed with "Operation not permitted" (cron has
no permission to rewrite the crontab), so the line had to be removed by hand.
