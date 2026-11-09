export {};
// Two bundles of one source.
//
// dist/index.js targets Bun, like apps/elysia-api and apps/hono-api: config
// X-bun, which shares E's runtime and E's Bun SQL driver.
//
// dist-node/index.js targets Node and runs under BOTH runtimes: config X-node
// (`node`) and config X-bun-pg (`bun`, DB_DRIVER=postgresjs). The same file on
// the same driver, so those two differ in the runtime and nothing else.
// db.ts reaches Bun SQL through dynamic imports of "bun" and
// "drizzle-orm/bun-sql"; in this bundle they resolve to a stub that throws, so
// Node never sees a Bun-only import and the postgres.js branch is the only
// live one.
const bun = await Bun.build({ entrypoints: ["src/index.ts"], outdir: "dist", target: "bun", minify: false, sourcemap: "none" });
if (!bun.success) { console.error(bun.logs); process.exit(1); }

const bunOnly: import("bun").BunPlugin = {
  name: "bun-only-stub",
  setup(build) {
    build.onResolve({ filter: /^(bun|drizzle-orm\/bun-sql)$/ }, (args) => ({ path: args.path, namespace: "bun-only" }));
    build.onLoad({ filter: /.*/, namespace: "bun-only" }, () => ({
      contents: `const no = () => { throw new Error("Bun-only module loaded in the Node bundle; set DB_DRIVER=postgresjs"); };
export class SQL { constructor() { no(); } }
export const drizzle = no;`,
      loader: "js",
    }));
  },
};
const node = await Bun.build({ entrypoints: ["src/index.ts"], outdir: "dist-node", target: "node", minify: false, sourcemap: "none", plugins: [bunOnly] });
if (!node.success) { console.error(node.logs); process.exit(1); }
process.exit(0);
