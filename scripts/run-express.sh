#!/usr/bin/env bash
# Elysia vs Express on Linux: the full matrix for E, X-bun, X-bun-pg and X-node, then a noise floor on E.
#
#   scripts/run-express.sh --check   # preconditions only, safe any time
#   scripts/run-express.sh           # the real run, about 3 h on a 4-core desktop
#
# The fixture Postgres is a throwaway container, not the host's own server:
#   docker run -d --name elysia-bench-pg17 --network host --shm-size=256m \
#     -e POSTGRES_HOST_AUTH_METHOD=trust -v elysia-bench-pg17:/var/lib/postgresql/data \
#     postgres:17-alpine -c port=5433 -c listen_addresses=127.0.0.1
#   DATABASE_URL=postgres://postgres@127.0.0.1:5433/bench_elysia_django bun run seed
# Host networking keeps docker-proxy out of the request path; listen_addresses keeps a trust-auth server off
# the LAN. Its backends show up in the host's /proc as "postgres: ... bench_elysia_django", which the
# foreign-CPU gate already counts as ours.

set -uo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
STAMP=$(date +%Y-%m-%d)
LOG=$REPO/results/run-express-$STAMP.log
cd "$REPO" || exit 1
export DATABASE_URL=${DATABASE_URL:-postgres://postgres@127.0.0.1:5433/bench_elysia_django}

fail() { echo "REFUSED: $*"; exit 2; }

preflight() {
  for t in bun node bombardier pg_isready lsof; do
    command -v $t >/dev/null || fail "$t not on PATH"
  done
  local host port; host=$(bun -e 'console.log(new URL(process.env.DATABASE_URL).hostname)'); port=$(bun -e 'console.log(new URL(process.env.DATABASE_URL).port || 5432)')
  pg_isready -q -h "$host" -p "$port" || fail "Postgres at $host:$port is not accepting connections"
  lsof -ti tcp:3100 >/dev/null && fail "something already listens on :3100"
  local smc; smc=$(cat /proc/sys/net/core/somaxconn)
  [ "$smc" -ge 4096 ] || fail "net.core.somaxconn is $smc; c=500 needs a listen backlog of at least 4096"
  [ -f apps/elysia-api/dist/index.js ] || fail "apps/elysia-api is not built"
  [ -f apps/express-api/dist/index.js ] && [ -f apps/express-api/dist-node/index.js ] || fail "apps/express-api is not built"
  echo "preflight OK: postgres $host:$port up, :3100 free, somaxconn=$smc, governor=$(cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor 2>/dev/null || echo n/a), $(bun --version) / node $(node --version)"
}

if [ "${1:-}" = "--check" ]; then
  preflight
  exit 0
fi

exec >>"$LOG" 2>&1
echo "=== run-express start $(date '+%Y-%m-%d %H:%M:%S %Z')"
preflight

(cd apps/elysia-api && bun run build) || fail "elysia build"
(cd apps/express-api && bun run build) || fail "express build"

echo "--- full matrix E,X-bun,X-bun-pg,X-node $(date '+%H:%M:%S')"
# ORDERS_AUTOVACUUM=off and CONTENTION=200 as in the Hono run of record (bench/db-reset.ts,
# results/friction-log.md 2026-09-24). Both are recorded in the result's env block.
env CONFIGS=E,X-bun,X-bun-pg,X-node ORDERS_AUTOVACUUM=off CONTENTION=200 OUT="results/full-express-$STAMP.json" bun bench/bench.ts
rc=$?

echo "--- noise floor on E $(date '+%H:%M:%S')"
env CONFIGS=E ORDERS_AUTOVACUUM=off CONTENTION=200 OUT="results/noise-express-$STAMP.json" bun bench/noise.ts \
  || echo "noise run exited non-zero; the report will say so"

bun -e 'import { connect } from "./bench/database"; const c = connect(); await c.unsafe("ALTER TABLE orders RESET (autovacuum_enabled)"); await c.end();' \
  || echo "WARNING: could not restore autovacuum on orders"
echo "=== run-express end rc=$rc $(date '+%Y-%m-%d %H:%M:%S %Z')"
exit $rc
