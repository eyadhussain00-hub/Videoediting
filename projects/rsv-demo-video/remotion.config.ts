import { existsSync } from "node:fs";
import { join } from "node:path";
import { Config } from "@remotion/cli/config";

Config.setEntryPoint("./src/index.ts");
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
Config.setCodec("h264");
Config.setCrf(18);
Config.setOverwriteOutput(true);

// Use the headless Chromium Playwright already installed for the recorder, rather than downloading a
// second one. Without it, Remotion fetches its own on first render.
const playwrightShell = join(
  process.env.LOCALAPPDATA ?? "",
  "ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-win64/chrome-headless-shell.exe",
);
if (existsSync(playwrightShell)) Config.setBrowserExecutable(playwrightShell);

// On Linux, the headless shell Playwright installed (as in Claude Code's cloud containers).
const linuxShell = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
if (!existsSync(playwrightShell) && existsSync(linuxShell)) Config.setBrowserExecutable(linuxShell);
