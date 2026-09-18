// Pure metrics + process-tree sampling; no servers/DB and no side effects on import.
import { loadavg } from "node:os";
import { closeSync, ftruncateSync, fsyncSync, mkdirSync, openSync, writeSync } from "node:fs";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";

export const mean = (xs: number[]) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
export function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b), m = Math.floor(s.length / 2);
  return s.length ? s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2 : 0;
}
export const stddev = (xs: number[]) => Math.sqrt(mean(xs.map((x) => (x - mean(xs)) ** 2)));
export const cv = (xs: number[]) => mean(xs) ? stddev(xs) / mean(xs) : null;
export const spreadPct = (xs: number[]) => xs.length && Math.min(...xs) > 0
  ? 100 * (Math.max(...xs) - Math.min(...xs)) / Math.min(...xs) : null;

export function selectNames<T extends { name: string }>(all: T[], filter?: string): T[] {
  if (filter === undefined) return all;
  const names = filter.split(",").map((s) => s.trim());
  if (names.some((n) => !n || !all.some((c) => c.name === n)) || new Set(names).size !== names.length)
    throw new Error(`invalid CASES=${JSON.stringify(filter)}; choose unique names from ${all.map((c) => c.name).join(",")}`);
  return names.map((n) => all.find((c) => c.name === n)!);
}
export function parseConcurrencies(filter: string | undefined, defaults: number[]): number[] {
  if (filter === undefined) return defaults;
  const parts = filter.split(",").map((s) => s.trim());
  const xs = parts.map(Number);
  if (parts.some((p) => !/^[1-9]\d*$/.test(p)) || xs.some((n) => !Number.isSafeInteger(n)) || new Set(xs).size !== xs.length)
    throw new Error(`invalid CONC=${JSON.stringify(filter)}; expected unique positive integers`);
  return xs;
}
export function rotate<T>(xs: T[], round: number): T[] {
  if (!xs.length) return [];
  const offset = round % xs.length;
  return [...xs.slice(offset), ...xs.slice(0, offset)];
}

export interface RunMetrics {
  reportedRps: number | null;
  successRps: number | null;
  actualSeconds: number | null;
  req2xx: number | null;
  non2xx: number | null;
  transportErrors: number | null;
  errorRate: number | null; // non2xx / all status buckets (including others); errors overlap these buckets
  transportErrorRate: number | null; // errors[].count / all status buckets; never add to errorRate
  latMs: { mean: number | null; p50: number | null; p90: number | null; p95: number | null; p99: number | null; max: number | null };
  valid: boolean;
  invalidReasons: string[];
  raw: unknown;
}

/** Verified against codesenberg/bombardier templates.go (master, 2026-09-16):
 * result.timeTakenSeconds; optional errors:[{description,count}]; latency in microseconds.
 * https://github.com/codesenberg/bombardier/blob/master/templates.go
 * bombardier.go performSingleRequest always calls writeStatistics, even on errors:
 * transport failures enter `others` (code -1) AND errors[].count. Do not add the
 * latter to the status-bucket denominator/numerator; net/http body errors may even
 * overlap 2xx. TransportErrorRate is reported separately, and any error invalidates.
 */
export function parseBombardier(stdout: string, exitCode = 0): RunMetrics {
  const invalidReasons: string[] = [];
  let raw: unknown = null;
  try { raw = JSON.parse(stdout); } catch (e) { invalidReasons.push(`invalid JSON: ${e}`); }
  const r = (raw as any)?.result ?? {};
  const finite = (v: unknown): number | null => typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : null;
  const count = (v: unknown) => { const n = finite(v); return n !== null && Number.isSafeInteger(n) ? n : null; };
  const counts = [r.req1xx, r.req2xx, r.req3xx, r.req4xx, r.req5xx, r.others].map(count);
  const req2xx = counts[1];
  const non2xx = counts.some((x) => x === null) ? null : counts.reduce<number>((a, x, i) => a + (i === 1 ? 0 : x!), 0);
  if (counts.some((x) => x === null)) invalidReasons.push("missing/invalid HTTP request counts");
  let transportErrors: number | null = 0;
  if (r.errors !== undefined) {
    if (!Array.isArray(r.errors) || r.errors.some((e: any) => !e || typeof e.description !== "string" || count(e.count) === null)) {
      transportErrors = null;
      invalidReasons.push("invalid transport errors array");
    } else transportErrors = r.errors.reduce((sum: number, e: { count: number }) => sum + e.count, 0);
  }
  const seconds = finite(r.timeTakenSeconds);
  const actualSeconds = seconds !== null && seconds > 0 ? seconds : null;
  if (actualSeconds === null) invalidReasons.push("missing/invalid timeTakenSeconds");
  const usToMs = (v: unknown) => { const n = finite(v); return n === null ? null : n / 1000; };
  const latMs = {
    mean: usToMs(r.latency?.mean), p50: usToMs(r.latency?.percentiles?.["50"]),
    p90: usToMs(r.latency?.percentiles?.["90"]), p95: usToMs(r.latency?.percentiles?.["95"]),
    p99: usToMs(r.latency?.percentiles?.["99"]), max: usToMs(r.latency?.max),
  };
  if (Object.values(latMs).some((x) => x === null)) invalidReasons.push("missing/invalid latency metrics (requires -l)");
  const reportedRps = finite(r.rps?.mean);
  if (reportedRps === null) invalidReasons.push("missing/invalid reported rps");
  if (exitCode !== 0) invalidReasons.push(`bombardier exit ${exitCode}`);
  if (non2xx !== null && non2xx > 0) invalidReasons.push(`${non2xx} non-2xx responses`);
  if (transportErrors !== null && transportErrors > 0) invalidReasons.push(`${transportErrors} transport errors`);
  if (req2xx === 0) invalidReasons.push("no successful responses");
  const attempts = req2xx !== null && non2xx !== null ? req2xx + non2xx : null;
  if (attempts !== null && transportErrors !== null && transportErrors > attempts) invalidReasons.push("transport error counts exceed attempts");
  return {
    reportedRps, successRps: req2xx !== null && actualSeconds !== null ? req2xx / actualSeconds : null,
    actualSeconds, req2xx, non2xx, transportErrors,
    errorRate: attempts !== null && attempts > 0 ? non2xx! / attempts : null,
    transportErrorRate: attempts !== null && attempts > 0 && transportErrors !== null ? transportErrors / attempts : null,
    latMs, valid: !invalidReasons.length, invalidReasons, raw,
  };
}

export interface PsRow { pid: number; ppid: number; rssKb: number; cpuSeconds: number }
export interface TreeSample {
  atMs: number; elapsedMs: number; rssKb: number; cpuSeconds: number;
  processes: PsRow[]; hostLoadAvg: number[];
}
export interface ResourceRecord {
  samples: TreeSample[]; errors: string[];
  summary: ReturnType<typeof summarizeTree>;
}
export function parsePsTime(value: string): number {
  const m = value.match(/^(?:(\d+)-)?(?:(\d+):)?(\d+):(\d+(?:\.\d+)?)$/);
  if (!m) throw new Error(`invalid ps CPU time: ${value}`);
  return Number(m[1] ?? 0) * 86400 + Number(m[2] ?? 0) * 3600 + Number(m[3]) * 60 + Number(m[4]);
}
export function parsePsTree(output: string): Map<number, PsRow> {
  const rows = new Map<number, PsRow>();
  for (const line of output.split("\n")) {
    if (!line.trim()) continue;
    const parts = line.trim().split(/\s+/);
    if (parts.length !== 4 || parts.slice(0, 3).some((p) => !/^\d+$/.test(p))) throw new Error(`invalid ps row: ${line}`);
    const [pid, ppid, rssKb] = parts.slice(0, 3).map(Number);
    rows.set(pid, { pid, ppid, rssKb, cpuSeconds: parsePsTime(parts[3]) });
  }
  return rows;
}
export function treeSnapshot(rows: Map<number, PsRow>, rootPid: number): PsRow[] {
  if (!rows.has(rootPid)) throw new Error(`server root PID ${rootPid} missing`);
  const included = new Set([rootPid]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const row of rows.values()) if (included.has(row.ppid) && !included.has(row.pid)) { included.add(row.pid); changed = true; }
  }
  return [...included].map((pid) => rows.get(pid)!);
}
export function summarizeTree(samples: TreeSample[]) {
  const issues: string[] = [];
  let cpuSeconds = 0;
  if (samples.length < 2) issues.push("fewer than two process-tree samples");
  for (let i = 1; i < samples.length; i++) {
    const before = new Map(samples[i - 1].processes.map((p) => [p.pid, p]));
    const after = samples[i].processes;
    if (before.size !== after.length || after.some((p) => !before.has(p.pid))) issues.push("process-tree membership changed; CPU attribution incomplete");
    for (const p of after) {
      const prev = before.get(p.pid);
      if (!prev) continue; // do not count lifetime CPU of newly observed processes
      const delta = p.cpuSeconds - prev.cpuSeconds;
      if (delta < 0) issues.push("CPU counter regressed (exit/PID reuse)");
      else cpuSeconds += delta;
    }
  }
  const spanSeconds = samples.length > 1 ? (samples.at(-1)!.elapsedMs - samples[0].elapsedMs) / 1000 : 0;
  if (!(spanSeconds > 0)) issues.push("no positive resource sample span");
  const valid = issues.length === 0;
  return {
    rssMeanMb: samples.length ? mean(samples.map((s) => s.rssKb)) / 1024 : null,
    rssPeakMb: samples.length ? Math.max(...samples.map((s) => s.rssKb)) / 1024 : null,
    cpuSeconds: valid ? cpuSeconds : null,
    cpuCores: valid ? cpuSeconds / spanSeconds : null,
    spanSeconds, valid, issues: [...new Set(issues)],
  };
}
async function sampleTree(pid: number, origin: number): Promise<TreeSample> {
  const proc = Bun.spawn(["ps", "-axo", "pid=,ppid=,rss=,time="], { stdout: "pipe", stderr: "pipe" });
  const [out, err, exit] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text(), proc.exited]);
  if (exit !== 0) throw new Error(`ps exit ${exit}: ${err}`);
  const processes = treeSnapshot(parsePsTree(out), pid);
  return {
    atMs: Date.now(), elapsedMs: performance.now() - origin, processes,
    rssKb: processes.reduce((s, p) => s + p.rssKb, 0), cpuSeconds: processes.reduce((s, p) => s + p.cpuSeconds, 0),
    hostLoadAvg: loadavg(),
  };
}
/** Await initial baseline, then sample serially. stop cancels sleep, joins in-flight ps,
 * and takes a final snapshot. CPU is coarse ps CPU-time deltas, not lifetime %CPU. */
export async function startTreeSampler(pid: number, intervalMs = 500) {
  if (!(intervalMs > 0)) throw new Error("sample interval must be positive");
  const samples: TreeSample[] = [], errors: string[] = [], origin = performance.now();
  const capture = async () => { try { samples.push(await sampleTree(pid, origin)); } catch (e) { errors.push(String(e)); } };
  await capture();
  let active = true, wake: (() => void) | undefined;
  const loop = (async () => {
    while (active) {
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, intervalMs);
        wake = () => { clearTimeout(timer); resolve(); };
      });
      if (active) await capture();
    }
  })();
  let stopped: Promise<ResourceRecord> | undefined;
  return { stop: (): Promise<ResourceRecord> => stopped ??= (async () => {
    active = false; wake?.(); await loop; await capture();
    return { samples, errors, summary: summarizeTree(samples) };
  })() };
}

// Hold an exclusive descriptor throughout a run; checkpoints cannot clobber another run's OUT.
export function uniqueOutPath(dir: string, base: string, ext = "json"): string {
  return join(dir, `${base}-${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}.${ext}`);
}
export function createOutput(path: string) {
  mkdirSync(dirname(path), { recursive: true });
  const fd = openSync(path, "wx"); // EEXIST intentionally propagates, before parity/measurement
  let closed = false;
  return {
    path,
    save(data: unknown) {
      if (closed) throw new Error("output closed");
      const bytes = Buffer.from(typeof data === "string" ? data : JSON.stringify(data, null, 2) + "\n");
      let offset = 0;
      while (offset < bytes.length) offset += writeSync(fd, bytes, offset, bytes.length - offset, offset);
      ftruncateSync(fd, bytes.length); fsyncSync(fd);
    },
    close() { if (!closed) { closeSync(fd); closed = true; } },
  };
}
export function writeJsonExclusive(path: string, data: unknown): void {
  const output = createOutput(path);
  try { output.save(data); } finally { output.close(); }
}
