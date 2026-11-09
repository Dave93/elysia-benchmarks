// Linux process accounting straight from /proc. Two harness readings depend on it:
//
// - The foreign-CPU gate. procps `ps -o pcpu` on Linux is CPU time divided by the process's whole lifetime,
//   not current load (macOS ps reports a decaying recent average). A browser that burned a core an hour ago
//   would hold the gate shut, and a burst that began a second ago would barely register. The gate needs
//   utime+stime differenced over the sampling interval.
// - The server tree's CPU. procps prints `time` in whole seconds on Linux, so a 30 s window's CPU would be
//   off by up to a second per process. /proc counts in clock ticks (10 ms).
import { readdirSync, readFileSync } from "node:fs";

export const LINUX = process.platform === "linux";
const getconf = (name: string, fallback: number) => {
  try { const n = Number(new TextDecoder().decode(Bun.spawnSync(["getconf", name]).stdout).trim()); return n > 0 ? n : fallback; }
  catch { return fallback; }
};
export const CLK_TCK = LINUX ? getconf("CLK_TCK", 100) : 100;
export const PAGE_KB = LINUX ? getconf("PAGESIZE", 4096) / 1024 : 4;

export interface ProcRow { pid: number; ppid: number; ticks: number; rssKb: number; command: string }

/** Every process visible in /proc. A process that exits between readdir and read is skipped. */
export function procAll(withCommand = true): ProcRow[] {
  const rows: ProcRow[] = [];
  for (const name of readdirSync("/proc")) {
    if (!/^\d+$/.test(name)) continue;
    try {
      const stat = readFileSync(`/proc/${name}/stat`, "utf8");
      // comm (field 2) may contain spaces and parentheses; everything after the LAST ')' is space-separated.
      const close = stat.lastIndexOf(")");
      const f = stat.slice(close + 2).split(" ");
      // f[0] is field 3 (state): ppid = field 4, utime = 14, stime = 15, rss (pages) = 24.
      const command = withCommand
        ? (readFileSync(`/proc/${name}/cmdline`, "utf8").replace(/\0+/g, " ").trim() || `[${stat.slice(stat.indexOf("(") + 1, close)}]`)
        : "";
      rows.push({ pid: Number(name), ppid: Number(f[1]), ticks: Number(f[11]) + Number(f[12]), rssKb: Number(f[21]) * PAGE_KB, command });
    } catch { /* exited */ }
  }
  return rows;
}
