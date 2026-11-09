// The Express twin of apps/elysia-api/src/app.ts and apps/hono-api/src/app.ts.
//
// Held constant against Elysia: the routes, the schemas, the driver module
// (db.ts, auth.ts and cpu.ts are imported from apps/elysia-api, as the Hono
// app does), and the validation stack apps/elysia-api installs for Elysia
// 2.0.0-rc.4: compiled `typebox` 1.4.6 for checks, exact-mirror 1.2.7 for
// stripping unknown keys.
//
// What differs is Express 5.3.0 as `express()` ships: its router,
// `express.json()` (body-parser), the default "simple" query parser, and
// `res.json()` with Express's defaults left on (a weak ETag computed over every
// body, the X-Powered-By header). Underneath sits node:http, which is Node's
// own server under `node` and Bun's node:http layer under `bun`.
import express, { type NextFunction, type Request, type Response } from "express";
import Type, { type TSchema } from "typebox";
import { Compile } from "typebox/compile";
import { createMirror } from "exact-mirror";

import { db, schema, eq } from "../../elysia-api/src/db";
import { userIdFromAuthHeader } from "../../elysia-api/src/auth";
import { sha256Loop } from "../../elysia-api/src/cpu";

const t = Type;

const EchoBody = t.Object({
  name: t.String({ minLength: 1, maxLength: 100 }),
  email: t.String({ format: "email" }),
  age: t.Integer({ minimum: 0, maximum: 150 }),
  tags: t.Array(t.String(), { maxItems: 10 }),
});

const OrderBody = t.Object({
  userId: t.Integer({ minimum: 1 }),
  amount: t.Number({ minimum: 0 }),
  currency: t.Union([t.Literal("USD"), t.Literal("EUR"), t.Literal("GBP")]),
});

const UserParams = t.Object({ id: t.Integer({ minimum: 1 }) });
const ListQuery = t.Object({
  page: t.Integer({ minimum: 1, default: 1 }),
  limit: t.Integer({ minimum: 1, maximum: 100, default: 20 }),
});
const CpuQuery = t.Object({ n: t.Integer({ minimum: 1, maximum: 1_000_000 }) });

/**
 * What Elysia accepts across types, and nothing more. Copied from
 * apps/hono-api/src/app.ts, where it was measured against the running Elysia
 * app; the parity gate enforces it for every configuration:
 *
 * - a STRING may become an Integer only if it is an exact integer
 *   ("30" → 30 passes "coerced-age"; "1.5" fails `/cpu?n=1.5`);
 * - a STRING never becomes a Number (body `amount: "19.99"` → 422);
 * - a boolean never becomes a number ("bool-age"), and a number never becomes
 *   a string ("number-tag").
 */
function coercibleLikeElysia(s: any, input: unknown): boolean {
  if (!s || typeof s !== "object" || input === undefined || input === null) return true;
  switch (s.type) {
    case "integer":
      if (typeof input === "number") return Number.isInteger(input);
      if (typeof input === "string") return /^[+-]?\d+$/.test(input.trim());
      return false;
    case "number":
      return typeof input === "number";
    case "string":
      return typeof input === "string";
    case "boolean":
      return typeof input === "boolean" || input === "true" || input === "false";
  }
  if (s.properties && typeof input === "object" && !Array.isArray(input)) {
    return Object.keys(s.properties).every((k) => coercibleLikeElysia(s.properties[k], (input as any)[k]));
  }
  if (s.items && Array.isArray(input)) return input.every((x) => coercibleLikeElysia(s.items, x));
  return true;
}

// Express 5 makes req.query a getter that re-parses on every read, so the
// validated value travels on res.locals instead of replacing the input.
function tb<T extends TSchema>(target: "body" | "query" | "params", s: T) {
  const v = Compile(s);
  const clean = createMirror(s as any, { Compile } as any) as (x: unknown) => unknown;
  return (req: Request, res: Response, next: NextFunction) => {
    const input: unknown = req[target];
    if (v.Check(input)) { res.locals.valid = clean(input); return next(); }
    if (coercibleLikeElysia(s, input)) {
      const x = clean(v.Convert(v.Default(input)));
      if (v.Check(x)) { res.locals.valid = x; return next(); }
    }
    res.status(422).json({ error: "validation" });
  };
}

const serializeUser = (u: typeof schema.users.$inferSelect) => ({
  id: u.id, name: u.name, email: u.email, age: u.age, createdAt: u.createdAt.toISOString(),
});
const serializeOrder = (o: typeof schema.orders.$inferSelect) => ({
  id: o.id, userId: o.userId, amount: o.amount, currency: o.currency, createdAt: o.createdAt.toISOString(),
});

export const app = express();

app.use(express.json());

app.get("/health", (_req, res) => { res.json({ status: "ok" }); });

app.post("/echo", tb("body", EchoBody), (_req, res) => { res.json(res.locals.valid); });

app.get("/cpu", tb("query", CpuQuery), (_req, res) => {
  const { n } = res.locals.valid as { n: number };
  res.json({ n, hash: sha256Loop(n) });
});

app.get("/users/:id", tb("params", UserParams), async (_req, res) => {
  const { id } = res.locals.valid as { id: number };
  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
  if (u) res.json(serializeUser(u));
  else res.status(404).json({ error: "not found" });
});

app.get("/users", tb("query", ListQuery), async (_req, res) => {
  const { page, limit } = res.locals.valid as { page: number; limit: number };
  const rows = await db.select().from(schema.users).orderBy(schema.users.id)
    .limit(limit).offset((page - 1) * limit);
  res.json({ page, limit, items: rows.map(serializeUser) });
});

app.post("/orders", tb("body", OrderBody), async (_req, res) => {
  const b = res.locals.valid as { userId: number; amount: number; currency: string };
  const [o] = await db.insert(schema.orders)
    .values({ userId: b.userId, amount: b.amount.toFixed(2), currency: b.currency, createdAt: new Date() })
    .returning();
  res.status(201).json(serializeOrder(o));
});

app.get("/me", async (req, res) => {
  const userId = await userIdFromAuthHeader(req.get("authorization"));
  if (!userId) { res.status(401).json({ error: "unauthorized" }); return; }
  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  if (u) res.json(serializeUser(u));
  else res.status(404).json({ error: "not found" });
});

// Express 5 forwards a rejected async handler here. Nothing in the parity set
// should reach it; JSON keeps the contract's content type if something does.
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  res.status(err?.status ?? err?.statusCode ?? 500).json({ error: err?.type ?? "internal" });
});
