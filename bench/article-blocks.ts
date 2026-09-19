/**
 * Emit the JSON payloads the ShipKit blog article's interactive blocks consume,
 * from results/*.json — never from prose. Output: results/article-blocks/<name>.json.
 *
 * Aggregation copies bench/report.ts: median of VALID windows, success rps =
 * measurement.successRps, and the per-CPU-second figure is the median of
 * per-window quotients (successRps / cpuCores), not median rps / median cores.
 *
 * The shapes mirror the guards in shipkit_landing
 * (apps/web/components/blog/blocks/<name>.guard.ts).
 *
 *   bun bench/article-blocks.ts
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { median } from "./metrics";

const DIR = "results";
const V3 = JSON.parse(readFileSync(join(DIR, "full-2026-09-18b.json"), "utf8"));
const V2 = JSON.parse(readFileSync(join(DIR, "full-2026-09-18.json"), "utf8"));

type Run = {
  round: number; config: string; case: string; concurrency: number; valid: boolean;
  measurement: { successRps: number; latMs: { p50: number; p99: number }; startedAt: string; resources: { summary: { cpuCores: number | null } } };
};

const cell = (doc: { runs: Run[] }, config: string, kase: string, c: number) =>
  doc.runs.filter((r) => r.valid && r.config === config && r.case === kase && r.concurrency === c).sort((a, b) => a.round - b.round);
const med = (xs: number[]) => median(xs);
const r1 = (n: number) => Math.round(n * 10) / 10;
const r3 = (n: number) => Math.round(n * 1000) / 1000;

function stats(doc: { runs: Run[] }, config: string, kase: string, c: number) {
  const w = cell(doc, config, kase, c);
  if (w.length !== 3) throw new Error(`${config}/${kase}/c=${c}: ${w.length} valid windows`);
  return {
    rps: r1(med(w.map((x) => x.measurement.successRps))),
    perCpu: Math.round(med(w.map((x) => x.measurement.successRps / (x.measurement.resources.summary.cpuCores as number)))),
    // Unrounded medians, so ratios and spreads match derived-ratios.txt and the article.
    rpsExact: med(w.map((x) => x.measurement.successRps)),
    perCpuExact: med(w.map((x) => x.measurement.successRps / (x.measurement.resources.summary.cpuCores as number))),
    windowsExact: w.map((x) => x.measurement.successRps),
    cores: Math.round(med(w.map((x) => x.measurement.resources.summary.cpuCores as number)) * 100) / 100,
    p50: r3(med(w.map((x) => x.measurement.latMs.p50))),
    p99: r3(med(w.map((x) => x.measurement.latMs.p99))),
    windows: w.map((x) => Math.round(x.measurement.successRps)),
  };
}

const ROUTES = [
  { id: "me", label: "GET /me", db: true },
  { id: "user", label: "GET /users/:id", db: true },
  { id: "list", label: "GET /users (list)", db: true },
  { id: "order", label: "POST /orders", db: true },
  { id: "health", label: "GET /health", db: false },
  { id: "echo", label: "POST /echo", db: false },
];
const ratio = (a: number, b: number) => Math.round((a / b) * 100) / 100;
const deltaPct = (a: number, s: number) => r1((a / s - 1) * 100);

// 1. db-route-ratios
const C = 100;
const dbRouteRatios = {
  concurrency: C,
  routes: ROUTES.map((rt) => {
    const e = stats(V3, "E", rt.id, C), s = stats(V3, "N-sync", rt.id, C), a = stats(V3, "N-async", rt.id, C);
    return {
      id: rt.id, label: rt.label, db: rt.db,
      e: { rps: e.rps, perCpu: e.perCpu, cores: e.cores },
      sync: { rps: s.rps, perCpu: s.perCpu, cores: s.cores },
      async: { rps: a.rps, perCpu: a.perCpu, cores: a.cores },
      rawRatio: ratio(e.rpsExact, s.rpsExact),
      perCpuRatio: ratio(e.perCpuExact, s.perCpuExact),
    };
  }),
};

// 2. saturation-ladder
const ladder = [10, 100, 500].map((c) => {
  const s = stats(V3, "N-sync", "user", c), e = stats(V3, "E", "user", c);
  return { c, sync: { rps: s.rps, p50: s.p50, p99: s.p99 }, e: { rps: e.rps, p50: e.p50, p99: e.p99 } };
});
const saturationLadder = { route: "GET /users/:id", rows: ladder };

// 3. sync-vs-async. The article's rule: no claim inside N-async's worst
// round-to-round spread (range / median over the API cells).
const spreads: number[] = [];
for (const rt of ROUTES) for (const c of [10, 100, 500]) {
  const w = stats(V3, "N-async", rt.id, c).windowsExact;
  spreads.push(((Math.max(...w) - Math.min(...w)) / med(w)) * 100);
}
const floorPct = r1(Math.max(...spreads));
const syncVsAsync = {
  floorPct,
  routes: ROUTES.map((rt) => {
    const at = (c: number) => {
      const s = stats(V3, "N-sync", rt.id, c), a = stats(V3, "N-async", rt.id, c);
      const d = deltaPct(a.rpsExact, s.rpsExact);
      return { sync: s.rps, async: a.rps, deltaPct: d, claimed: Math.abs(d) > floorPct };
    };
    return { id: rt.id, label: rt.label, db: rt.db, c10: at(10), c500: at(500) };
  }),
};

// 4. orders-before-after. Checkpoint start times are copied from the Postgres
// server log (log_checkpoints=on, "checkpoint starting: wal"), local time UTC+5;
// v2 did not record checkpoints per window. A window is marked when a WAL
// checkpoint started within 10 s of its measured start.
const WAL_CHECKPOINTS = ["2026-09-18T09:48:07+05:00", "2026-09-18T11:06:16+05:00", "2026-09-18T11:07:03+05:00", "2026-09-18T11:45:36+05:00", "2026-09-18T11:46:39+05:00"].map((t) => Date.parse(t));
const windowsOf = (doc: { runs: Run[] }, c: number, marks: boolean) =>
  cell(doc, "E", "order", c).map((r) => {
    const start = Date.parse(r.measurement.startedAt);
    return {
      round: r.round,
      rps: Math.round(r.measurement.successRps),
      checkpoint: marks ? WAL_CHECKPOINTS.some((t) => Math.abs(t - start) <= 10_000) : false,
    };
  });
const ordersBeforeAfter = {
  runs: [
    { id: "v2", label: "v2 · no CHECKPOINT before windows", c100: windowsOf(V2, 100, true), c500: windowsOf(V2, 500, true), medianC500: r1(med(cell(V2, "E", "order", 500).map((r) => r.measurement.successRps))) },
    { id: "v3", label: "v3 · CHECKPOINT before every window", c100: windowsOf(V3, 100, false), c500: windowsOf(V3, 500, false), medianC500: r1(med(cell(V3, "E", "order", 500).map((r) => r.measurement.successRps))) },
  ],
  unexplained: { run: "v3", c: 500, round: 2 },
};
const marked = ordersBeforeAfter.runs[0]!.c100.concat(ordersBeforeAfter.runs[0]!.c500).filter((w) => w.checkpoint).length;
if (marked !== 5) throw new Error(`expected 5 checkpoint-aligned v2 windows, got ${marked}`);

const OUT = join(DIR, "article-blocks");
mkdirSync(OUT, { recursive: true });
for (const [name, payload] of Object.entries({
  "db-route-ratios": dbRouteRatios,
  "saturation-ladder": saturationLadder,
  "sync-vs-async": syncVsAsync,
  "orders-before-after": ordersBeforeAfter,
})) {
  writeFileSync(join(OUT, `${name}.json`), JSON.stringify(payload) + "\n");
  console.log(`${name}.json`, JSON.stringify(payload).length, "bytes");
}
