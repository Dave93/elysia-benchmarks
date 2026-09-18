// Fail-closed benchmark runner. Importing this module does not run parity or start services.
import { selectConfigs, startServer, collectEnv, type ConfigSpec } from "./lib";
import { cases, bombardierArgs, type Case } from "./cases";
import { resetOrders } from "./db-reset";
import {
  parseBombardier, parseConcurrencies, rotate, selectNames, startTreeSampler,
  uniqueOutPath, createOutput, type ResourceRecord, type RunMetrics,
} from "./metrics";

export interface WindowRecord extends RunMetrics {
  command: string[]; stdout: string; stderr: string; exitCode: number;
  wallSeconds: number; startedAt: string; resources?: ResourceRecord;
}
export interface BenchmarkRun {
  round: number; config: string; case: string; concurrency: number;
  readyMs: number; warmup?: WindowRecord; measurement?: WindowRecord;
  valid: boolean; issues: string[];
}
export interface BenchmarkDocument {
  schemaVersion: 1; kind: "bench" | "noise"; status: "running" | "passed" | "failed";
  startedAt: string; finishedAt?: string; error?: string; env?: unknown; parity?: unknown;
  methodology: {
    quick: boolean; warmup: string; duration: string; repeats: number; concurrencies: number[];
    configs: { id: string; label: string; sensitivity: boolean; cmd: string[] }[];
    cases: string[]; roundOrders: string[][]; caveats: string[];
  };
  quickPreflight: BenchmarkRun[]; runs: BenchmarkRun[];
}

export function quickMode(value = process.env.BENCH_QUICK): boolean {
  if (value === undefined || value === "0") return false;
  if (value === "1") return true;
  throw new Error("BENCH_QUICK must be 0 or 1");
}

// bombardier's default per-request timeout is 2 s. A single-worker Django stack at c=500 queues past that,
// so every slow response became a transport error and the fail-closed warmup discarded the whole
// combination: the interrupted 2026-09-17 run had no valid Django window at c=500 at all. A slow answer
// is a measurement, not a failure; 180 s lets it be recorded as latency.
export const REQUEST_TIMEOUT_S = 180;

export async function runBombardier(c: Case, concurrency: number, duration: string): Promise<WindowRecord> {
  const command = ["bombardier", "-c", String(concurrency), "-d", duration, "-l", "-t", `${REQUEST_TIMEOUT_S}s`, "--print", "r", "--format", "json", ...bombardierArgs(c)];
  const startedAt = new Date().toISOString(), start = performance.now();
  let stdout = "", stderr = "", exitCode = -1;
  try {
    const proc = Bun.spawn(command, { stdout: "pipe", stderr: "pipe" });
    // A wedged client must not hang the entire run. Normal errors are retained, never retried away.
    // bombardier drains in-flight requests after the window closes, for up to the request timeout.
    const timeout = setTimeout(() => { proc.kill("SIGKILL"); }, (Number.parseFloat(duration) + REQUEST_TIMEOUT_S + 60) * 1000);
    try {
      [stdout, stderr, exitCode] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text(), proc.exited]);
    } finally { clearTimeout(timeout); }
  } catch (e) { stderr += String(e); }
  return { ...parseBombardier(stdout, exitCode), command, stdout, stderr, exitCode, startedAt, wallSeconds: (performance.now() - start) / 1000 };
}

/** One warmup and one measurement. Insert state is reset both before warmup and after
 * warmup. A failed warmup never becomes a valid measured window. */
export async function runWindow(pid: number, c: Case, concurrency: number, warmup: string, duration: string,
  record: BenchmarkRun, checkpoint: () => void): Promise<void> {
  try {
    if (c.name === "order") await resetOrders();
    record.warmup = await runBombardier(c, concurrency, warmup);
    checkpoint();
    if (!record.warmup.valid) throw new Error(`warmup failed: ${record.warmup.invalidReasons.join("; ")}`);
    if (c.name === "order") await resetOrders();
    const sampler = await startTreeSampler(pid);
    try { record.measurement = await runBombardier(c, concurrency, duration); }
    finally {
      const resources = await sampler.stop(); // join before shutdown or next window
      if (record.measurement) record.measurement.resources = resources;
    }
    const measured = record.measurement;
    record.issues.push(...measured.invalidReasons, ...measured.resources!.errors, ...measured.resources!.summary.issues);
    record.valid = measured.valid && measured.resources!.errors.length === 0 && measured.resources!.summary.valid;
  } catch (e) { record.issues.push(String(e)); record.valid = false; }
  checkpoint();
}

export interface BenchmarkOptions { kind?: "bench" | "noise"; configs?: ConfigSpec[]; repeats?: number; defaultCases?: string }
export async function runBenchmark(options: BenchmarkOptions = {}) {
  const kind = options.kind ?? "bench", quick = quickMode();
  const configs = options.configs ?? selectConfigs();
  if (!configs.length) throw new Error("no benchmark configurations selected");
  const selectedCases = selectNames(await cases(), process.env.CASES ?? options.defaultCases);
  const concurrencies = parseConcurrencies(process.env.CONC, quick ? [10] : kind === "noise" ? [100] : [10, 100, 500]);
  const repeats = options.repeats ?? (quick ? 1 : 3);
  if (!Number.isSafeInteger(repeats) || repeats < 1) throw new Error("repeats must be a positive integer");
  const warmup = quick ? "1s" : "5s", duration = quick ? "3s" : "30s";
  const output = createOutput(process.env.OUT ?? uniqueOutPath("results", kind));
  const result: BenchmarkDocument = {
    schemaVersion: 1, kind, status: "running", startedAt: new Date().toISOString(),
    methodology: {
      quick, warmup, duration, repeats, concurrencies,
      configs: configs.map((c) => ({ id: c.id, label: c.label, sensitivity: !!c.sensitivity, cmd: c.cmd })),
      cases: selectedCases.map((c) => c.name), roundOrders: [],
      caveats: [
        "Quick runs test plumbing only. Full benchmark automatically requires parity plus a recorded quick preflight before full windows.",
        "Successful RPS = req2xx / bombardier result.timeTakenSeconds; wallSeconds also includes client startup/exit.",
        "Latency includes timed attempts, including failures, not a success-only distribution. 2xx is the generator's status granularity; exact status/semantics checked by parity.",
        "Non-2xx includes others; transport errors overlap status buckets and must not be added to them. errorRate and transportErrorRate are separate rates over total status buckets.",
        "Process-tree RSS sums supervisor and workers and may double-count shared pages; CPU is coarse ps CPU-time deltas over the recorded sample span.",
        "Process churn or unavailable samples invalidate resource measurements. Very short-lived children between samples cannot be accounted for.",
        "Host 1/5/15-minute load averages are advisory context only, not foreign CPU, contention proof, or statistical significance.",
        "API, client and database share a laptop; no CPU affinity, cross-language causal attribution, or cloud cost extrapolation.",
        "CPU route uses different crypto bindings and must be reported separately from API/DB conclusions.",
        "No failed windows are silently retried or removed. Warmup is retained but excluded from summaries.",
        kind === "noise" ? "Five same-config process-start repetitions describe observed variability, not a universal noise floor or significance threshold." : "Repeats are outermost; configuration order rotates by one each round. Each configuration gets a fresh process each round.",
      ],
    }, quickPreflight: [], runs: [],
  };
  const checkpoint = () => output.save(result);
  const runRound = async (round: number, target: BenchmarkRun[], w: string, d: string, cs: number[]) => {
    for (const cfg of rotate(configs, round)) {
      const srv = await startServer(cfg);
      try {
        for (const c of selectedCases) for (const concurrency of cs) {
          const record: BenchmarkRun = { round: round + 1, config: cfg.id, case: c.name, concurrency, readyMs: srv.readyMs, valid: false, issues: [] };
          target.push(record); checkpoint();
          console.log(`${target === result.quickPreflight ? "preflight " : ""}round ${round + 1} ${cfg.id}/${c.name}/c=${concurrency}`);
          await runWindow(srv.pid, c, concurrency, w, d, record, checkpoint);
          console.log(record.valid ? `  ${record.measurement!.successRps!.toFixed(1)} successful req/s` : `  INVALID: ${record.issues.join("; ")}`);
        }
      } finally { await srv.stop(); }
    }
  };
  try {
    checkpoint();
    result.env = await collectEnv(); checkpoint();
    // Actual call, not a label or a stale parity.json check. Rejection prevents every warmup/measurement.
    const { verifyParity } = await import("./parity");
    const parity = await verifyParity(configs);
    if (!parity || parity.passed !== true) throw new Error("parity did not explicitly pass");
    result.parity = parity; checkpoint();
    if (!quick && kind === "bench") {
      await runRound(0, result.quickPreflight, "1s", "3s", [10]);
      if (result.quickPreflight.some((r) => !r.valid)) throw new Error("quick preflight failed; refusing full measurements");
    }
    for (let round = 0; round < repeats; round++) {
      result.methodology.roundOrders.push(rotate(configs, round).map((c) => c.id));
      await runRound(round, result.runs, warmup, duration, concurrencies);
    }
    if (result.runs.some((r) => !r.valid)) throw new Error("one or more benchmark windows failed; see recorded issues");
    result.status = "passed";
  } catch (e) { result.status = "failed"; result.error = String(e); throw e; }
  finally {
    result.finishedAt = new Date().toISOString();
    try { checkpoint(); } finally { output.close(); }
    console.log(`results: ${output.path} (${result.status})`);
  }
  return { path: output.path, result };
}
if (import.meta.main) await runBenchmark();
