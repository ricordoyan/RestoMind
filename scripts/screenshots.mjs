// Generates README screenshots by driving the running app with Playwright.
//
// Usage:
//   1. Build and start the app:  npm run build && PORT=3100 npm run start
//   2. In another terminal:      npm run screenshots
//
// Env overrides:
//   BASE_URL                 default http://localhost:3100
//   PLAYWRIGHT_EXECUTABLE    path to a Chromium/Chrome binary (auto-detected if unset)
//
// Output: docs/screenshots/*.png

import { chromium } from "playwright";
import { existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "docs", "screenshots");
const BASE_URL = process.env.BASE_URL || "http://localhost:3100";

// Prefer an explicit binary, then common pre-installed Playwright locations.
const CANDIDATES = [
  process.env.PLAYWRIGHT_EXECUTABLE,
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome",
].filter(Boolean);
const executablePath = CANDIDATES.find((p) => existsSync(p));

// [path, output name, fullPage]
const PAGES = [
  ["/", "landing", true],
  ["/analyze", "analyze", false],
  ["/trade-area", "trade-area", false],
  ["/market-scout", "market-scout", false],
  ["/impact", "impact", false],
  ["/recipe-cost", "recipe-cost", false],
  ["/inventory", "inventory", false],
  ["/playbook", "playbook", false],
  ["/copilot", "copilot", false],
  ["/design", "design", false],
];

async function main() {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    executablePath, // undefined => use Playwright's managed browser
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });

  for (const [path, name, fullPage] of PAGES) {
    const url = `${BASE_URL}${path}`;
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    } catch {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    }
    // let fonts / gradients settle
    await page.waitForTimeout(800);
    const file = join(OUT_DIR, `${name}.png`);
    await page.screenshot({ path: file, fullPage });
    console.log(`captured ${path} -> docs/screenshots/${name}.png`);
  }

  await browser.close();
  console.log("\nDone. Screenshots written to docs/screenshots/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
