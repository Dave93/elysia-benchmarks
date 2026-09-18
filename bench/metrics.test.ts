import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { renderReport } from "./report";
import type { BenchmarkDocument } from "./bench";
import {
  mean, median, stddev, cv, spreadPct, parseBombardier, parsePsTime, parsePsTree,
  treeSnapshot, summarizeTree, selectNames, parseConcurrencies, rotate, createOutput,
  startTreeSampler, type TreeSample,
} from "./metrics";

// Schema and units from upstream templates.go, NOT a recorded performance result.
const fixture = (changes: Record<string, unknown> = {}) => JSON.stringify({
  spec: { testType: "timed" }, extraPreserved: { value: true }, result: {
    timeTakenSeconds: 2.5, req1xx: 0, req2xx: 1000, req3xx: 0, req4xx: 0, req5xx: 0, others: 0,
    latency: { mean: 1200, max: 9000, percentiles: { "50": 1000, "75": 1500, "90": 3000, "95": 4000, "99": 6000 } },
    rps: { mean: 999 }, ...changes,
  },
});

describe("stats and strict selection", () => {
  test("stats don't mutate inputs; population dispersion is descriptive", () => {
    const xs = [4, 1, 3, 2];
    expect(mean(xs)).toBe(2.5); expect(median(xs)).toBe(2.5); expect(xs).toEqual([4, 1, 3, 2]);
    expect(median([9, 1, 3])).toBe(3); expect(stddev([1, 3])).toBe(1);
    expect(cv([1, 3])).toBe(0.5); expect(spreadPct([1, 3])).toBe(200);
    expect(cv([])).toBeNull(); expect(spreadPct([0, 1])).toBeNull();
  });
  test("unknown, empty and duplicate CASES reject", () => {
    const all = [{ name: "health" }, { name: "order" }];
    expect(selectNames(all, "order, health")).toEqual([all[1], all[0]]);
    for (const s of ["", "nope", "health,", "health,health"]) expect(() => selectNames(all, s)).toThrow();
  });
  test("CONC positive integer list only", () => {
    expect(parseConcurrencies(undefined, [10])).toEqual([10]);
    expect(parseConcurrencies("10, 100,500", [])).toEqual([10, 100, 500]);
    for (const s of ["", "0", "-1", "1.5", "NaN", "10,", "10,10", "1e2", "9007199254740992"]) expect(() => parseConcurrencies(s, [])).toThrow();
  });
  test("round rotation is deterministic and preserves config order input", () => {
    const configs = ["E", "N-sync", "N-async"];
    expect(rotate(configs, 1)).toEqual(["N-sync", "N-async", "E"]);
    expect(rotate(configs, 2)).toEqual(["N-async", "E", "N-sync"]);
    expect(rotate(configs, 3)).toEqual(configs);
  });
});
describe("bombardier schema, successful throughput and errors", () => {
  test("actual generator seconds and microsecond latency; raw entire JSON retained", () => {
    const r = parseBombardier(fixture());
    expect(r.valid).toBe(true); expect(r.successRps).toBe(400); expect(r.reportedRps).toBe(999);
    expect(r.actualSeconds).toBe(2.5); expect(r.latMs.mean).toBe(1.2); expect(r.latMs.p99).toBe(6);
    expect(r.transportErrors).toBe(0); expect(r.errorRate).toBe(0);
    expect(r.raw).toEqual(JSON.parse(fixture()));
  });
  test("HTTP and transport errors use real errors[].count without counting others twice", () => {
    const r = parseBombardier(fixture({ req2xx: 80, req3xx: 1, req4xx: 2, req5xx: 3, others: 4,
      errors: [{ description: "timeout", count: 7 }, { description: "dial refused", count: 3 }] }));
    expect(r.non2xx).toBe(10); expect(r.transportErrors).toBe(10); expect(r.errorRate).toBeCloseTo(10 / 90, 12);
    expect(r.transportErrorRate).toBeCloseTo(10 / 90, 12); expect(r.successRps).toBe(32); expect(r.valid).toBe(false);
  });
  test("transport-only failures counted in others are not added a second time", () => {
    const r = parseBombardier(fixture({ req2xx: 90, others: 10, errors: [{ description: "timeout", count: 10 }] }));
    expect(r.errorRate).toBe(0.1); expect(r.transportErrorRate).toBe(0.1);
    expect(r.successRps).toBe(36); expect(r.valid).toBe(false);
    const empty = parseBombardier(fixture({ req2xx: 0 }));
    expect(empty.errorRate).toBeNull(); expect(empty.transportErrorRate).toBeNull();
  });
  test("exit failure never becomes a valid window", () => {
    expect(parseBombardier(fixture(), 1).valid).toBe(false);
    expect(parseBombardier(fixture(), 1).invalidReasons).toContain("bombardier exit 1");
  });
  test("malformed, missing, zero, negative and unknown shapes fail closed", () => {
    const candidates = ["no JSON", "{}", "null", fixture({ timeTakenSeconds: 0 }), fixture({ timeTakenSeconds: undefined }),
      fixture({ req2xx: "1000" }), fixture({ req4xx: -1 }), fixture({ errors: { timeout: 5 } }),
      fixture({ errors: [{ description: "timeout", count: -2 }] }), fixture({ req2xx: 0 }), fixture({ latency: {} }),
      fixture({ req2xx: 1000, req4xx: 0, errors: [{ description: "timeout", count: 1001 }] })];
    for (const text of candidates) expect(parseBombardier(text).valid).toBe(false);
  });
});

describe("process tree CPU-time accounting", () => {
  test("ps duration formats", () => {
    expect(parsePsTime("00:03.25")).toBe(3.25);
    expect(parsePsTime("12:34.50")).toBe(754.5);
    expect(parsePsTime("01:02:03")).toBe(3723);
    expect(parsePsTime("2-01:02:03")).toBe(176523);
    expect(() => parsePsTime("garbage")).toThrow();
  });
  test("includes supervisor, worker and grandchildren but excludes unrelated processes", () => {
    const rows = parsePsTree("10 1 1024 00:01.00\n11 10 2048 00:02.00\n12 11 4096 00:03.00\n99 1 9000 00:50.00\n");
    expect(treeSnapshot(rows, 10).map((p) => p.pid)).toEqual([10, 11, 12]);
    expect(() => treeSnapshot(rows, 500)).toThrow();
    expect(() => parsePsTree("malformed row")).toThrow();
  });
  const sample = (elapsedMs: number, times: [number, number]): TreeSample => ({
    atMs: elapsedMs, elapsedMs, rssKb: 3072, cpuSeconds: times[0] + times[1], hostLoadAvg: [0, 0, 0],
    processes: [{ pid: 10, ppid: 1, rssKb: 1024, cpuSeconds: times[0] }, { pid: 11, ppid: 10, rssKb: 2048, cpuSeconds: times[1] }],
  });
  test("delta CPU excludes lifetime startup time and uses actual sample span", () => {
    const summary = summarizeTree([sample(0, [10, 20]), sample(2000, [10.5, 22])]);
    expect(summary.valid).toBe(true); expect(summary.cpuSeconds).toBe(2.5);
    expect(summary.cpuCores).toBe(1.25); expect(summary.rssMeanMb).toBe(3);
  });
  test("process churn/regressions and insufficient data invalidate CPU instead of inventing it", () => {
    const changed = sample(2000, [11, 22]); changed.processes[1].pid = 12;
    expect(summarizeTree([sample(0, [10, 20]), changed]).cpuCores).toBeNull();
    expect(summarizeTree([sample(0, [10, 20]), sample(2000, [0, 21])]).valid).toBe(false);
    expect(summarizeTree([]).valid).toBe(false);
  });
  test("sampler stop joins and is idempotent (only samples this test process)", async () => {
    const sampler = await startTreeSampler(process.pid, 10_000);
    const a = sampler.stop(), b = sampler.stop();
    expect(a).toBe(b);
    const result = await a, count = result.samples.length;
    await Bun.sleep(20);
    expect(result.samples.length).toBe(count);
    expect(result.samples.length + result.errors.length).toBeGreaterThanOrEqual(2);
  });
});

test("report marks failed evidence without inventing performance numbers", () => {
  const doc: BenchmarkDocument = {
    schemaVersion: 1, kind: "bench", status: "failed", startedAt: "fixture", error: "parity failed",
    methodology: { quick: true, repeats: 1, warmup: "1s", duration: "3s", concurrencies: [10],
      configs: [{ id: "E", label: "test", sensitivity: false, cmd: [] }], cases: ["health"], roundOrders: [], caveats: [] },
    runs: [], quickPreflight: [],
  };
  const markdown = renderReport(doc, "fixture.json");
  expect(markdown).toContain("**failed**"); expect(markdown).toContain("plumbing only");
  expect(markdown).toContain("no recorded pass"); expect(markdown).toContain("parity failed");
  expect(markdown).not.toContain("NaN");
});

test("exclusive output refuses overwrite while supporting checkpoints", () => {
  const dir = mkdtempSync(join(process.env.TMPDIR ?? "/private/var/folders/y8/44f2gd512jj2d_46xj7xvvlr0000gp/T/opencode", "bench-metrics-"));
  try {
    const path = join(dir, "run.json"), out = createOutput(path);
    try {
      out.save({ longer: "initial record" });
      expect(() => createOutput(path)).toThrow();
      out.save({ ok: true });
      expect(JSON.parse(readFileSync(path, "utf8"))).toEqual({ ok: true });
    } finally { out.close(); }
    expect(() => createOutput(path)).toThrow();
  } finally { rmSync(dir, { recursive: true }); }
});
