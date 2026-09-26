// Backup demo recording. If the venue wifi dies or the laptop misbehaves on
// Sunday, this file is the demo. Run: node .demo/record.mjs [url]
import { chromium } from "/usr/local/lib/node_modules/playwright/index.mjs";
import { fileURLToPath } from "node:url";

const TARGET = process.argv[2] || "https://philly-receipts.vercel.app/";
// pathname keeps percent-encoding, and this repo lives under "CLAUDE CODE".
const OUT = fileURLToPath(new globalThis.URL("./video/", import.meta.url));

const pause = (ms) => new Promise((r) => setTimeout(r, ms));

/** Type like a person, so the video does not look like a script. */
async function human(page, sel, text) {
  await page.click(sel);
  await page.fill(sel, "");
  for (const ch of text) {
    await page.type(sel, ch, { delay: 28 + Math.random() * 45 });
  }
}

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 860 },
  recordVideo: { dir: OUT, size: { width: 1280, height: 860 } },
  deviceScaleFactor: 2,
  colorScheme: "light",
});
const page = await ctx.newPage();

await page.goto(TARGET, { waitUntil: "networkidle" });
await pause(2200);

// 1. The headline question.
await human(page, 'input[aria-label="Policy proposal"]', "What if Philadelphia doubled the soda tax?");
await pause(500);
await page.click('button:has-text("Show me")');
await pause(1600);

// 2. Sit on the forest plot. This is the beat that sells it.
await page.locator("figure svg").scrollIntoViewIfNeeded();
await pause(4200);

// 3. Click a dot, open its source.
await page.locator("figure svg g[role=button]").nth(2).click();
await pause(1200);
await page.locator("#src-bleich-2021-passthrough").scrollIntoViewIfNeeded();
await pause(4000);

// 4. Employment: the view that refuses to draw a chart.
await page.locator('nav[aria-label="Outcomes"] button:has-text("Employment")').scrollIntoViewIfNeeded();
await pause(600);
await page.click('nav[aria-label="Outcomes"] button:has-text("Employment")');
await pause(4500);

// 5. Jurisdiction refusal.
await page.locator('input[aria-label="Policy proposal"]').scrollIntoViewIfNeeded();
await pause(500);
await human(page, 'input[aria-label="Policy proposal"]', "Raise the Philly minimum wage to $20 an hour");
await page.click('button:has-text("Show me")');
await pause(4200);

// 6. No-evidence refusal.
await human(page, 'input[aria-label="Policy proposal"]', "Build a monorail down Broad Street");
await page.click('button:has-text("Show me")');
await pause(4200);

// 7. Land on the footer: how this works.
await page.locator("footer").scrollIntoViewIfNeeded();
await pause(3500);

await ctx.close();
await browser.close();
console.log("raw video in", OUT);
