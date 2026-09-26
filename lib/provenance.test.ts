import { test } from "node:test";
import assert from "node:assert/strict";
import { assertRowId, rowById, CORPUS } from "./corpus.ts";
import { checkQuote } from "./band.ts";

// The README and the Devpost copy both claim an unsourced number cannot render.
// That is a claim about behaviour, so it gets a test rather than a promise.

test("assertRowId throws on an id that is not in the corpus", () => {
  assert.throws(() => assertRowId("petimar-2022-passthrough-typo"), /Unsourced number/);
  assert.throws(() => assertRowId(""), /Unsourced number/);
});

test("assertRowId passes every id the corpus really holds", () => {
  for (const r of CORPUS) assert.equal(assertRowId(r.id), r.id);
});

test("every row id the page hard-codes actually exists", () => {
  // These are the ids written by hand in app/page.tsx and components/.
  // A rename in the corpus would otherwise crash the page at runtime.
  for (const id of ["phila-fy2025-collections", "phila-code-rate"]) {
    assert.ok(rowById(id), `page.tsx references a missing corpus row: ${id}`);
  }
});

test("corpus ids are unique", () => {
  const ids = CORPUS.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("no row can render a figure without passing its own quote check", () => {
  // checkQuote.ok === false means the UI prints "withheld" instead of a number.
  // Right now nothing in the corpus is in that state, and that is the invariant.
  const withheld = CORPUS.filter((r) => !checkQuote(r).ok).map((r) => r.id);
  assert.deepEqual(withheld, []);
});

test("every row carries a source a reader can actually follow", () => {
  for (const r of CORPUS) {
    assert.ok(r.study && r.study.length > 8, `${r.id} has no usable study string`);
    assert.ok(r.quote && r.quote.length > 10, `${r.id} has no quote`);
    assert.ok(r.funder && r.funder.length > 0, `${r.id} has no funder`);
  }
});
