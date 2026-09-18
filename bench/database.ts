import postgres from "postgres";

// Never point the destructive seed/reset helpers at the previous benchmark or a remote DB.
export const DATABASE_URL = process.env.DATABASE_URL ?? "postgres://postgres@localhost:5432/bench_elysia_django";
export function assertFixtureDatabase(url = DATABASE_URL) {
  const u = new URL(url);
  if (!["localhost", "127.0.0.1", "[::1]"].includes(u.hostname) || u.pathname !== "/bench_elysia_django")
    throw new Error("Seed/reset allowed only on local bench_elysia_django");
  return u;
}
export const connect = () => { assertFixtureDatabase(); return postgres(DATABASE_URL, { max: 1 }); };
