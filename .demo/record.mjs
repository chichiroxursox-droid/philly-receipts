// Backup demo recording. If the venue wifi dies on Sunday, this file IS the demo.
// Run: node .demo/record.mjs [url]
import { chromium } from "/usr/local/lib/node_modules/playwright/index.mjs";
import { fileURLToPath } from "node:url";

const TARGET = process.argv[2] || "https://philly-receipts.vercel.app/";
// pathname keeps percent-encoding, and this repo lives under "CLAUDE CODE".
const OUT = fileURLToPath(new globalThis.URL("./video/", import.meta.url));

const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const BOX = 'input[aria-label="Policy proposal"]';

/** Type like a person, so the video does not look like a script. */
async function human(page, text) {
  await page.click(BOX);
  await page.fill(BOX, "");
  for (const ch of text) await page.type(BOX, ch, { delay: 26 + Math.random() * 42 });
}

async function tab(page, name, hold) {
  const sel = `nav[aria-label="Outcomes"] button:has-text("${name}")`;
  await page.locator(sel).scrollIntoViewIfNeeded();
  await pause(350);
  await page.click(sel);
  await pause(hold);
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
await pause(1800);

// 1. The landing page says what it holds, before you fail at it.
await page.locator("text=How this corpus was assembled").scrollIntoViewIfNeeded();
await pause(3600);
await page.locator("h1").scrollIntoViewIfNeeded();
await pause(700);

// 2. Play the mayor. The headline beat.
await human(page, "What if Philadelphia doubled the soda tax?");
await pause(400);
await page.click('button:has-text("Show me")');
await pause(1500);
await page.locator("figure svg").first().scrollIntoViewIfNeeded();
await pause(5200); // sit on the collapse at 3 cents

// 3. Its source, carrying the counterfactual badge.
await page.locator("text=at 3.0 cents/oz, the rate first proposed").first().scrollIntoViewIfNeeded();
await pause(4200);

// 4. Pass-through: four teams, one quantity, no overlap.
await tab(page, "Price pass-through", 1000);
await page.locator("figure svg").first().scrollIntoViewIfNeeded();
await pause(4600);

// 5. Health: the same paper reaching two different answers.
await tab(page, "Health", 5000);

// 6. Employment: it refuses to draw a chart at all.
await tab(page, "Employment", 4200);

// 7. Jurisdiction refusal.
await page.locator(BOX).scrollIntoViewIfNeeded();
await pause(400);
await human(page, "Raise the Philly minimum wage to $20 an hour");
await page.click('button:has-text("Show me")');
await pause(4000);

// 8. No-evidence refusal.
await human(page, "Build a monorail down Broad Street");
await page.click('button:has-text("Show me")');
await pause(4000);

// 9. Land on how it works.
await page.locator("footer").scrollIntoViewIfNeeded();
await pause(3200);

await ctx.close();
await browser.close();
console.log("raw video in", OUT);
