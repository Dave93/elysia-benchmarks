// bench/db-reset.ts — return orders to seed state between configs and remove the dead tuples the previous config left.
import { connect } from "./database";
export const SEED_ORDERS = 200_000;
export async function resetOrders() {
  const c = connect();
  await c`DELETE FROM orders WHERE id > ${SEED_ORDERS}`;
  await c`SELECT setval('orders_id_seq', ${SEED_ORDERS})`;
  await c.unsafe("VACUUM (FULL, ANALYZE) orders");
  await c.end();
}
export async function ordersStats() {
  const c = connect();
  const [r] = await c`SELECT n_live_tup::int AS live, n_dead_tup::int AS dead, pg_total_relation_size('orders')::bigint AS bytes FROM pg_stat_user_tables WHERE relname = 'orders'`;
  await c.end();
  return { live: r.live, dead: r.dead, bytes: Number(r.bytes) };
}
// Flush WAL before every measured window. Without it, checkpoints forced by max_wal_size landed in whichever
// window came after enough prior writes (E /order c=500 in all three rounds of the 2026-09-18 run), and the
// 5-minute timed checkpoint smeared its writes across random windows. CHECKPOINT also restarts that timer,
// so a 30 s window can only see a checkpoint its own writes force; that one is recorded, not avoided.
export async function flushWal() {
  const c = connect();
  await c`CHECKPOINT`;
  await c.end();
}
export async function checkpointCounts() {
  const c = connect();
  const [r] = await c`SELECT num_timed::int AS timed, num_requested::int AS requested FROM pg_stat_checkpointer`;
  await c.end();
  return { timed: r.timed as number, requested: r.requested as number };
}
