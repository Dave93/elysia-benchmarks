import { SignJWT } from "jose";
import { DATABASE_URL } from "./database";

export interface ConfigSpec {
  id: string; label: string; cmd: string[]; env: Record<string, string>; sensitivity?: boolean;
}
const BASE_ENV = { NODE_ENV: "production", PORT: "3100", DATABASE_URL, PYTHONPATH: "apps/django-api", DJANGO_SETTINGS_MODULE: "config.settings", PYTHONHASHSEED: "0" };
const py = "apps/django-api/.venv/bin/python";
export const CONFIGS: ConfigSpec[] = [
  { id: "E", label: "Elysia / Bun / Drizzle + Bun SQL", cmd: ["bun", "apps/elysia-api/dist/index.js"], env: BASE_ENV },
  { id: "N-sync", label: "Django Ninja / Gunicorn gthread / Django ORM", cmd: [py, "-m", "gunicorn", "config.wsgi:application", "--bind", "127.0.0.1:3100", "--workers", "1", "--worker-class", "gthread", "--threads", "10", "--keep-alive", "5", "--timeout", "60", "--access-logfile", "/dev/null", "--log-level", "warning"], env: { ...BASE_ENV, API_MODE: "sync" } },
  { id: "N-async", label: "Django Ninja / Uvicorn uvloop httptools / Django async ORM interface", cmd: [py, "-m", "uvicorn", "config.asgi:application", "--host", "127.0.0.1", "--port", "3100", "--workers", "1", "--loop", "uvloop", "--http", "httptools", "--lifespan", "off", "--no-access-log", "--no-server-header", "--log-level", "warning"], env: { ...BASE_ENV, API_MODE: "async" } },
  { id: "H", label: "Hono / Bun / Drizzle + Bun SQL", cmd: ["bun", "apps/hono-api/dist/index.js"], env: BASE_ENV },
  { id: "H-mirror", label: "Hono / Bun / Drizzle + Bun SQL / exact-mirror cleaner", cmd: ["bun", "apps/hono-api/dist/index.js"], env: { ...BASE_ENV, HONO_CLEANER: "mirror" } },
  // Express 5.3.0, apps/express-api. X-bun differs from E in the framework only: same runtime, same Bun SQL
  // driver, same compiled TypeBox validator and exact-mirror cleaner.
  { id: "X-bun", label: "Express / Bun / Drizzle + Bun SQL", cmd: ["bun", "apps/express-api/dist/index.js"], env: BASE_ENV },
  // X-bun-pg and X-node run one file, dist-node/index.js, on one driver (postgres.js): they differ in the runtime
  // only. X-bun against X-bun-pg is the driver on Bun.
  { id: "X-bun-pg", label: "Express / Bun / Drizzle + postgres.js", cmd: ["bun", "apps/express-api/dist-node/index.js"], env: { ...BASE_ENV, DB_DRIVER: "postgresjs" } },
  { id: "X-node", label: "Express / Node / Drizzle + postgres.js", cmd: ["node", "apps/express-api/dist-node/index.js"], env: BASE_ENV },
  { id: "E-aot", label: "Elysia / Bun / AOT", cmd: ["bun", "apps/elysia-api/dist-aot/index.js"], env: BASE_ENV, sensitivity: true },
  // /cpu diagnostic only: Bun.SHA256.hash instead of node:crypto, same algorithm and output.
  { id: "E-native", label: "Elysia / Bun / Bun.SHA256 hasher", cmd: ["bun", "apps/elysia-api/dist/index.js"], env: { ...BASE_ENV, CPU_HASHER: "bun-native" }, sensitivity: true },
];
export function selectConfigs(): ConfigSpec[] {
  if (!process.env.CONFIGS) return CONFIGS.filter(c => !c.sensitivity);
  const ids = process.env.CONFIGS.split(",").map(s => s.trim());
  if (new Set(ids).size !== ids.length) throw new Error("Duplicate CONFIGS");
  return ids.map(id => { const cfg = CONFIGS.find(c => c.id === id); if (!cfg) throw new Error(`Unknown config ${id}`); return cfg; });
}
export const BASE_URL = "http://127.0.0.1:3100";
export const SECRET = "bench-secret-do-not-use-in-prod";
export const TOKEN = new SignJWT({}).setProtectedHeader({ alg: "HS256" }).setSubject("4242").setIssuedAt(0).sign(new TextEncoder().encode(SECRET));
export async function sh(cmd: string[], cwd?: string) {
  const p = Bun.spawn(cmd, { cwd, stdout: "pipe", stderr: "pipe" });
  const [out, err, exit] = await Promise.all([new Response(p.stdout).text(), new Response(p.stderr).text(), p.exited]);
  if (exit !== 0) throw new Error(`${cmd.join(" ")}: ${err}`);
  return out.trim();
}
export async function startServer(cfg: ConfigSpec) {
  // Refuse to accidentally measure an existing process at the shared port.
  const { createServer } = await import("node:net");
  await new Promise<void>((resolve, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.listen(3100, "127.0.0.1", () => probe.close(error => error ? reject(error) : resolve()));
  });
  const started = performance.now();
  const proc = Bun.spawn(cfg.cmd, { env: { ...process.env, ...cfg.env }, stdout: "ignore", stderr: "inherit" });
  const descendants = async (pid: number): Promise<number[]> => {
    let out = "";
    try { out = await sh(["pgrep", "-P", String(pid)]); } catch { /* no children */ }
    const kids = out ? out.split("\n").map(Number).filter(Number.isFinite) : [];
    return [...kids, ...(await Promise.all(kids.map(descendants))).flat()];
  };
  const stop = async () => {
    const tree = await descendants(proc.pid);
    const signal = (pid: number, sig: NodeJS.Signals) => { try { process.kill(pid, sig); } catch {} };
    tree.reverse().forEach(pid => signal(pid, "SIGTERM"));
    signal(proc.pid, "SIGTERM");
    const timer = setTimeout(() => [...tree, proc.pid].forEach(pid => signal(pid, "SIGKILL")), 3000);
    try { await proc.exited; } finally { clearTimeout(timer); }
    // A pre-fork master's exit may be observed before its workers release the listener.
    const deadline = Date.now() + 10000;
    while (Date.now() < deadline) {
      const listeners = Bun.spawn(["lsof", "-nP", "-iTCP:3100", "-sTCP:LISTEN", "-t"], { stdout: "pipe", stderr: "ignore" });
      const pids = (await new Response(listeners.stdout).text()).trim();
      await listeners.exited;
      if (!pids) { await Bun.sleep(100); return; }
      await Bun.sleep(100);
    }
    throw new Error(`${cfg.id}: listener survived shutdown; refusing next measurement`);
  };
  try {
    while (performance.now() - started < 15000) {
      if (proc.exitCode !== null) throw new Error(`${cfg.id} exited ${proc.exitCode} before readiness`);
      try {
        const r = await fetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(500) });
        if (r.status === 200 && (await r.json() as any).status === "ok") return { pid: proc.pid, readyMs: performance.now() - started, stop };
      } catch {}
      await Bun.sleep(20);
    }
    throw new Error(`${cfg.id}: readiness timeout`);
  } catch (error) { await stop(); throw error; }
}
export const mean = (xs: number[]) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
export function median(xs: number[]) { const s = [...xs].sort((a,b) => a-b), m = Math.floor(s.length/2); return s.length ? (s.length%2 ? s[m]! : (s[m-1]!+s[m]!)/2) : 0; }
export async function collectEnv() {
  const optional = async (cmd: string[]) => { try { return await sh(cmd); } catch { return "unavailable"; } };
  // The macOS fields below read "unavailable" on Linux; these are their Linux counterparts. The server's version
  // comes from the server itself: a client binary on PATH can be a different major than the fixture's Postgres.
  const linux = process.platform === "linux" ? {
    cpuModel: await optional(["sh", "-c", "grep -m1 'model name' /proc/cpuinfo | cut -d: -f2- | sed 's/^ *//'"]),
    logicalCpus: await optional(["nproc"]), kernel: await optional(["uname", "-r"]),
    os: await optional(["sh", "-c", ". /etc/os-release && echo \"$PRETTY_NAME\""]),
    cpuGovernor: await optional(["cat", "/sys/devices/system/cpu/cpu0/cpufreq/scaling_governor"]),
    netCoreSomaxconn: await optional(["cat", "/proc/sys/net/core/somaxconn"]),
    memTotal: await optional(["sh", "-c", "grep MemTotal /proc/meminfo"]),
  } : undefined;
  const { connect } = await import("./database");
  const postgresServer = await (async () => { const c = connect(); try { const [r] = await c`SELECT version() AS v`; return r.v as string; } catch (e) { return `unavailable: ${e}`; } finally { await c.end(); } })();
  return {
    linux, postgresServer, node: await optional(["node", "--version"]),
    date: new Date().toISOString(), bun: Bun.version, bunRevision: Bun.revision,
    cpu: await optional(["sysctl", "-n", "machdep.cpu.brand_string"]), cores: await optional(["sysctl", "-n", "hw.ncpu"]),
    macos: await optional(["sw_vers", "-productVersion"]), postgres: await optional(["psql", "--version"]),
    bombardier: await optional(["bombardier", "--version"]), python: await optional([py, "--version"]),
    // bombardier --version writes outside captured stdout, which left this field empty in earlier runs;
    // the binary's hash identifies the load generator exactly.
    bombardierSha256: await optional(["sh", "-c", "f=\"$(command -v bombardier)\"; { sha256sum \"$f\" 2>/dev/null || shasum -a 256 \"$f\"; } | cut -d' ' -f1"]),
    somaxconn: await optional(["sysctl", "-n", "kern.ipc.somaxconn"]),
    // Run conditions that change what a window can see; recorded so a reader never has to guess them.
    ordersAutovacuum: process.env.ORDERS_AUTOVACUUM ?? "default (on)",
    contentionGatePct: Number(process.env.CONTENTION ?? 450),
    honoManifest: await Bun.file("apps/hono-api/package.json").exists() ? await Bun.file("apps/hono-api/package.json").json() : null,
    expressManifest: await Bun.file("apps/express-api/package.json").exists() ? await Bun.file("apps/express-api/package.json").json() : null,
    pythonPackages: await optional(["uv", "pip", "freeze", "--python", py]),
    elysiaManifest: await Bun.file("apps/elysia-api/package.json").json(),
    locks: Object.fromEntries(await Promise.all(["bun.lock", "apps/elysia-api/bun.lock", "apps/hono-api/bun.lock", "apps/express-api/bun.lock", "apps/django-api/uv.lock"].map(async path => [path, await Bun.file(path).exists() ? new Bun.CryptoHasher("sha256").update(await Bun.file(path).arrayBuffer()).digest("hex") : null]))),
    configs: selectConfigs(),
    caveat: process.platform === "linux"
      ? "Same-host Linux desktop, API + Postgres + load generator on one machine; no CPU affinity or causal framework-only attribution"
      : "Same-host macOS laptop, API + Postgres + load generator; no CPU affinity or causal framework-only attribution",
  };
}
