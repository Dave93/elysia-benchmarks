// bun bench/report.ts results/bench-....json [results/noise-....json results/boot-....json]
// Requires explicit inputs; never silently picks stale results or infers a winner.
import type { BenchmarkDocument, BenchmarkRun } from "./bench";
import type { BootDocument } from "./boot";
import { cv, median, spreadPct, uniqueOutPath, createOutput } from "./metrics";

const cell = (v: unknown) => String(v).replace(/\|/g, "\\|").replace(/[\r\n]+/g, " ");
const fmt = (v: number | null | undefined, places = 2) => typeof v === "number" && Number.isFinite(v) ? v.toFixed(places) : "—";
const med = (xs: (number | null | undefined)[]) => {
  const numbers = xs.filter((x): x is number => typeof x === "number" && Number.isFinite(x));
  return numbers.length ? median(numbers) : null;
};
// Successful requests per CPU-second the whole server tree spent, over the resource sample span. One Gunicorn
// worker with ten threads and one Bun process use cores differently; this is the per-core efficiency that
// survives "you only ran one worker", and it is null whenever the tree's CPU attribution was incomplete.
function perCpuSecond(x: { successRps?: number | null; resources?: { summary: { cpuCores: number | null } } }): number | null {
  const cores = x.resources?.summary.cpuCores;
  return x.successRps != null && cores != null && cores > 0 ? x.successRps / cores : null;
}

function table(runs: BenchmarkRun[]): string {
  const groups = new Map<string, BenchmarkRun[]>();
  for (const r of runs) {
    const key = `${r.config}\0${r.case}\0${r.concurrency}`;
    groups.set(key, [...groups.get(key) ?? [], r]);
  }
  const lines = [
    "| Config | Case | c | Valid / recorded | Success req/s | Success req per tree CPU-second | p50 ms | p99 ms | Mean tree RSS MiB | Tree CPU cores | Non-2xx incl. others | Transport errors (overlap) |",
    "|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|",
  ];
  for (const rs of groups.values()) {
    const r = rs[0], good = rs.filter((r) => r.valid && r.measurement?.valid);
    const m = good.map((r) => r.measurement!);
    const sumKnown = (key: "non2xx" | "transportErrors") => {
      const values = rs.map((r) => r.measurement?.[key]);
      const known = values.filter((v): v is number => typeof v === "number");
      return `${known.reduce((s, x) => s + x, 0)}${known.length < rs.length ? " + unknown" : ""}`;
    };
    lines.push(`| ${cell(r.config)} | ${cell(r.case)} | ${r.concurrency} | ${good.length}/${rs.length} | ${fmt(med(m.map((x) => x.successRps)), 1)} | ${fmt(med(m.map(perCpuSecond)), 0)} | ${fmt(med(m.map((x) => x.latMs.p50)))} | ${fmt(med(m.map((x) => x.latMs.p99)))} | ${fmt(med(m.map((x) => x.resources?.summary.rssMeanMb)))} | ${fmt(med(m.map((x) => x.resources?.summary.cpuCores)))} | ${sumKnown("non2xx")} | ${sumKnown("transportErrors")} |`);
  }
  return lines.join("\n");
}

export function renderReport(doc: BenchmarkDocument | BootDocument, source: string): string {
  if (doc.schemaVersion !== 1 || !["bench", "noise", "boot"].includes(doc.kind) || !Array.isArray(doc.runs)) throw new Error(`unsupported result schema: ${source}`);
  const lines = [
    `## ${cell(doc.kind)} — ${cell(source)}`, "",
    `Status: **${cell(doc.status)}**. Mode: **${doc.methodology.quick ? "quick — plumbing only" : "full-duration settings"}**. Started: ${cell(doc.startedAt)}.`,
    "", `Configured repeats: ${doc.methodology.repeats}. Recorded iterations/windows: ${doc.runs.length}.`, "",
    ...doc.methodology.configs.map((c) => `- **${cell(c.id)}**: ${cell(c.label)}`), "",
    `Parity evidence: ${(doc.parity as any)?.passed === true ? "passed in this invocation" : "no recorded pass — do not treat as benchmark evidence"}.`, "",
  ];
  if (doc.error) lines.push(`Failure: ${cell(doc.error)}`, "");
  if (doc.kind === "boot") {
    lines.push("Fresh-process boot only; OS and database caches were not flushed.", "", "| Config | Valid / recorded | Median ready ms | Median first DB ms |", "|---|---:|---:|---:|");
    for (const c of doc.methodology.configs) {
      const runs = doc.runs.filter((r) => r.config === c.id), good = runs.filter((r) => r.valid);
      lines.push(`| ${cell(c.id)} | ${good.length}/${runs.length} | ${fmt(med(good.map((r) => r.readyMs)))} | ${fmt(med(good.map((r) => r.firstReqMs)))} |`);
    }
    for (const r of doc.runs.filter((r) => !r.valid)) lines.push(`- Invalid ${cell(r.config)} round ${r.round}: ${cell(r.error ?? "incomplete")}`);
  } else {
    lines.push(`Warmup ${doc.methodology.warmup}; measured duration ${doc.methodology.duration}; concurrency ${doc.methodology.concurrencies.join(", ")}.`, "",
      "Numbers are medians of valid recorded windows, not pooled latency percentiles. Invalid/missing windows are explicitly excluded, not repaired; incomplete groups are not comparable.", "",
      "### API / database routes", "", table(doc.runs.filter((r) => r.case !== "cpu")), "");
    const cpu = doc.runs.filter((r) => r.case === "cpu");
    if (cpu.length) lines.push("### CPU / crypto route (separate diagnostic)", "", "Different crypto bindings prevent framework-only attribution.", "", table(cpu), "");
    if (doc.quickPreflight.length) lines.push(`Quick preflight: ${doc.quickPreflight.filter((r) => r.valid).length}/${doc.quickPreflight.length} valid; excluded from measured summary.`, "");
    const invalid = [...doc.quickPreflight, ...doc.runs].filter((r) => !r.valid);
    if (invalid.length) lines.push("### Failed / incomplete windows", "", ...invalid.map((r) => `- ${cell(r.config)}/${cell(r.case)}/c=${r.concurrency}, round ${r.round}: ${cell(r.issues.join("; ") || "incomplete")}`), "");
    if (doc.kind === "noise") {
      lines.push("### Observed same-config variability", "", "Population CV and (max−min)/min describe these samples only; neither is a significance threshold.", "");
      const groups = new Map<string, number[]>();
      for (const r of doc.runs) if (r.valid && r.measurement?.successRps != null) {
        const key = `${r.config}/${r.case}/c=${r.concurrency}`;
        groups.set(key, [...groups.get(key) ?? [], r.measurement.successRps]);
      }
      for (const [key, xs] of groups) lines.push(`- ${cell(key)}: n=${xs.length}, population CV=${fmt(cv(xs), 4)}, observed range/min=${fmt(spreadPct(xs))}%.`);
      lines.push("");
    }
    const load = doc.runs.flatMap((r) => r.measurement?.resources?.samples.map((s) => s.hostLoadAvg[0]) ?? []);
    if (load.length) lines.push(`Recorded host 1-minute load average: min ${fmt(Math.min(...load))}, median ${fmt(median(load))}, max ${fmt(Math.max(...load))}. Advisory only; no automatic contention/significance inference.`, "");
  }
  lines.push("### Limitations / recorded protocol", "", ...doc.methodology.caveats.map((s) => `- ${s}`), "",
    "Raw generator JSON, stdout/stderr, exit status and resource samples remain in the source JSON. A passing run does not establish causal framework speed, cost savings, or statistical significance.", "",
    "<details><summary>Recorded environment</summary>", "", "```json", JSON.stringify(doc.env ?? null, null, 2), "```", "", "</details>", "");
  return lines.join("\n");
}
export async function runReport(paths = process.argv.slice(2)) {
  if (!paths.length) throw new Error("usage: bun bench/report.ts <results.json> [noise.json] [boot.json]");
  const sections: string[] = [];
  for (const path of paths) sections.push(renderReport(await Bun.file(path).json(), path));
  const output = createOutput(process.env.OUT ?? uniqueOutPath("results", "report", "md"));
  try { output.save("# Elysia vs Django — recorded observations\n\n" + sections.join("\n---\n\n")); }
  finally { output.close(); }
  console.log(output.path);
  return output.path;
}
if (import.meta.main) await runReport();
