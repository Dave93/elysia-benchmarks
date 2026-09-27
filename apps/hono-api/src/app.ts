// The Hono twin of apps/elysia-api/src/app.ts.
//
// The point of this configuration is to isolate the FRAMEWORK: same runtime
// (Bun), same driver (Drizzle over Bun SQL), same JWT and hasher modules,
// imported from the Elysia app rather than copied so they cannot drift. Only
// the routing and validation layer differs.
//
// Validation is COMPILED, with the same library at the same version Elysia
// resolves: `typebox` 1.3.26, `Compile` from `typebox/compile`. That is also
// what Hono's own `@hono/typebox-validator` does. The 2026-09-27 run used the
// interpreted `Value.*` path of `@sinclair/typebox` 0.34 instead, which made
// every validated route a validator comparison rather than a framework one
// (results/friction-log.md). Wiring goes through `hono/validator`, the same
// middleware `tbValidator` is built on, so Hono's own validation overhead is
// paid as a Hono user pays it.
import { Hono } from "hono";
import { validator } from "hono/validator";
import Type, { type TSchema } from "typebox";
import { Compile } from "typebox/compile";

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
 * What Elysia accepts across types, and nothing more. Measured against the
 * running Elysia app on 2026-09-22 and enforced by the parity gate:
 *
 * - a STRING may become an Integer only if it is an exact integer
 *   ("30" → 30 passes "coerced-age"; "1.5" fails `/cpu?n=1.5`);
 * - a STRING never becomes a Number (body `amount: "19.99"` → 422);
 * - a boolean never becomes a number ("bool-age"), and a number never becomes
 *   a string ("number-tag").
 *
 * TypeBox's Convert is looser than all of that, so this walk runs first. It is
 * only consulted on the slow path; a body that already has the right types
 * goes straight through the compiled Check.
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

/**
 * A `hono/validator` middleware over a compiled schema — the shape of
 * `tbValidator`, plus Elysia's defaults and coercion so parity holds.
 * Fast path: already-valid input costs one compiled Check and a Clean (the
 * Clean strips unknown keys, parity's "extras" case, as `tbValidator` does with
 * `useClean`). Slow path, for strings from a query or a path: guard, Default,
 * Convert, Clean, Check.
 */
function tb<T extends TSchema>(target: "json" | "query" | "param", s: T) {
  const v = Compile(s);
  return validator(target, (input, c) => {
    if (v.Check(input)) return v.Clean(input) as any;
    if (coercibleLikeElysia(s, input)) {
      const x = v.Clean(v.Convert(v.Default(input)));
      if (v.Check(x)) return x as any;
    }
    return c.json({ error: "validation" }, 422);
  });
}

const serializeUser = (u: typeof schema.users.$inferSelect) => ({
  id: u.id, name: u.name, email: u.email, age: u.age, createdAt: u.createdAt.toISOString(),
});
const serializeOrder = (o: typeof schema.orders.$inferSelect) => ({
  id: o.id, userId: o.userId, amount: o.amount, currency: o.currency, createdAt: o.createdAt.toISOString(),
});

export const app = new Hono();

app.get("/health", (c) => c.json({ status: "ok" }));

app.post("/echo", tb("json", EchoBody), (c) => c.json(c.req.valid("json")));

app.get("/cpu", tb("query", CpuQuery), (c) => {
  const { n } = c.req.valid("query") as { n: number };
  return c.json({ n, hash: sha256Loop(n) });
});

// Registered before "/users" so the parameterised route is not shadowed.
app.get("/users/:id", tb("param", UserParams), async (c) => {
  const { id } = c.req.valid("param") as { id: number };
  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
  return u ? c.json(serializeUser(u)) : c.json({ error: "not found" }, 404);
});

app.get("/users", tb("query", ListQuery), async (c) => {
  const { page, limit } = c.req.valid("query") as { page: number; limit: number };
  const rows = await db.select().from(schema.users).orderBy(schema.users.id)
    .limit(limit).offset((page - 1) * limit);
  return c.json({ page, limit, items: rows.map(serializeUser) });
});

app.post("/orders", tb("json", OrderBody), async (c) => {
  const b = c.req.valid("json") as { userId: number; amount: number; currency: string };
  const [o] = await db.insert(schema.orders)
    .values({ userId: b.userId, amount: b.amount.toFixed(2), currency: b.currency, createdAt: new Date() })
    .returning();
  return c.json(serializeOrder(o), 201);
});

app.get("/me", async (c) => {
  const userId = await userIdFromAuthHeader(c.req.header("authorization"));
  if (!userId) return c.json({ error: "unauthorized" }, 401);
  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  return u ? c.json(serializeUser(u)) : c.json({ error: "not found" }, 404);
});
