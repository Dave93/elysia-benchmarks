// Same-config repeatability, not a significance test. CONFIGS must select exactly one config.
import { selectConfigs } from "./lib";
import { runBenchmark } from "./bench";
import { cv, spreadPct } from "./metrics";

export async function runNoise() {
  const selected = selectConfigs();
  const configs = process.env.CONFIGS === undefined ? selected.slice(0, 1) : selected;
  if (configs.length !== 1) throw new Error("noise requires exactly one CONFIGS id");
  // Five repeats even in quick mode; quick only shortens windows and defaults to c=10.
  const output = await runBenchmark({ kind: "noise", configs, repeats: 5, defaultCases: "health,user" });
  const groups = new Map<string, number[]>();
  for (const run of output.result.runs) {
    if (!run.valid || run.measurement?.successRps == null) continue;
    const key = `${run.case}/c=${run.concurrency}`;
    groups.set(key, [...groups.get(key) ?? [], run.measurement.successRps]);
  }
  for (const [key, xs] of groups) console.log(`${key}: n=${xs.length}, population CV=${cv(xs)}, observed range/min %=${spreadPct(xs)}`);
  console.log("Observed variability only; not a universal noise floor, confidence interval, or significance threshold.");
  return output;
}
if (import.meta.main) await runNoise();
