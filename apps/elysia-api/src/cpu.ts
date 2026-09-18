import { createHash } from "node:crypto";

// CPU_HASHER=bun-native selects Bun's one-shot SHA256 for the E-native diagnostic config only.
// Same bytes in, same hex out; the default stays node:crypto so E remains comparable with elysia-vs-nest.
const native = process.env.CPU_HASHER === "bun-native";

export function sha256Loop(n: number): string {
  let h = "elysia-vs-nest";
  if (native) for (let i = 0; i < n; i++) h = Bun.SHA256.hash(h, "hex") as string;
  else for (let i = 0; i < n; i++) h = createHash("sha256").update(h).digest("hex");
  return h;
}
