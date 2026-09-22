// The Hono twin of apps/elysia-api/src/app.ts.
//
// The point of this configuration is to isolate the FRAMEWORK: same runtime
// (Bun), same driver (Drizzle over Bun SQL), same JWT and hasher modules,
// imported from the Elysia app rather than copied so they cannot drift. Only
// the routing and validation layer differs.
//
// Elysia does three things to a request body for free that Hono does not:
// coerces "30" to 30, strips unknown properties, and applies schema defaults.
// Parity demands all three (see bench/parity.ts: "coerced-age", "extras",
// "defaults"), so they are spelled out here with TypeBox's own Value helpers.
// That keeps the validator identical on both sides; without it this benchmark
// would be measuring TypeBox against something else and calling the result a
// framework difference.
import { Hono } from "hono";
import { Type as t, type TSchema } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

import { db, schema, eq } from "../../elysia-api/src/db";
import { userIdFromAuthHeader } from "../../elysia-api/src/auth";
import { sha256Loop } from "../../elysia-api/src/cpu";

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
 * The coercion rule, in front of TypeBox's own.
 *
 * `Value.Convert` is permissive in ways Elysia is not: it truncates the string
 * "1.5" to 1, turns `true` into 1, and turns the number 1 into the string "1".
 * Each of those made Hono answer 200 where Elysia answers 422, and the parity
 * gate caught all three on consecutive runs (`/cpu?n=1.5`, "bool-age",
 * "number-tag").
 *
 * What Elysia actually permits is narrow: a STRING may become a number, an
 * integer or a boolean, because that is what arrives in a query parameter or a
 * path segment. Nothing else crosses types. A number bound for a String stays
 * invalid, and a string bound for an Integer has to be an exact integer, so
 * "30" → 30 still works — parity's "coerced-age" case depends on it.
 *
 * This is written out rather than imported because it is the whole reason the
 * comparison is honest: both sides now run the same TypeBox schemas under the
 * same acceptance rule, so what the benchmark measures is the framework and
 * not a difference of validators.
 */
const kindOf = (s: any): string => s?.[Symbol.for("TypeBox.Kind")] ?? s?.type ?? "";

function coercibleLikeElysia(s: TSchema, input: unknown): boolean {
  if (!s || typeof s !== "object" || input === undefined || input === null) return true;
  const kind = kindOf(s);

  if (kind === "Integer" || (s as any).type === "integer") {
    if (typeof input === "number") return Number.isInteger(input);
    if (typeof input === "string") return /^[+-]?\d+$/.test(input.trim());
    return false;
  }
  if (kind === "Number" || (s as any).type === "number") {
    // Asymmetric on purpose, and measured rather than assumed. Probed against
    // the running Elysia app on 2026-09-22: body `age: "30"` against t.Integer
    // → 200, body `userId: "4242"` → 201, but body `amount: "19.99"` against
    // t.Number → 422. So Elysia coerces a string to an Integer and refuses to
    // coerce one to a Number. Parity's "coerced-age" and "invalid-order-1"
    // cases are the two halves of that rule.
    return typeof input === "number";
  }
  if (kind === "String" || (s as any).type === "string") return typeof input === "string";
  if (kind === "Boolean" || (s as any).type === "boolean") {
    return typeof input === "boolean" || input === "true" || input === "false";
  }

  const props = (s as any).properties;
  if (props && typeof input === "object" && !Array.isArray(input)) {
    return Object.keys(props).every((k) => coercibleLikeElysia(props[k], (input as any)[k]));
  }
  const items = (s as any).items;
  if (items && Array.isArray(input)) return input.every((x) => coercibleLikeElysia(items, x));
  // Unions (currency) and anything else fall through to Value.Check.
  return true;
}

function parse<T extends TSchema>(s: T, input: unknown) {
  if (!coercibleLikeElysia(s, input)) return { ok: false as const };
  const v = Value.Clean(s, Value.Convert(s, Value.Default(s, input)));
  return Value.Check(s, v) ? { ok: true as const, value: v as any } : { ok: false as const };
}

// email format is not registered in TypeBox by default; Elysia's TypeBox has it,
// so parity on the "bad-email" case requires registering the same check here.
import { FormatRegistry } from "@sinclair/typebox";
if (!FormatRegistry.Has("email")) {
  FormatRegistry.Set("email", (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s));
}

const serializeUser = (u: typeof schema.users.$inferSelect) => ({
  id: u.id, name: u.name, email: u.email, age: u.age, createdAt: u.createdAt.toISOString(),
});
const serializeOrder = (o: typeof schema.orders.$inferSelect) => ({
  id: o.id, userId: o.userId, amount: o.amount, currency: o.currency, createdAt: o.createdAt.toISOString(),
});

export const app = new Hono();

app.get("/health", (c) => c.json({ status: "ok" }));

app.post("/echo", async (c) => {
  const r = parse(EchoBody, await c.req.json().catch(() => null));
  return r.ok ? c.json(r.value) : c.json({ error: "validation" }, 422);
});

app.get("/cpu", (c) => {
  const r = parse(CpuQuery, c.req.query());
  if (!r.ok) return c.json({ error: "validation" }, 422);
  return c.json({ n: r.value.n, hash: sha256Loop(r.value.n) });
});

// Registered before "/users" so the parameterised route is not shadowed.
app.get("/users/:id", async (c) => {
  const r = parse(UserParams, { id: c.req.param("id") });
  if (!r.ok) return c.json({ error: "validation" }, 422);
  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, r.value.id)).limit(1);
  return u ? c.json(serializeUser(u)) : c.json({ error: "not found" }, 404);
});

app.get("/users", async (c) => {
  const r = parse(ListQuery, c.req.query());
  if (!r.ok) return c.json({ error: "validation" }, 422);
  const { page, limit } = r.value;
  const rows = await db.select().from(schema.users).orderBy(schema.users.id)
    .limit(limit).offset((page - 1) * limit);
  return c.json({ page, limit, items: rows.map(serializeUser) });
});

app.post("/orders", async (c) => {
  const r = parse(OrderBody, await c.req.json().catch(() => null));
  if (!r.ok) return c.json({ error: "validation" }, 422);
  const [o] = await db.insert(schema.orders)
    .values({ userId: r.value.userId, amount: r.value.amount.toFixed(2), currency: r.value.currency, createdAt: new Date() })
    .returning();
  return c.json(serializeOrder(o), 201);
});

app.get("/me", async (c) => {
  const userId = await userIdFromAuthHeader(c.req.header("authorization"));
  if (!userId) return c.json({ error: "unauthorized" }, 401);
  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  return u ? c.json(serializeUser(u)) : c.json({ error: "not found" }, 404);
});
