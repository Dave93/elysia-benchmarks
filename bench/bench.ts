// Fail-closed benchmark runner. Importing this module does not run parity or start services.
import { selectConfigs, startServer, collectEnv, type ConfigSpec } from "./lib";
import { CONTENTION, MAX_CONTENDED_RETRIES, SLEEP_GAP_MS, startForeignSampler, waitIdle } from "./contention";
import { cases, bombardierArgs, type Case } from "./cases";
import { resetOrders, flushWal, checkpointCounts } from "./db-reset";
import {
  parseBombardier, parseConcurrencies, rotate, selectNames, startTreeSampler,
  uniqueOutPath, createOutput, type ResourceRecord, type RunMetrics,
} from "./metrics";

export interface WindowRecord extends RunMetrics {
  command: string[]; stdout: string; stderr: string; exitCode: number;
  wallSeconds: number; startedAt: string; resources?: ResourceRecord;
  foreignCpu?: { mean: number; peak: number; samples: number[]; maxGapMs: number };
  // Postgres checkpoints that began during the window (after a CHECKPOINT issued just before it).
  pgCheckpoints?: { timed: number; requested: number };
}
export interface BenchmarkRun {
  round: number; config: string; case: string; concurrency: number;
  readyMs: number; warmup?: WindowRecord; measurement?: WindowRecord;
  // Attempts measured while foreign CPU was at or above the gate. Kept, flagged, never counted.
  contendedAttempts?: WindowRecord[];
  valid: boolean; issues: string[];
}
export interface BenchmarkDocument {
  schemaVersion: 1; kind: "bench" | "noise"; status: "running" | "passed" | "failed";
  startedAt: string; finishedAt?: string; error?: string; env?: unknown; parity?: unknown;
  methodology: {
    quick: boolean; warmup: string; duration: string; repeats: number; concurrencies: number[];
    configs: { id: string; label: string; sensitivity: boolean; cmd: string[] }[];
    cases: string[]; roundOrders: string[][]; caveats: string[];
    harnessVersion?: number; resumedFrom?: { path: string; startedAt: string; carriedValidWindows: number; priorEnv: unknown };
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
// Bump whenever a change alters what a window measures. RESUME refuses to splice documents across versions:
// v2 = 180 s request timeout + foreign-CPU contention gate + sleep detection.
// v3 = CHECKPOINT before every warmup and measurement, in-window checkpoint counts recorded.
export const HARNESS_VERSION = 3;

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
  const label = `${record.config}/${c.name}/c=${concurrency}`;
  try {
    await waitIdle(label, pid);
    if (c.name === "order") await resetOrders();
    await flushWal();
    record.warmup = await runBombardier(c, concurrency, warmup);
    checkpoint();
    if (!record.warmup.valid) throw new Error(`warmup failed: ${record.warmup.invalidReasons.join("; ")}`);
    let contendedExhausted = false;
    for (let attempt = 0; ; attempt++) {
      if (c.name === "order") await resetOrders();
      await flushWal();
      const cpBefore = await checkpointCounts();
      const sampler = await startTreeSampler(pid);
      const foreign = startForeignSampler(pid);
      let measured: WindowRecord | undefined;
      try { measured = await runBombardier(c, concurrency, duration); }
      finally {
        const resources = await sampler.stop(); // join before shutdown or next window
        const { samples: fcpu, maxGapMs } = await foreign.stop();
        const cpAfter = await checkpointCounts();
        if (measured) {
          measured.pgCheckpoints = { timed: cpAfter.timed - cpBefore.timed, requested: cpAfter.requested - cpBefore.requested };
          measured.resources = resources;
          measured.foreignCpu = { mean: fcpu.length ? fcpu.reduce((a, b) => a + b, 0) / fcpu.length : 0, peak: Math.max(0, ...fcpu), samples: fcpu, maxGapMs };
        }
      }
      const fmean = measured!.foreignCpu!.mean, slept = measured!.foreignCpu!.maxGapMs > SLEEP_GAP_MS;
      if ((fmean >= CONTENTION || slept) && attempt < MAX_CONTENDED_RETRIES) {
        (record.contendedAttempts ??= []).push(measured!);
        console.log(slept
          ? `  [slept] ${(measured!.foreignCpu!.maxGapMs / 1000).toFixed(0)} s gap in sampling — the machine slept during the window, re-measuring (${attempt + 1}/${MAX_CONTENDED_RETRIES})`
          : `  [contended] foreign CPU ${fmean.toFixed(0)}% ≥ ${CONTENTION}% — re-measuring (${attempt + 1}/${MAX_CONTENDED_RETRIES})`);
        checkpoint();
        await waitIdle(label, pid);
        continue;
      }
      record.measurement = measured!;
      if (fmean >= CONTENTION || slept) {
        contendedExhausted = true;
        record.issues.push(`still contended after ${MAX_CONTENDED_RETRIES} re-measurements: foreign CPU ${fmean.toFixed(0)}% ≥ ${CONTENTION}%`);
      }
      break;
    }
    const measured = record.measurement!;
    record.issues.push(...measured.invalidReasons, ...measured.resources!.errors, ...measured.resources!.summary.issues);
    record.valid = measured.valid && measured.resources!.errors.length === 0 && measured.resources!.summary.valid && !contendedExhausted;
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
  // RESUME=<earlier results file> continues an interrupted run: every valid window it recorded is carried
  // over and skipped, so a lid close or a stray kill costs one window instead of hours. Only an identical
  // matrix measured by the same harness version can be resumed.
  const prior: BenchmarkDocument | undefined = process.env.RESUME ? JSON.parse(await Bun.file(process.env.RESUME).text()) : undefined;
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
        `Foreign CPU is sampled once a second during every measured window and must average below ${CONTENTION}% (100% = one core); the harness also waits for that before each window. Host load averages remain advisory context only.`,
        "API, client and database share a laptop; no CPU affinity, cross-language causal attribution, or cloud cost extrapolation.",
        "CPU route uses different crypto bindings and must be reported separately from API/DB conclusions.",
        "Postgres runs CHECKPOINT before every warmup and measured window, so checkpoints left over from earlier windows cannot land in this one; a checkpoint the window's own writes force is kept and counted under pgCheckpoints.",
        "No failed window is retried or removed. A window measured while foreign CPU (every process outside the server tree, this harness, bombardier and the fixture's Postgres backends) averaged at or above the contention gate is re-measured after the machine is quiet again; the contended attempt stays in the record under contendedAttempts and never enters a summary. Warmup is retained but excluded from summaries.",
        kind === "noise" ? "Five same-config process-start repetitions describe observed variability, not a universal noise floor or significance threshold." : "Repeats are outermost; configuration order rotates by one each round. Each configuration gets a fresh process each round.",
      ],
    }, quickPreflight: [], runs: [],
  };
  result.methodology.harnessVersion = HARNESS_VERSION;
  if (prior) {
    const pm = prior.methodology as any, m = result.methodology as any;
    const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
    const mismatch = [
      pm.harnessVersion !== HARNESS_VERSION && `harness version ${pm.harnessVersion ?? "none"} ≠ ${HARNESS_VERSION}`,
      prior.kind !== kind && "kind",
      !same(pm.quick, m.quick) && "quick", !same(pm.warmup, m.warmup) && "warmup", !same(pm.duration, m.duration) && "duration",
      !same(pm.repeats, m.repeats) && "repeats", !same(pm.concurrencies, m.concurrencies) && "concurrencies",
      !same(pm.cases, m.cases) && "cases", !same(pm.configs, m.configs) && "configs",
    ].filter(Boolean);
    if (mismatch.length) throw new Error(`RESUME refused: ${process.env.RESUME} differs in ${mismatch.join(", ")}`);
    result.runs = prior.runs.filter((r) => r.valid);
    if (prior.quickPreflight.length && prior.quickPreflight.every((r) => r.valid)) result.quickPreflight = prior.quickPreflight;
    m.resumedFrom = { path: process.env.RESUME, startedAt: prior.startedAt, carriedValidWindows: result.runs.length, priorEnv: prior.env };
    console.log(`resuming from ${process.env.RESUME}: ${result.runs.length} valid windows carried over`);
  }
  const done = (round: number, cfg: string, c: string, conc: number) =>
    result.runs.some((r) => r.valid && r.round === round && r.config === cfg && r.case === c && r.concurrency === conc);
  const checkpoint = () => output.save(result);
  const runRound = async (round: number, target: BenchmarkRun[], w: string, d: string, cs: number[]) => {
    for (const cfg of rotate(configs, round)) {
      const resumable = target === result.runs;
      if (resumable && selectedCases.every((c) => cs.every((conc) => done(round + 1, cfg.id, c.name, conc)))) continue;
      const srv = await startServer(cfg);
      try {
        for (const c of selectedCases) for (const concurrency of cs) {
          if (resumable && done(round + 1, cfg.id, c.name, concurrency)) continue;
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
    if (!quick && kind === "bench" && !(result.quickPreflight.length && result.quickPreflight.every((r) => r.valid))) {
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
