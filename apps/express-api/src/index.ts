import { app } from "./app";

app.listen(Number(process.env.PORT ?? 3100), "127.0.0.1");
if (process.env.BOOT_MARK) console.error(`boot ${Date.now()}`);
