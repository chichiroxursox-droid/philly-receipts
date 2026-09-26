import { test } from "node:test";
import assert from "node:assert/strict";
import {
  band,
  consistency,
  spread,
  tippingPoint,
  normalizeForMatch,
  quoteVerified,
  taxedOunces,
  hasInterval,
  type Row,
} from "./band.ts";

const r = (o: Partial<Row> & { id: string; estimate: number }): Row => ({
  outcome: "price_pass_through",
  ci_low: null,
  ci_high: null,
  units: "cents/oz",
  study: "test",
  doi: "10.0000/test",
  funder: "none",
  industry_funded: false,
  quote: "",
  ...o,
});

// The three real pass-through rows that publish an interval in cents per ounce.
const PASS_THROUGH: Row[] = [
  r({ id: "petimar-2022", estimate: 1.02, ci_low: 0.94, ci_high: 1.11 }),
  r({ id: "hua-2023", estimate: 1.6, ci_low: 1.3, ci_high: 2.0 }),
  r({ id: "bleich-2021", estimate: 2.06, ci_low: 1.75, ci_high: 2.38 }),
  // Seiler publishes no interval, so it must never touch the band.
  r({ id: "seiler-2021", estimate: 0.97, ci_low: null, ci_high: null }),
];

test("hasInterval rejects rows with no published CI", () => {
  assert.equal(hasInterval(PASS_THROUGH[0]), true);
  assert.equal(hasInterval(PASS_THROUGH[3]), false);
});

test("band spans lowest published low to highest published high", () => {
  const b = band(PASS_THROUGH);
  assert.ok(b);
  assert.equal(b.low, 0.94);
  assert.equal(b.high, 2.38);
  assert.equal(b.lowFrom, "petimar-2022");
  assert.equal(b.highFrom, "bleich-2021");
});

test("band EXCLUDES rows without a published interval and names them", () => {
  const b = band(PASS_THROUGH);
  assert.ok(b);
  assert.deepEqual(b.excluded, ["seiler-2021"]);
});

test("band returns null rather than inventing an interval", () => {
  assert.equal(band([r({ id: "a", estimate: 1 })]), null);
  assert.equal(band([]), null);
});

test("GRADE inconsistency fires when intervals do not all overlap", () => {
  const c = consistency(PASS_THROUGH);
  assert.ok(c);
  // max of lows is Bleich 1.75, min of highs is Petimar 1.11
  assert.equal(c.maxLow, 1.75);
  assert.equal(c.minHigh, 1.11);
  assert.equal(c.allOverlap, false);
  assert.equal(c.maxLowFrom, "bleich-2021");
  assert.equal(c.minHighFrom, "petimar-2022");
  assert.equal(c.n, 3);
});

test("consistency reports overlap when intervals genuinely share a value", () => {
  const overlapping: Row[] = [
    r({ id: "a", estimate: 1.0, ci_low: 0.9, ci_high: 1.2 }),
    r({ id: "b", estimate: 1.1, ci_low: 1.0, ci_high: 1.3 }),
  ];
  const c = consistency(overlapping);
  assert.ok(c);
  assert.equal(c.allOverlap, true);
});

test("consistency needs at least two intervals", () => {
  assert.equal(consistency([PASS_THROUGH[0]]), null);
  assert.equal(consistency([PASS_THROUGH[3]]), null);
});

test("spread covers point estimates including rows with no interval", () => {
  const s = spread(PASS_THROUGH);
  assert.ok(s);
  assert.equal(s.min, 0.97);
  assert.equal(s.max, 2.06);
});

test("tippingPoint finds the sign change inside the range", () => {
  // conclusion flips sign at x = 1.5
  const t = tippingPoint(0, 3, (x) => x - 1.5);
  assert.ok(t);
  assert.ok(Math.abs(t.at - 1.5) < 0.01, `expected ~1.5, got ${t.at}`);
});

test("tippingPoint returns null when the conclusion never flips", () => {
  assert.equal(tippingPoint(0, 3, (x) => x + 10), null);
  assert.equal(tippingPoint(3, 0, (x) => x), null);
});

test("normalizeForMatch neutralizes smart quotes, nbsp and dashes", () => {
  const a = normalizeForMatch("The tax “passed through” at 1.02–cents");
  const b = normalizeForMatch('the tax "passed through" at 1.02-cents');
  assert.equal(a, b);
});

test("quoteVerified matches only when the sentence is really in the source", () => {
  const source =
    "Prices of taxed beverages increased by 1.02 cents per ounce (95% CI, 0.94–1.11).";
  assert.equal(quoteVerified("increased by 1.02 cents per ounce", source), true);
  assert.equal(quoteVerified("increased by 2.06 cents per ounce", source), false);
  assert.equal(quoteVerified("", source), false);
});

test("taxedOunces is division, not economics", () => {
  // FY2025 collections at 1.5 cents per ounce
  const oz = taxedOunces(68_338_441, 1.5);
  assert.ok(Math.abs(oz - 4_555_896_066.7) < 1000, `got ${oz}`);
  assert.throws(() => taxedOunces(100, 0));
});

test("normalizeForMatch collapses publisher digit grouping", () => {
  // JAMA prints large numbers with thin spaces, Lancet uses commas
  const thin = normalizeForMatch("n = 2\u2009094\u2009220 increased by 1.6");
  const comma = normalizeForMatch("n = 2,094,220 increased by 1.6");
  const plain = normalizeForMatch("n = 2094220 increased by 1.6");
  assert.equal(thin, plain);
  assert.equal(comma, plain);
});

test("quoteVerified survives thin spaces in the source", () => {
  const source =
    "Mean prices of taxed beverages (n = 2\u2009094\u2009220) increased by 1.6 (95% CI, 1.3\u20132.0) cents/oz (106.7% pass-through)";
  assert.equal(quoteVerified("n = 2 094 220", source), true);
  assert.equal(quoteVerified("1.3-2.0", source), true);
});
