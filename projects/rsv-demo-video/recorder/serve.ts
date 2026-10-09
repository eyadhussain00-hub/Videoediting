import { spawn } from "node:child_process";
import { join } from "node:path";
import { sources } from "../config";
import { RSV_ROOT } from "./rsv-root";

// Runs the app's production build for recording: the same code and the same database as the live site,
// with no dev overlay in the footage. It also points the Telegram webhook at the recording clinic for this
// process only — nothing in .env.local or on Vercel changes.
//
//   npm run build            (once, in ../rsv-studio, whenever the app changes)
//   npm run serve            (here)                 → http://localhost:3100

const source = sources[process.env.DEMO_SOURCE ?? "clinic"];
const port = process.env.DEMO_PORT ?? "3100";

const child = spawn(process.execPath, [join(RSV_ROOT, "node_modules/next/dist/bin/next"), "start", "-p", port], {
  cwd: RSV_ROOT,
  stdio: "inherit",
  env: { ...process.env, TELEGRAM_BUSINESS_ID: source.business.id },
});
child.on("exit", (code) => process.exit(code ?? 0));
for (const signal of ["SIGINT", "SIGTERM"] as const) process.on(signal, () => child.kill(signal));
