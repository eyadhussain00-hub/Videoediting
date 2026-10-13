import { existsSync } from "node:fs";
import { Config } from "@remotion/cli/config";

Config.setEntryPoint("./src/index.ts");
Config.setPublicDir("./public");
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
Config.setCodec("h264");
Config.setCrf(17);
Config.setOverwriteOutput(true);
Config.setConcurrency(4);

// Cloud containers: use Playwright's headless shell instead of downloading another Chromium.
const linuxShell = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
if (existsSync(linuxShell)) Config.setBrowserExecutable(linuxShell);
