/**
 * Payloads for the interactive blocks in the Elysia vs Hono article, from the
 * result files only — never from prose. Output: results/article-blocks/<name>.json.
 *
 * Aggregation copies bench/report.ts, as bench/article-blocks.ts does for the
 * Django article: median of VALID windows, success rps = measurement.successRps.
 * Ratios are ratios of the unrounded medians; display values are rounded last.
 * Shapes mirror the guards in shipkit_landing
 * (apps/web/components/blog/blocks/<name>.guard.ts).
 *
 *   bun bench/article-blocks-hono.ts
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { median } from "./metrics";

const DIR = "results";
const load = (f: string) => JSON.parse(readFileSync(join(DIR, f), "utf8"));
const RECORD = load("full-hono3-2026-09-27.json");
const NOISE = load("noise-hono3-2026-09-27.json");

type Run = {
  round: number; config: string; case: string; concurrency: number; valid: boolean;
  measurement: { successRps: number };
};
type Doc = { runs: Run[]; status?: string; startedAt?: string };

const windows = (doc: Doc, config: string, kase: string, c: number) =>
  doc.runs
    .filter((r) => r.valid && r.config === config && r.case === kase && r.concurrency === c)
    .sort((a, b) => a.round - b.round);

function cell(doc: Doc, config: string, kase: string, c: number, expect = 3) {
  const w = windows(doc, config, kase, c);
  if (w.length !== expect) throw new Error(`${config}/${kase}/c=${c}: ${w.length} valid windows, expected ${expect}`);
  return { exact: median(w.map((x) => x.measurement.successRps)), byRound: new Map(w.map((x) => [x.round, x.measurement.successRps])) };
}

const r1 = (n: number) => Math.round(n * 10) / 10;
// Throughputs keep two decimals: rounding to one first and to an integer later
// turned 46,631.456 into 46,631.5 and then 46,632 in the block.
const r2 = (n: number) => Math.round(n * 100) / 100;
const r3 = (n: number) => Math.round(n * 1000) / 1000;
const CONC = [10, 100, 500];

const ROUTES = [
  { id: "health", label: "GET /health", validated: false, caveat: false },
  { id: "echo", label: "POST /echo", validated: true, caveat: false },
  { id: "me", label: "GET /me", validated: false, caveat: false },
  { id: "user", label: "GET /users/:id", validated: true, caveat: true },
  { id: "list", label: "GET /users (list)", validated: true, caveat: true },
  { id: "order", label: "POST /orders", validated: true, caveat: false },
  { id: "cpu", label: "GET /cpu", validated: true, caveat: false },
];

// framework-routes: E against H-mirror, the cleaner held constant.
const frameworkRoutes = {
  concurrencies: CONC,
  routes: ROUTES.map((r) => ({
    id: r.id,
    label: r.label,
    caveat: r.caveat,
    cells: CONC.map((c) => {
      const e = cell(RECORD, "E", r.id, c);
      const m = cell(RECORD, "H-mirror", r.id, c);
      let eWins = 0;
      for (const [round, v] of e.byRound) if (v > (m.byRound.get(round) ?? Infinity)) eWins++;
      return { concurrency: c, e: r2(e.exact), hm: r2(m.exact), ratio: r3(e.exact / m.exact), eWins, rounds: e.byRound.size };
    }),
  })),
};

// cleaner-swap: the two body routes, H (TypeBox Clean) vs H-mirror vs E.
const cleanerSwap = {
  concurrencies: CONC,
  routes: ["echo", "order"].map((id) => ({
    id,
    label: ROUTES.find((r) => r.id === id)!.label,
    cells: CONC.map((c) => {
      const h = cell(RECORD, "H", id, c).exact;
      const m = cell(RECORD, "H-mirror", id, c).exact;
      const e = cell(RECORD, "E", id, c).exact;
      return { concurrency: c, h: r2(h), hm: r2(m), e: r2(e), gainPct: r1((m / h - 1) * 100), costPct: r1((1 - h / m) * 100) };
    }),
  })),
};

// runs-thrown-away: what the same cell (E /health, c=100) read in each attempt.
const ATTEMPTS = [
  { id: "cron", file: "THROTTLED-full-hono-2026-09-24.json", label: "Started by cron", when: "2026-09-24 02:00",
    kept: false, cause: "cron scheduled the whole run as background work; every route ran about 3x slow" },
  { id: "day", file: "PREVIEW-full-hono-2026-09-24.json", label: "Daytime, by hand", when: "2026-09-24 09:00",
    kept: false, cause: "thermal throttling in round 1, 95-400% foreign CPU, spreads 7-40% on most cells, up to 86%" },
  { id: "validator", file: "full-hono-2026-09-27.json", label: "Quiet night", when: "2026-09-27 00:21",
    kept: false, cause: "machine clean, but our Hono app validated with interpreted TypeBox 0.34 while Elysia compiled 1.3" },
  { id: "record", file: "full-hono3-2026-09-27.json", label: "Run of record", when: "2026-09-27 11:13",
    kept: true, cause: "three configurations, same compiled validator, cleaner held constant in H-mirror; 189/189 windows valid" },
];
const runsThrownAway = {
  config: "E",
  route: "GET /health",
  concurrency: 100,
  attempts: ATTEMPTS.map((a) => {
    const doc = load(a.file) as Doc;
    const w = windows(doc, "E", "health", 100);
    return {
      id: a.id, label: a.label, when: a.when, kept: a.kept, cause: a.cause,
      rps: r2(median(w.map((x) => x.measurement.successRps))),
      windows: w.map((x) => Math.round(x.measurement.successRps)),
      status: doc.status ?? "unknown",
      valid: doc.runs.filter((r) => r.valid).length,
      total: doc.runs.length,
    };
  }),
};

// noise-floor (existing block): H, c=100, five back-to-back windows per route.
const noiseRuns = [["health", "GET /health"], ["user", "GET /users/:id"]].map(([id, route]) => ({
  route,
  values: NOISE.runs.filter((r: Run) => r.valid && r.config === "H" && r.case === id && r.concurrency === 100)
    .sort((a: Run, b: Run) => a.round - b.round).map((r: Run) => Math.round(r.measurement.successRps)),
}));
const spread = (v: number[]) => ((Math.max(...v) - Math.min(...v)) / Math.min(...v)) * 100;
const floorPct = r1(Math.max(...noiseRuns.map((r) => spread(r.values))));
const noiseFloor = {
  config: "H",
  concurrency: 100,
  seconds: 30,
  floorPct,
  runs: noiseRuns,
  bands: [{ id: "noise", to: floorPct }, { id: "small", to: 10 }, { id: "real", to: 20 }],
};

const OUT = join(DIR, "article-blocks");
mkdirSync(OUT, { recursive: true });
const blocks: Record<string, unknown> = {
  "framework-routes": frameworkRoutes,
  "cleaner-swap": cleanerSwap,
  "runs-thrown-away": runsThrownAway,
  "noise-floor-hono": noiseFloor,
};
for (const [name, body] of Object.entries(blocks)) {
  writeFileSync(join(OUT, `${name}.json`), JSON.stringify(body, null, 2) + "\n");
  console.log(`wrote ${join(OUT, `${name}.json`)}`);
}
