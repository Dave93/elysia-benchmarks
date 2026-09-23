#!/bin/zsh
# Overnight run for configuration H (Hono) against E (Elysia): noise floor on H,
# then the full matrix. Started from cron, so nothing about the shell can be
# assumed: PATH is set here in full, every precondition is checked before any
# load is generated, and the crontab line that started it removes itself on
# exit whether the run succeeded or not.
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
  echo "preflight OK: somaxconn=$smc, spotlight off, postgres up, :3100 free"
}

if [ "${1:-}" = "--check" ]; then
  preflight
  exit 0
fi

# The real run: remove our own crontab line on any exit.
trap '( crontab -l 2>/dev/null | grep -v "overnight-hono.sh" | crontab - ) || true' EXIT

exec >>"$LOG" 2>&1
echo "=== overnight-hono start $(date '+%Y-%m-%d %H:%M:%S %Z')"
preflight

# E runs from dist; db.ts gained a re-export of eq for the Hono twin on
# 2026-09-22, so both builds are refreshed from source before measuring.
(cd apps/elysia-api && bun run build) || fail "elysia build"
(cd apps/hono-api && bun run build) || fail "hono build"

echo "--- noise floor on H $(date '+%H:%M:%S')"
caffeinate -dimsu env CONFIGS=H OUT="results/noise-hono-$STAMP.json" bun bench/noise.ts \
  || echo "noise run exited non-zero; continuing to the matrix, the report will say so"

echo "--- full matrix E,H $(date '+%H:%M:%S')"
caffeinate -dimsu env CONFIGS=E,H OUT="results/full-hono-$STAMP.json" bun bench/bench.ts
rc=$?
echo "=== overnight-hono end rc=$rc $(date '+%Y-%m-%d %H:%M:%S %Z')"
exit $rc
