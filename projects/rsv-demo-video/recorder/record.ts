import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";
import { chromium, type Locator, type Page, type Request } from "playwright";
import { dictionaries } from "@/lib/i18n";
import { SECTORS } from "@/lib/sectors";
import { BUSINESS_COOKIE, signToken } from "@/lib/session-token";
import { sources } from "../config";
import type { Beat, FootageSource, Locale, ViewportKey } from "../config/types";
import { RSV_ROOT } from "./rsv-root";
import { closeAppPool, resetTenant } from "./tenant";

// Drives the real dashboard through the configured beats and keeps Playwright's own video of it, plus a
// cue sheet: when each beat started and ended, named moments inside it, and the screen areas worth
// zooming into. The video is cut, sped up and captioned from that sheet, never timed by hand.
//
//   npm run serve                      (in another terminal: the app, built, on port 3100)
//   npm run record                     every locale and viewport of the clinic source
//   npm run record -- --locale ar --viewport mobile --source clinic

const here = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(RSV_ROOT, ".env.local"), quiet: true });

export const OUT = resolve(here, "../public/recordings");
const BASE = (process.env.DEMO_BASE_URL ?? "http://localhost:3100").replace(/\/$/, "");

type Rect = { x: number; y: number; w: number; h: number; at: number };
// gaps: stretches where the recorder was only waiting on the server and nothing new was happening on
// screen. The video builder cuts them out, so a slow database makes a slower take, not a slower ad.
type Cue = { id: Beat; start: number; end: number; marks: Record<string, number>; focus: Record<string, Rect>; gaps: [number, number][] };

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// Playwright moves the mouse instantly. People don't, and a pointer that teleports reads as a glitch on
// video, so every move is spread over real time with an ease in and out.
class Hand {
  private x: number;
  private y: number;
  constructor(private page: Page, width: number, height: number) {
    this.x = width * 0.62;
    this.y = height * 0.58;
  }

  async moveTo(x: number, y: number, ms = 520) {
    const fromX = this.x;
    const fromY = this.y;
    const steps = Math.max(8, Math.round(ms / 16));
    for (let i = 1; i <= steps; i++) {
      const t = ease(i / steps);
      await this.page.mouse.move(fromX + (x - fromX) * t, fromY + (y - fromY) * t);
      await sleep(ms / steps);
    }
    this.x = x;
    this.y = y;
  }

  async center(target: Locator) {
    await target.waitFor({ state: "visible" });
    await target.scrollIntoViewIfNeeded();
    const box = await target.boundingBox();
    if (!box) throw new Error(`No box for ${target}`);
    return { x: box.x + box.width / 2, y: box.y + Math.min(box.height / 2, 22) };
  }

  async click(target: Locator, ms?: number) {
    const { x, y } = await this.center(target);
    await this.moveTo(x, y, ms);
    await sleep(110);
    await this.page.mouse.down();
    await sleep(70);
    await this.page.mouse.up();
  }

  async hover(target: Locator, ms?: number) {
    const { x, y } = await this.center(target);
    await this.moveTo(x, y, ms);
  }

  // A real HTML5 drag: Playwright turns these mouse events into dragstart/dragover/drop in Chromium.
  async drag(from: Locator, to: Locator) {
    const start = await this.center(from);
    await this.moveTo(start.x, start.y);
    await sleep(140);
    await this.page.mouse.down();
    const box = await to.boundingBox();
    if (!box) throw new Error("Drop target has no box");
    await this.moveTo(box.x + box.width / 2, box.y + Math.min(box.height / 2, 110), 750);
    await sleep(180);
    await this.page.mouse.up();
  }
}

async function postTelegram(source: FootageSource, locale: Locale) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) throw new Error("TELEGRAM_WEBHOOK_SECRET is not set in .env.local");
  const { arrival } = source;
  const res = await fetch(`${BASE}/api/telegram/webhook`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-telegram-bot-api-secret-token": secret },
    // The shape Telegram itself sends for a private message to a bot.
    body: JSON.stringify({
      update_id: Date.now(),
      message: {
        message_id: 1,
        date: Math.floor(Date.now() / 1000),
        chat: { id: 700_000_001, type: "private" },
        from: {
          id: 700_000_001,
          is_bot: false,
          first_name: arrival.firstName[locale],
          last_name: arrival.lastName[locale],
          username: arrival.username,
        },
        text: arrival.text[locale],
      },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Telegram webhook answered ${res.status}: ${body}\n` +
        `Is the server running with TELEGRAM_BUSINESS_ID=${source.business.id}? Start it with npm run serve.`,
    );
  }
}

// Finds the first magenta frame in a finished take and returns how far the video's clock is ahead of the
// recorder's. The file is served to the page over an intercepted URL, so Chromium decodes it itself and
// nothing huge crosses the bridge.
async function calibrate(browser: import("playwright").Browser, file: string, syncAt: number): Promise<number> {
  const page = await browser.newPage();
  try {
    await page.route("https://take.local/**", (route) =>
      route.request().url().endsWith("/video.webm")
        ? route.fulfill({ path: file, contentType: "video/webm" })
        : route.fulfill({ contentType: "text/html", body: '<video id="v" muted></video><canvas id="c" width="4" height="4"></canvas>' }),
    );
    await page.addInitScript({ path: join(here, "calibrate.browser.js") });
    await page.goto("https://take.local/");
    const found = (await page.evaluate(`__demoFindSync(${syncAt + 8})`)) as number | null;
    if (found === null) throw new Error(`No sync frame found in ${file}`);
    return Number((found - syncAt).toFixed(3));
  } finally {
    await page.close();
  }
}

async function recordOne(pool: pg.Pool, source: FootageSource, locale: Locale, viewportKey: ViewportKey) {
  const vp = source.viewports[viewportKey];
  const sector = SECTORS[source.sector];
  const t = dictionaries[locale];
  const other: Locale = locale === "ar" ? "en" : "ar";
  const leadName = `${source.arrival.firstName[locale]} ${source.arrival.lastName[locale]}`;
  const name = `${source.key}-${locale}-${viewportKey}`;
  const dashboard = `${BASE}/b/${source.business.id}`;
  console.log(`\n● ${name}`);

  const sessionVersion = await resetTenant(pool, source, locale);
  console.log("  recording clinic reset, history seeded, last month's report published");

  // Demo dashboards skip the sign-in page, so the recorder carries the same signed session cookie the app
  // issues after a real sign-in: this business, its current session version, valid for an hour. Without it
  // the dashboard is read-only and nothing in the story could move.
  if (!process.env.SESSION_SECRET) throw new Error("SESSION_SECRET is not set in .env.local");
  const cookies = [
    {
      name: BUSINESS_COOKIE,
      value: signToken({ r: "business", b: source.business.id, v: sessionVersion, exp: Math.floor(Date.now() / 1000) + 3600 }),
      url: BASE,
      httpOnly: true,
    },
    { name: "rsv_lang", value: locale, url: BASE },
    { name: "rsv_theme", value: source.theme, url: BASE },
  ];

  const browser = await chromium.launch();
  try {
    // One untimed visit so the recorded load happens at normal speed, not a cold server's, and a check that
    // the session really does allow editing before a take is wasted on a read-only dashboard.
    const warm = await browser.newContext();
    await warm.addCookies(cookies);
    const probe = await warm.newPage();
    await probe.goto(dashboard);
    await probe.locator("tbody tr.clickable").first().waitFor();
    if (await probe.locator(".demo-banner").count()) throw new Error("Signed in as a demo visitor, not the clinic's team");
    await probe.goto(`${dashboard}/reports`);
    await probe.locator(".row-item").first().waitFor();
    await warm.close();
    console.log("  signed in");

    const videoDir = join(OUT, `.tmp-${name}`);
    rmSync(videoDir, { recursive: true, force: true });
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.scale,
      isMobile: vp.mobile,
      hasTouch: vp.mobile,
      colorScheme: source.theme,
      locale: locale === "ar" ? "ar-EG" : "en-US",
      timezoneId: "Africa/Cairo",
      // Without an explicit size Playwright shrinks every video to fit 800×800. It captures at the CSS
      // viewport size whatever the pixel density, so a larger size only pads the frame with grey.
      recordVideo: { dir: videoDir, size: { width: vp.width, height: vp.height } },
    });
    await context.addCookies(cookies);
    await context.addInitScript({ content: `window.__demoPointerKind = ${JSON.stringify(vp.mobile ? "touch" : "mouse")};` });
    await context.addInitScript({ path: join(here, "pointer.browser.js") });

    const page = await context.newPage();
    const t0 = Date.now();
    const at = () => Number(((Date.now() - t0) / 1000).toFixed(3));
    // Playwright starts filming before newPage() returns, by a different amount on every take, so the
    // video runs ahead of this clock. One magenta frame at a known moment lets calibrate() find the gap.
    await page.setContent('<html style="background:#ff00ff"><body></body></html>');
    const syncAt = at();
    await sleep(500);
    // Timings for each step, so a slow take says where the time went.
    const log = (what: string) => console.log(`    ${at().toFixed(1)}s  ${what}`);
    const hand = new Hand(page, vp.width, vp.height);
    const cues: Cue[] = [];
    let cue: Cue = { id: "load", start: 0, end: 0, marks: {}, focus: {}, gaps: [] };
    const begin = () => (cue.start = at());
    const mark = (label: string) => (cue.marks[label] = at());
    // Where on screen a moment happens, so the video can zoom into it.
    // Clipped to the viewport: a board with six months of history is thousands of pixels tall, and a
    // camera aimed at its middle would aim at nothing on screen.
    //
    // Measured only once the thing has stopped moving. Panels slide and dialogs pop, and a rectangle taken
    // mid-animation is where the panel was, not where it lands — a drawer caught at the start of its slide
    // measures off-screen and is thrown away, leaving that moment with nothing to zoom to.
    const focus = async (label: string, target: Locator) => {
      let box = await target.boundingBox();
      for (let tries = 0; tries < 12; tries++) {
        await sleep(80);
        const next = await target.boundingBox();
        if (!next || !box) break;
        if (Math.abs(next.x - box.x) < 1 && Math.abs(next.y - box.y) < 1 && Math.abs(next.width - box.width) < 1) break;
        box = next;
      }
      if (!box) return;
      const x = Math.max(0, box.x);
      const y = Math.max(0, box.y);
      const r = Math.min(vp.width, box.x + box.width);
      const b = Math.min(vp.height, box.y + box.height);
      if (r - x > 8 && b - y > 8) {
        cue.focus[label] = { x: Math.round(x), y: Math.round(y), w: Math.round(r - x), h: Math.round(b - y), at: at() };
      }
    };
    const hold = (beat: Beat) => sleep(source.holdMs[beat]);
    // Runs a wait on the server and records it as a gap to cut, keeping a sliver either side so the cut
    // lands on a settled frame.
    const waiting = async <T,>(fn: () => Promise<T>): Promise<T> => {
      const from = at();
      const result = await fn();
      const to = at();
      if (to - from > 0.7) cue.gaps.push([Number((from + 0.25).toFixed(3)), Number((to - 0.15).toFixed(3))]);
      return result;
    };
    const tap = async (target: Locator) => {
      await target.scrollIntoViewIfNeeded();
      await sleep(250);
      await target.tap();
    };
    const row = (who = leadName) => page.locator("tbody tr.clickable", { hasText: who });
    const drawer = page.locator(".drawer");
    const rasid = page.locator(".asst.rasid");

    // Waits for the server actions a step fired (every save is a POST) to come back. Waiting for the whole
    // network to go quiet instead stalls for ~10s, because the page never quite stops fetching.
    let saving = 0;
    page.on("request", (req) => req.method() === "POST" && saving++);
    const done = (req: Request) => req.method() === "POST" && saving--;
    page.on("requestfinished", done);
    page.on("requestfailed", done);
    const settle = async () => {
      for (let waited = 0; saving > 0 && waited < 10_000; waited += 50) await sleep(50);
    };
    const scrollTo = async (target: Locator, offset = 12) => {
      const top = await target.evaluate((el, o) => el.getBoundingClientRect().top + window.scrollY - o, offset);
      await page.evaluate((y) => window.scrollTo({ top: y, behavior: "smooth" }), top);
      await sleep(800);
    };
    const answerFrom = async (panel: Locator, before: number) => {
      await panel.locator(".msg.ai:not(.thinking)").nth(before).waitFor({ timeout: 90_000 });
    };

    const beats: Record<Beat, () => Promise<void>> = {
      async load() {
        await page.goto(dashboard, { waitUntil: "domcontentloaded" });
        await page.locator("tbody tr.clickable").first().waitFor();
        // Fonts and the first paint of the figures, so the take opens on a finished page.
        await page.evaluate(() => document.fonts.ready);
        await sleep(400);
        begin();
        await focus("stats", page.locator(".stat-grid"));
        if (vp.mobile) {
          // The phone shows the header and figures first, then scrolls to the list itself.
          await sleep(900);
          await scrollTo(page.locator(".toolbar"));
        }
        await focus("table", page.locator(".card").filter({ has: page.locator("table") }));
        await hold("load");
      },

      async search() {
        begin();
        const input = page.locator(".toolbar .search input");
        await hand.click(input);
        await page.keyboard.type(source.search[locale], { delay: 110 });
        mark("typed");
        await focus("result", page.locator("tbody tr.clickable").first());
        await hold("search");
        await page.keyboard.press("ControlOrMeta+A");
        await page.keyboard.press("Backspace");
        await sleep(500);
      },

      async arrive() {
        begin();
        mark("sent");
        await waiting(() => postTelegram(source, locale));
        log("webhook answered");
        // The dashboard shows new leads when it loads, so the team's refresh is part of the real flow.
        await waiting(async () => {
          await page.reload({ waitUntil: "domcontentloaded" });
          await row().waitFor({ timeout: 30_000 });
        });
        mark("visible");
        log("new lead visible");
        // The reload puts a phone back at the top of the page; bring the list back into view the way a
        // thumb would, rather than letting the next tap jump there.
        if (vp.mobile) await scrollTo(page.locator(".toolbar"));
        else await hand.hover(row(), 600);
        await focus("row", row());
        await hold("arrive");
      },

      async add() {
        begin();
        await hand.click(page.locator(".page-head .btn.primary"));
        const dialog = page.locator(".dialog");
        await dialog.waitFor();
        mark("dialog");
        await focus("dialog", dialog);
        const m = source.manual;
        await hand.click(dialog.locator('input[name="name"]'), 380);
        await page.keyboard.type(m.name[locale], { delay: 45 });
        await hand.click(dialog.locator('input[name="phone"]'), 380);
        await page.keyboard.type(m.phone, { delay: 35 });
        // Native selects: the value changes where the viewer can see it, without an OS popup the page
        // recording can't show anyway.
        await hand.hover(dialog.locator('select[name="subject"]'), 380);
        await dialog.locator('select[name="subject"]').selectOption(m.subject);
        await hand.click(dialog.locator('input[name="value"]'), 380);
        await page.keyboard.type(String(m.value), { delay: 45 });
        await hand.hover(dialog.locator('select[name="source"]'), 380);
        await dialog.locator('select[name="source"]').selectOption(m.source);
        await sleep(300);
        mark("filled");
        await hand.click(dialog.locator('button[type="submit"]'));
        await waiting(async () => {
          await dialog.waitFor({ state: "detached", timeout: 30_000 });
          await settle();
          await row(m.name[locale]).waitFor({ timeout: 30_000 });
        });
        mark("added");
        await focus("row", row(m.name[locale]));
        await hold("add");
      },

      async open() {
        begin();
        if (vp.mobile) await tap(row());
        else await hand.click(row());
        await drawer.waitFor();
        mark("opened");
        await focus("drawer", drawer);
        if (!vp.mobile) {
          await sleep(700);
          const noteBox = drawer.locator(".note-form textarea");
          await hand.click(noteBox);
          await page.keyboard.type(source.note[locale], { delay: 28 });
          await hand.click(drawer.locator('.note-form button[type="submit"]'));
          await waiting(async () => {
            await settle();
            await drawer.locator(".tl-item.note", { hasText: source.note[locale].slice(0, 12) }).waitFor({ timeout: 30_000 });
          });
          mark("noted");
          await focus("timeline", drawer.locator(".timeline"));
        }
        await hold("open");
      },

      async draft() {
        begin();
        const before = await rasid.locator(".msg.ai:not(.thinking)").count();
        // The panel's own button: it closes the panel and hands the assistant a ready-made request.
        await hand.click(drawer.locator(".drawer-foot .btn.primary"));
        await rasid.waitFor();
        mark("asked");
        await waiting(() => answerFrom(rasid, before));
        mark("answered");
        await focus("assistant", rasid);
        await hold("draft");
        await hand.click(rasid.locator(".asst-head .icon-btn").last());
        await rasid.waitFor({ state: "detached" });
      },

      async move() {
        begin();
        if (vp.mobile) {
          // Native drag-and-drop doesn't work with touch, so on a phone the stage is changed the way a
          // phone user would: the stage buttons in the record panel that is already open.
          const picker = drawer.locator(".stage-picker .stage-opt");
          await focus("picker", drawer.locator(".stage-picker"));
          for (const stage of source.moveTo) {
            const button = picker.nth(sector.stages.findIndex((s) => s.key === stage));
            await sleep(350);
            await button.tap();
            await page.waitForFunction((el) => el?.getAttribute("aria-pressed") === "true", await button.elementHandle());
            await waiting(settle);
            mark(stage);
            await sleep(500);
          }
          await hold("move");
          await drawer.locator(".drawer-head .icon-btn").tap();
          await drawer.waitFor({ state: "detached" });
          await sleep(600);
        } else {
          if (await drawer.count()) {
            await hand.click(drawer.locator(".drawer-head .icon-btn"));
            await drawer.waitFor({ state: "detached" });
          }
          await hand.click(page.locator(".seg button").nth(1));
          await page.locator(".board").waitFor();
          mark("board");
          await focus("board", page.locator(".board-scroll"));
          await sleep(500);
          for (const stage of source.moveTo) {
            const column = page.locator(".board .col").nth(sector.stages.findIndex((s) => s.key === stage));
            await hand.drag(page.locator(".kcard", { hasText: leadName }), column.locator(".col-body"));
            await column.locator(".kcard", { hasText: leadName }).waitFor({ timeout: 10_000 });
            await waiting(settle);
            mark(stage);
            await sleep(450);
          }
          await hold("move");
        }
      },

      async ask() {
        begin();
        await hand.click(page.locator(".asst-launcher.rasid"));
        await rasid.waitFor();
        await sleep(400);
        const before = await rasid.locator(".msg.ai:not(.thinking)").count();
        // Typed rather than picked from the suggestions: the suggestions only show on an empty
        // conversation, and "ask it anything" is the point.
        await hand.click(rasid.locator(".asst-input input"));
        await page.keyboard.type(t.assistant.rasid.chips[0], { delay: 40 });
        await page.keyboard.press("Enter");
        mark("asked");
        await waiting(() => answerFrom(rasid, before));
        mark("answered");
        await focus("assistant", rasid);
        await hold("ask");
        await hand.click(rasid.locator(".asst-head .icon-btn").last());
        await rasid.waitFor({ state: "detached" });
      },

      async language() {
        begin();
        // The switch is a server action followed by a refresh; a click that lands while the previous one is
        // still settling is ignored, so it gets one more try before the take is abandoned.
        const switchTo = async (to: Locale) => {
          const button = page.locator(".ws-header .lang-toggle button").nth(to === "en" ? 0 : 1);
          for (let attempt = 0; attempt < 2; attempt++) {
            await hand.click(button);
            try {
              await waiting(async () => {
                await page.locator(`.ws[lang="${to}"]`).waitFor({ timeout: 20_000 });
                await settle();
              });
              return;
            } catch {
              log(`language switch to ${to} didn't take, trying again`);
            }
          }
          throw new Error(`The dashboard didn't switch to ${to}`);
        };
        await switchTo(other);
        mark("switched");
        await focus("page", page.locator(".ws-content"));
        await hold("language");
        await switchTo(locale);
        mark("back");
        await sleep(500);
      },

      async report() {
        begin();
        await hand.click(page.locator(".ws-nav a").nth(1));
        await waiting(() => page.locator(".row-item").first().waitFor({ timeout: 30_000 }));
        mark("list");
        await sleep(500);
        await hand.click(page.locator(".row-item").first());
        await waiting(async () => {
          await page.locator(".rep").waitFor({ timeout: 30_000 });
          await page.evaluate(() => document.fonts.ready);
        });
        mark("opened");
        await focus("tiles", page.locator(".rep-tiles"));
        await hand.moveTo(vp.width * 0.72, vp.height * 0.2, 500);
        await sleep(1100);
        await scrollTo(page.locator(".rep-summary"), 90);
        mark("summary");
        await focus("summary", page.locator(".rep-summary"));
        await sleep(1400);
        await scrollTo(page.locator(".rep-split").first(), 24);
        mark("breakdown");
        await focus("breakdown", page.locator(".rep-split").first());
        await sleep(1300);
        const team = page.locator(".rep-split").nth(1);
        if (await team.count()) {
          await scrollTo(team, 24);
          mark("team");
          await focus("team", team);
        }
        await hold("report");
      },
    };

    for (const beat of vp.beats) {
      console.log(`  ${beat}`);
      cue = { id: beat, start: at(), end: 0, marks: {}, focus: {}, gaps: [] };
      await beats[beat]();
      cue.end = at();
      cues.push(cue);
    }
    await sleep(400);
    const duration = at();

    const video = page.video();
    await context.close();
    mkdirSync(OUT, { recursive: true });
    const file = join(OUT, `${name}.webm`);
    await video!.saveAs(file);
    rmSync(videoDir, { recursive: true, force: true });
    const offset = await calibrate(browser, file, syncAt);
    log(`video runs ${offset.toFixed(2)}s ahead of the recorder's clock`);

    writeFileSync(
      join(OUT, `${name}.json`),
      JSON.stringify(
        {
          source: source.key,
          locale,
          viewport: viewportKey,
          video: `${name}.webm`,
          width: vp.width,
          height: vp.height,
          theme: source.theme,
          business: source.business.name,
          arrival: { name: leadName, username: source.arrival.username, text: source.arrival.text[locale] },
          duration,
          // Add to every time below to find the same moment in the video file.
          offset,
          cues,
          recordedAt: new Date().toISOString(),
        },
        null,
        2,
      ),
    );
    console.log(`  saved ${file} (${duration}s)`);
  } finally {
    await browser.close();
  }
}

async function main() {
  const source = sources[arg("source") ?? "clinic"];
  if (!source) throw new Error(`Unknown source. Known: ${Object.keys(sources).join(", ")}`);
  const locales = arg("locale") ? [arg("locale") as Locale] : source.locales;
  const viewports = arg("viewport") ? [arg("viewport") as ViewportKey] : (Object.keys(source.viewports) as ViewportKey[]);
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set in .env.local");

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
  try {
    for (const locale of locales) {
      for (const viewport of viewports) await recordOne(pool, source, locale, viewport);
    }
  } finally {
    await pool.end();
    await closeAppPool();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
