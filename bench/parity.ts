import assert from "node:assert/strict";
import { SignJWT } from "jose";
import { CONFIGS, BASE_URL, SECRET, startServer, selectConfigs, type ConfigSpec } from "./lib";
import { cases, type Case } from "./cases";
import { connect } from "./database";
import { resetOrders } from "./db-reset";

export const canonical = (value: any): string => JSON.stringify(sort(value));
function sort(v: any): any { return Array.isArray(v) ? v.map(sort) : v !== null && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sort(v[k])])) : v; }
const echo = { name: "Jane Doe", email: "jane@example.com", age: 30, tags: ["a", "b"] };
const post = (name: string, body: unknown, expectStatus = 422): Case => ({ name, path: "/echo", method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), expectStatus });
export async function verifyParity(configs: ConfigSpec[] = selectConfigs()) {
  if (!configs.length) throw new Error("No configs for parity");
  // Always retain the actual Elysia reference even when measuring one sensitivity profile.
  const selected = configs.some(c => c.id === "E") ? configs : [CONFIGS.find(c => c.id === "E")!, ...configs];
  const signed = async (claims: Record<string, unknown>, secret = SECRET, alg = "HS256") => new SignJWT(claims).setProtectedHeader({ alg }).sign(new TextEncoder().encode(secret));
  const tokenCases: Case[] = [];
  for (const [name, token] of [
    ["bad-token", "broken"], ["bad-signature", await signed({sub:"4242"}, "wrong-key-wrong-key-wrong-key-12345")],
    ["expired", await signed({sub:"4242",exp:1})], ["future-nbf", await signed({sub:"4242",nbf:4102444800})],
    ["wrong-alg", await signed({sub:"4242"}, SECRET, "HS384")],
  ]) tokenCases.push({ name: name!, method: "GET", path: "/me", headers: { authorization: `Bearer ${token}` }, expectStatus: 401 });
  const checks: Case[] = [
    ...await cases(), {name:"defaults",method:"GET",path:"/users",expectStatus:200},
    {name:"missing-user",method:"GET",path:"/users/99999999",expectStatus:404},
    {name:"unauthorized",method:"GET",path:"/me",expectStatus:401}, ...tokenCases,
    ...["/users/0", "/users/nope", "/users?page=0", "/users?limit=101", "/cpu?n=0", "/cpu?n=1.5", "/cpu"].map(path => ({ name:path, path, method:"GET" as const,expectStatus:422 })),
    post("empty-name", {...echo,name:""}), post("long-name", {...echo,name:"x".repeat(101)}),
    post("bad-email", {...echo,email:"invalid"}), post("bool-age", {...echo,age:true}), post("fraction-age", {...echo,age:1.5}),
    post("high-age", {...echo,age:151}), post("many-tags", {...echo,tags:Array(11).fill("x")}),
    post("number-tag", {...echo,tags:[1]}), post("missing-age", {name:"Jane",email:"jane@example.com",tags:[]}),
    post("coerced-age", {...echo,age:"30"},200), post("extras", {...echo,ignored:"remove me"},200),
    post("boundary", {...echo,age:0,tags:[],name:"x".repeat(100)},200),
    ...[{userId:4242,amount:-1,currency:"USD"},{userId:4242,amount:"19.99",currency:"USD"},{userId:true,amount:1,currency:"USD"},{userId:4242,amount:1,currency:"XXX"}].map((body,i) => ({...post(`invalid-order-${i}`,body),path:"/orders"})),
  ];
  const seen = new Map<string,string>();
  const sql = connect();
  const evidence: any[] = [];
  try {
    for (const cfg of selected) {
      const srv = await startServer(cfg);
      try {
        for (const c of checks) {
          const r = await fetch(BASE_URL+c.path,{method:c.method,headers:c.headers,body:c.body,signal:AbortSignal.timeout(10000)});
          const text = await r.text();
          assert.equal(r.status,c.expectStatus,`${cfg.id}/${c.name}: ${text}`);
          assert.ok(r.headers.get("content-type")?.includes("json"),`${cfg.id}/${c.name}: not JSON`);
          const body = JSON.parse(text);
          if (c.name === "order") {
            assert.ok(Number.isInteger(body.id) && body.id > 200000);
            assert.match(body.createdAt,/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
            assert.ok(Math.abs(Date.parse(body.createdAt)-Date.now())<10000);
            const [row] = await sql`SELECT user_id, amount::text, currency FROM orders WHERE id=${body.id}`;
            assert.deepEqual(row,{user_id:4242,amount:"19.99",currency:"USD"});
            delete body.id; delete body.createdAt;
            assert.deepEqual(body,{userId:4242,amount:"19.99",currency:"USD"});
          }
          if (c.name === "health") assert.deepEqual(body,{status:"ok"});
          if (["echo","coerced-age","extras"].includes(c.name)) assert.deepEqual(body,echo);
          if (c.name === "cpu") assert.deepEqual(body,{n:15000,hash:"d8a1c2c8e49180c4dcb5ff65a12a46e415098c9c03a87998188830b45367b83e"});
          if (["me","user"].includes(c.name)) assert.deepEqual(body,{id:4242,name:"User 4242",email:"user4242@example.com",age:35,createdAt:"2023-11-14T23:24:01.000Z"});
          if (c.name === "list") assert.deepEqual(body.items.map((u:any)=>u.id),Array.from({length:20},(_,i)=>121+i));
          // Native validation error bodies differ; contract parity here is rejection/status, not invented identical diagnostics.
          if (r.status !== 422) {
            const normalized = canonical(body);
            if (seen.has(c.name)) assert.equal(normalized,seen.get(c.name),`${cfg.id}/${c.name}: body parity`);
            else seen.set(c.name,normalized);
          }
          evidence.push({config:cfg.id,case:c.name,status:r.status});
        }
        console.log(`parity ${cfg.id}: ${checks.length} cases passed`);
      } finally { await srv.stop(); }
    }
  } finally { await sql.end(); await resetOrders(); }
  return { passed:true, date:new Date().toISOString(), configs:selected.map(c=>c.id), checks:checks.length, evidence, validationErrors:"status parity; native bodies intentionally not normalized" };
}
if (import.meta.main) {
  const result = await verifyParity();
  await Bun.write("results/parity.json",JSON.stringify(result,null,2));
}
