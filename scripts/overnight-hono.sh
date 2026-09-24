#!/bin/zsh
# Overnight run for configuration H (Hono) against E (Elysia): noise floor on H,
# then the full matrix.
#
# START IT FROM LAUNCHD, NOT CRON. Measured 2026-09-24: the same 300k-hash loop
# takes 85 ms in a terminal, 227-246 ms when cron starts it, and 90 ms under a
# LaunchAgent with ProcessType=Interactive. cron's children are scheduled as
# background work on Apple Silicon, and `taskpolicy -B -p $$` from inside the
# job does not lift it (266 ms). The first overnight run went through cron and
# came out ~3x slow on every route for both frameworks. scripts/dev.davr.hono-overnight.plist
# is the agent; the preflight below measures the throttle directly and refuses
# to run under it, whatever launched the script.
#
#   scripts/overnight-hono.sh --check   # preconditions only, safe any time
#   scripts/overnight-hono.sh           # the real run, ~1.5-2 h
#
# Every trap here comes from results/friction-log.md (the Django run):
# somaxconn resets on reboot, a sleeping laptop kills windows, Spotlight and
# Chrome contaminate them. The harness's own foreign-CPU gate re-measures a
# contaminated window; this script only refuses to start on a known-bad host.

set -uo pipefail

export HOME=/Users/macbookpro
export PATH=/Users/macbookpro/.bun/bin:/Users/macbookpro/.local/bin:/opt/homebrew/opt/postgresql@17/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin

REPO=/Users/macbookpro/development/elysia_vs_django
STAMP=$(date +%Y-%m-%d)
LOG=$REPO/results/overnight-hono-$STAMP.log
cd "$REPO" || exit 1

fail() { echo "REFUSED: $*"; exit 2; }

preflight() {
  for t in bun bombardier psql pg_isready lsof caffeinate; do
    command -v $t >/dev/null || fail "$t not on PATH"
  done
  local smc; smc=$(sysctl -n kern.ipc.somaxconn)
  [ "$smc" -ge 4096 ] || fail "kern.ipc.somaxconn is $smc (a reboot resets it). Run: sudo sysctl -w kern.ipc.somaxconn=4096"
  mdutil -s / 2>/dev/null | grep -q "Indexing disabled" || fail "Spotlight indexing is on (sudo mdutil -a -i off)"
  pg_isready -q || fail "Postgres is not accepting connections"
  psql -U postgres -lqt | cut -d'|' -f1 | grep -qw bench_elysia_django || fail "database bench_elysia_django missing"
  lsof -ti tcp:3100 >/dev/null && fail "something already listens on :3100"
  [ -f apps/hono-api/dist/index.js ] || fail "apps/hono-api is not built"
  # The throttle check. A 300k-iteration SHA-256 loop runs in ~85 ms at full
  # speed and 230-440 ms when the process is scheduled as background work.
  local ms; ms=$(bun -e 'const {createHash}=require("node:crypto");const t=performance.now();let h="x";for(let i=0;i<300000;i++)h=createHash("sha256").update(h).digest("hex");console.log(Math.round(performance.now()-t))')
  [ "$ms" -le 150 ] || fail "throttled: hash self-test took ${ms} ms (full speed is ~85). Started from cron? Use the LaunchAgent."
  echo "preflight OK: somaxconn=$smc, spotlight off, postgres up, :3100 free, self-test ${ms} ms"
}

if [ "${1:-}" = "--check" ]; then
  preflight
  exit 0
fi

# A LaunchAgent with a calendar interval that missed its time (lid closed)
# fires on wake, which would put the run in the middle of Davron's morning.
# Only the small hours are quiet enough.
hour=$(date +%H)
# ANY_HOUR=1 is the manual override for a run started by hand from a terminal.
if [ -z "${ANY_HOUR:-}" ] && { [ "$hour" -lt 1 ] || [ "$hour" -ge 5 ]; }; then
  echo "=== $(date '+%F %T') refused: started at hour $hour, outside 01-05" >>"$LOG"
  exit 3
fi

# One-shot: unload the agent on any exit. `launchctl bootout` stops this job,
# so it is the very last thing the trap does.
AGENT=$HOME/Library/LaunchAgents/dev.davr.hono-overnight.plist
trap 'rm -f "$AGENT"; launchctl bootout gui/$(id -u)/dev.davr.hono-overnight 2>/dev/null || true' EXIT

exec >>"$LOG" 2>&1
echo "=== overnight-hono start $(date '+%Y-%m-%d %H:%M:%S %Z')"
preflight

# E runs from dist; db.ts gained a re-export of eq for the Hono twin on
# 2026-09-22, so both builds are refreshed from source before measuring.
(cd apps/elysia-api && bun run build) || fail "elysia build"
(cd apps/hono-api && bun run build) || fail "hono build"

echo "--- noise floor on H $(date '+%H:%M:%S')"
caffeinate -dimsu env CONFIGS=H CONTENTION=200 OUT="results/noise-hono-$STAMP.json" bun bench/noise.ts \
  || echo "noise run exited non-zero; continuing to the matrix, the report will say so"

echo "--- full matrix E,H $(date '+%H:%M:%S')"
# ORDERS_AUTOVACUUM=off and CONTENTION=200: see bench/db-reset.ts and the
# 2026-09-24 daytime entry in results/friction-log.md. Both are recorded in
# the result's env block; autovacuum is restored whatever the run's outcome.
caffeinate -dimsu env CONFIGS=E,H ORDERS_AUTOVACUUM=off CONTENTION=200 OUT="results/full-hono-$STAMP.json" bun bench/bench.ts
rc=$?
psql -U postgres -d bench_elysia_django -qc "ALTER TABLE orders RESET (autovacuum_enabled)" || echo "WARNING: could not restore autovacuum on orders"
echo "=== overnight-hono end rc=$rc $(date '+%Y-%m-%d %H:%M:%S %Z')"
exit $rc
