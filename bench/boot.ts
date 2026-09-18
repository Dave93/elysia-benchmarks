// Fresh process boot + first DB request; OS and DB caches are NOT cold.
import { BASE_URL, selectConfigs, startServer, collectEnv } from "./lib";
import { quickMode } from "./bench";
import { createOutput, uniqueOutPath, rotate, median } from "./metrics";

export interface BootDocument {
  schemaVersion: 1; kind: "boot"; status: "running" | "passed" | "failed";
  startedAt: string; finishedAt?: string; error?: string; env?: unknown; parity?: unknown;
  methodology: { quick: boolean; repeats: number; configs: { id: string; label: string }[]; caveats: string[] };
  runs: { round: number; config: string; readyMs: number | null; firstReqMs: number | null; status: number | null; valid: boolean; error?: string }[];
}
export async function runBoot() {
  const quick = quickMode(), repeats = quick ? 2 : 10, configs = selectConfigs();
  if (!configs.length) throw new Error("no boot configurations selected");
  const output = createOutput(process.env.OUT ?? uniqueOutPath("results", "boot"));
  const result: BootDocument = {
    schemaVersion: 1, kind: "boot", status: "running", startedAt: new Date().toISOString(),
    methodology: { quick, repeats, configs: configs.map(({ id, label }) => ({ id, label })), caveats: [
      "New process on each iteration, not cold OS/page/DB caches. Parity ran first and warms shared caches.",
      "Readiness includes spawn through successful health polling. First DB request is measured through full body read and validated, with a 10-second timeout.",
      "Config order rotates each round; no cross-language compilation/DX or cost claims.",
    ] }, runs: [],
  };
  try {
    output.save(result); result.env = await collectEnv();
    const { verifyParity } = await import("./parity");
    const parity = await verifyParity(configs);
    if (!parity || parity.passed !== true) throw new Error("parity did not explicitly pass");
    result.parity = parity; output.save(result);
    for (let round = 0; round < repeats; round++) for (const cfg of rotate(configs, round)) {
      const run: BootDocument["runs"][number] = { round: round + 1, config: cfg.id, readyMs: null, firstReqMs: null, status: null, valid: false };
      result.runs.push(run); output.save(result);
      let server: Awaited<ReturnType<typeof startServer>> | undefined;
      try {
        server = await startServer(cfg); run.readyMs = server.readyMs;
        const start = performance.now();
        const response = await fetch(`${BASE_URL}/users/4242`, { signal: AbortSignal.timeout(10_000) });
        const text = await response.text();
        run.firstReqMs = performance.now() - start; run.status = response.status;
        if (response.status !== 200) throw new Error(`first DB request returned ${response.status}: ${text.slice(0, 200)}`);
        const body = JSON.parse(text);
        if (body.id !== 4242 || body.email !== "user4242@example.com") throw new Error("first DB response semantics failed");
        run.valid = true;
      } catch (e) { run.error = String(e); }
      finally {
        try { if (server) await server.stop(); } finally { output.save(result); }
      }
    }
    if (result.runs.some((r) => !r.valid)) throw new Error("one or more boot iterations failed");
    result.status = "passed";
    for (const cfg of configs) {
      const runs = result.runs.filter((r) => r.config === cfg.id && r.valid);
      console.log(`${cfg.id}: boot median ${median(runs.map((r) => r.readyMs!)).toFixed(1)} ms; first DB median ${median(runs.map((r) => r.firstReqMs!)).toFixed(1)} ms`);
    }
  } catch (e) { result.status = "failed"; result.error = String(e); throw e; }
  finally {
    result.finishedAt = new Date().toISOString();
    try { output.save(result); } finally { output.close(); }
    console.log(`boot results: ${output.path} (${result.status})`);
  }
  return { path: output.path, result };
}
if (import.meta.main) await runBoot();
