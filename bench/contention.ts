// bench/contention.ts — foreign-CPU gate. The laptop running this benchmark is also someone's workstation;
// a browser tab or a linter in another project lands on some windows and not others. Rotation spreads that
// bias across configurations but cannot remove a burst that hits one 30 s window. So: wait for a quiet machine
// before each window, sample foreign CPU during it, and re-measure a window that was contended — keeping the
// contended attempt in the record, flagged, never silently discarded.

// Everything that is ours: the server process tree, this harness, bombardier, ps, and Postgres backends serving
// the fixture database. Excluding the whole server tree matters: Gunicorn and Uvicorn run a master plus workers,
// and counting our own workers as foreign load would re-run every window (a bug the Linux run of a sibling
// project hit and had to fix).
export const CONTENTION = Number(process.env.CONTENTION ?? 450); // % of one core, summed
export const MAX_CONTENDED_RETRIES = Number(process.env.MAX_CONTENDED_RETRIES ?? 50);
const DB_NAME = process.env.BENCH_DB ?? "bench_elysia_django";

interface PsLine { pid: number; ppid: number; pcpu: number; command: string }

async function psAll(): Promise<PsLine[]> {
  const p = Bun.spawn(["ps", "-Ao", "pid=,ppid=,pcpu=,command="], { stdout: "pipe", stderr: "ignore" });
  const out = await new Response(p.stdout).text(); await p.exited;
  const rows: PsLine[] = [];
  for (const line of out.split("\n")) {
    const m = line.trim().match(/^(\d+)\s+(\d+)\s+([\d.]+)\s+(.*)$/);
    if (m) rows.push({ pid: Number(m[1]), ppid: Number(m[2]), pcpu: Number(m[3]), command: m[4] });
  }
  return rows;
}

function descendants(rows: PsLine[], roots: number[]): Set<number> {
  const set = new Set(roots.filter((r) => r > 0));
  let changed = true;
  while (changed) {
    changed = false;
    for (const r of rows) if (set.has(r.ppid) && !set.has(r.pid)) { set.add(r.pid); changed = true; }
  }
  return set;
}

// Summed %CPU of every process that is not part of this benchmark. 100 = one core.
export async function foreignCpu(serverPid = 0): Promise<number> {
  const rows = await psAll();
  const ours = descendants(rows, [serverPid, process.pid]);
  let sum = 0;
  for (const r of rows) {
    if (ours.has(r.pid)) continue;
    if (/(^|\/)bombardier(\s|$)/.test(r.command)) continue;
    if (r.command.startsWith("postgres:") && r.command.includes(DB_NAME)) continue;
    sum += r.pcpu;
  }
  return sum;
}

export function startForeignSampler(serverPid: number, intervalMs = 1000) {
  const samples: number[] = []; let active = true;
  const loop = (async () => { while (active) { samples.push(await foreignCpu(serverPid)); await Bun.sleep(intervalMs); } })();
  return { stop: async () => { active = false; await loop; return samples; } };
}

export async function waitIdle(label: string, serverPid = 0): Promise<void> {
  for (;;) {
    const xs: number[] = [];
    for (let i = 0; i < 5; i++) { xs.push(await foreignCpu(serverPid)); await Bun.sleep(1000); }
    const m = xs.reduce((a, b) => a + b, 0) / xs.length;
    if (m < CONTENTION) return;
    console.log(`  [idle-gate] ${label}: foreign CPU ${m.toFixed(0)}% ≥ ${CONTENTION}%, waiting 30 s`);
    await Bun.sleep(30_000);
  }
}
