import { test, expect } from "bun:test";
import { bombardierArgs, cases } from "./cases";
import { canonical } from "./parity";
import { assertFixtureDatabase } from "./database";

test("JWT headers survive bombardier argument construction", async () => {
  const c = (await cases()).find(c => c.name === "me")!;
  const args = bombardierArgs(c);
  const i = args.indexOf("-H");
  expect(i).toBeGreaterThan(-1);
  expect(args[i + 1]).toStartWith("authorization: Bearer ");
});
test("canonical comparison preserves JSON types and array order", () => {
  expect(canonical({b:2,a:1})).toBe(canonical({a:1,b:2}));
  expect(canonical({amount:"19.99"})).not.toBe(canonical({amount:19.99}));
  expect(canonical([1,2])).not.toBe(canonical([2,1]));
});
test("destructive fixture tools refuse old benchmark and remote databases", () => {
  expect(() => assertFixtureDatabase("postgres://postgres@localhost/bench_saas")).toThrow();
  expect(() => assertFixtureDatabase("postgres://postgres@example.com/bench_elysia_django")).toThrow();
  expect(() => assertFixtureDatabase("postgres://postgres@localhost/bench_elysia_django")).not.toThrow();
});
