import { app } from "./app";

Bun.serve({ port: Number(process.env.PORT ?? 3100), hostname: "127.0.0.1", fetch: app.fetch });
if (process.env.BOOT_MARK) console.error(`boot ${Date.now()}`);
