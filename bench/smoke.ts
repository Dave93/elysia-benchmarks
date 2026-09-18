// bench/smoke.ts — one-shot short comparison, clearly labeled as a plumbing check, not a result.
// Usage: bun bench/smoke.ts
import { selectConfigs, startServer } from "./lib";
import { cases, bombardierArgs } from "./cases";
import { verifyParity } from "./parity";
import { resetOrders } from "./db-reset";
import { mkdirSync } from "node:fs";

const DURATION = process.env.SMOKE_DURATION ?? "5s";
const CONC = Number(process.env.SMOKE_CONC ?? 10);
const OUT = process.env.OUT ?? "results/smoke.json";
mkdirSync("results", { recursive: true });
if (await Bun.file(OUT).exists()) throw new Error(`${OUT} exists; refuse to overwrite`);

function parse(raw: string) {
  const r = JSON.parse(raw).result;
  return {
    seconds: r.timeTakenSeconds,
    successResponses: r.req2xx,
    httpFailures: r.req1xx + r.req3xx + r.req4xx + r.req5xx,
    transportOrUnknown: r.others,
    successRps: +(r.req2xx / r.timeTakenSeconds).toFixed(1),
    attemptedRps: +r.rps.mean.toFixed(1),
    latencyMs: { mean: +(r.latency.mean / 1000).toFixed(2), p50: +(r.latency.percentiles["50"] / 1000).toFixed(2), p99: +(r.latency.percentiles["99"] / 1000).toFixed(2) },
  };
}

const parity = await verifyParity(selectConfigs());
const results: any = { date: new Date().toISOString(), note: "plumbing smoke check, not a benchmark result", parity, duration: DURATION, concurrency: CONC, configs: {} };
for (const cfg of selectConfigs()) {
  const srv = await startServer(cfg);
  const cs = (await cases()).filter(c => !process.env.SMOKE_CASES || process.env.SMOKE_CASES.split(",").includes(c.name));
  try {
    results.configs[cfg.id] = { label: cfg.label, cases: {} };
    for (const c of cs) {
      if (c.name === "order") await resetOrders();
      const warm = Bun.spawn(["bombardier", "-c", String(CONC), "-d", DURATION, "-l", "--print", "r", "--format", "json", ...bombardierArgs(c)], { stdout: "pipe", stderr: "inherit" });
      const warmRaw = await new Response(warm.stdout).text();
      if (await warm.exited !== 0) throw new Error("Warmup process failed");
      const warmResult = parse(warmRaw);
      if (!warmResult.successResponses || warmResult.httpFailures || warmResult.transportOrUnknown) throw new Error("Warmup response errors");
      if (c.name === "order") await resetOrders();
      const p = Bun.spawn(["bombardier", "-c", String(CONC), "-d", DURATION, "-l", "--print", "r", "--format", "json", ...bombardierArgs(c)], { stdout: "pipe", stderr: "inherit" });
      const raw = await new Response(p.stdout).text();
      if (await p.exited !== 0) throw new Error(`bombardier failed on ${cfg.id}/${c.name}`);
      const parsed = parse(raw);
      const statusOK = parsed.successResponses > 0 && parsed.httpFailures === 0 && parsed.transportOrUnknown === 0;
      if (!statusOK) throw new Error(`${cfg.id}/${c.name}: failed response or transport error; smoke aborted`);
      results.configs[cfg.id].cases[c.name] = { ...parsed, raw };
    }
    console.log(`smoke ${cfg.id}: done`);
  } finally { await srv.stop(); await resetOrders(); }
}
await Bun.write(OUT, JSON.stringify(results, null, 2));
console.log("wrote", OUT);
