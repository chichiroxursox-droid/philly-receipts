#!/usr/bin/env node
// Sunday morning, 9am, tired. One command answering "is it safe to submit?"
// Prints PASS/FAIL per check and exits non-zero if anything fails.

import { execSync } from "node:child_process";
import { readFileSync, existsSync, statSync } from "node:fs";

const PROD = "https://philly-receipts.vercel.app";
const sh = (cmd) => execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const results = [];

function check(name, fn) {
  try {
    results.push({ name, ok: true, detail: fn() ?? "" });
  } catch (e) {
    results.push({ name, ok: false, detail: String(e.message).split("\n")[0].slice(0, 110) });
  }
}

async function checkAsync(name, fn) {
  try {
    results.push({ name, ok: true, detail: (await fn()) ?? "" });
  } catch (e) {
    results.push({ name, ok: false, detail: String(e.message).split("\n")[0].slice(0, 110) });
  }
}

await checkAsync("prod page loads", async () => {
  const r = await fetch(PROD, { signal: AbortSignal.timeout(15000) });
  const html = await r.text();
  if (r.status !== 200) throw new Error(`HTTP ${r.status}`);
  if (!html.includes("Philly Receipts")) throw new Error("page does not say Philly Receipts");
  return `HTTP 200, ${(html.length / 1024).toFixed(0)}KB`;
});

await checkAsync("prod still refuses out-of-jurisdiction", async () => {
  const r = await fetch(`${PROD}/api/route-proposal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: "Raise the Philly minimum wage to $20 an hour" }),
    signal: AbortSignal.timeout(15000),
  });
  const j = await r.json();
  if (j.verdict !== "out_of_jurisdiction") throw new Error(`got "${j.verdict}"`);
  return "refusal works";
});

check("tests pass", () => {
  sh("node --test lib/*.test.ts");
  return "all green";
});

check("typecheck clean", () => {
  sh("npx tsc --noEmit -p tsconfig.json");
  return "no type errors";
});

check("working tree committed", () => {
  const s = sh("git status --porcelain");
  if (s) throw new Error(`uncommitted: ${s.split("\n").slice(0, 2).join(", ")}`);
  return "clean";
});

check("everything pushed to origin", () => {
  sh("git fetch origin main -q");
  const ahead = sh("git rev-list --count origin/main..HEAD");
  if (ahead !== "0") throw new Error(`${ahead} commit(s) not pushed`);
  return `${sh("git rev-list --count HEAD")} commits, all pushed`;
});

check("repo is public", () => {
  const vis = sh("gh repo view --json visibility -q .visibility");
  if (vis !== "PUBLIC") throw new Error(`repo is ${vis}, MLH rules 12-13 need PUBLIC`);
  return "PUBLIC";
});

check("no secrets tracked by git", () => {
  const bad = sh("git ls-files").split("\n").filter((f) => f.startsWith(".env"));
  if (bad.length) throw new Error(`env file tracked: ${bad.join(", ")}`);
  return ".env* untracked";
});

check("backup video on Desktop", () => {
  const p = `${process.env.HOME}/Desktop/philly-receipts-demo.mp4`;
  if (!existsSync(p)) throw new Error("missing from Desktop");
  const mb = statSync(p).size / 1024 / 1024;
  if (mb < 0.3) throw new Error(`only ${mb.toFixed(1)}MB, likely truncated`);
  return `${mb.toFixed(1)}MB`;
});

check("every corpus row carries a source", () => {
  const corpus = JSON.parse(readFileSync("lib/corpus.json", "utf8"));
  const bad = corpus.filter((r) => !r.study || !r.quote || !r.funder).map((r) => r.id);
  if (bad.length) throw new Error(`missing a source: ${bad.join(", ")}`);
  return `${corpus.length} rows`;
});

const pad = Math.max(...results.map((r) => r.name.length));
console.log("");
for (const r of results) console.log(`  ${r.ok ? "PASS" : "FAIL"}  ${r.name.padEnd(pad)}  ${r.detail}`);
const failed = results.filter((r) => !r.ok);
console.log("");
console.log(failed.length ? `  ${failed.length} CHECK(S) FAILED. Fix before submitting.\n` : "  All clear. Safe to submit.\n");
process.exit(failed.length ? 1 : 0);
