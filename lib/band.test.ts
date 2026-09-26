import { test } from "node:test";
import assert from "node:assert/strict";
import corpusJson from "./corpus.json" with { type: "json" };
import {
  band,
  consistency,
  spread,
  tippingPoint,
  normalizeForMatch,
  quoteVerified,
  taxedOunces,
  hasInterval,
  partitionByUnits,
  checkQuote,
  estimateInQuote,
  crossesZero,
  type Row,
} from "./band.ts";

const corpus = corpusJson as Row[];

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

test("partitionByUnits keeps a different-unit row off the shared axis", () => {
  const rows = corpus.filter((r) => r.outcome === "price_pass_through");
  const { plotted, otherScale } = partitionByUnits(rows, "cents/oz");
  assert.equal(plotted.length, 3);
  assert.equal(otherScale.length, 1);
  assert.equal(otherScale[0].id, "seiler-2021-passthrough");
  // Seiler's 0.97 is a SHARE of the tax. On a cents-per-ounce axis it would land
  // right next to Petimar's 1.02 and read as agreement. It is not agreement.
  assert.ok(plotted.every((r) => r.units === "cents/oz"));
});

test("partitionByUnits with a null canonical unit plots nothing", () => {
  const rows = corpus.filter((r) => r.outcome === "employment");
  const { plotted, otherScale } = partitionByUnits(rows, null);
  assert.equal(plotted.length, 0);
  assert.equal(otherScale.length, 3);
});

test("employment rows share no common unit, so no axis is possible", () => {
  const rows = corpus.filter((r) => r.outcome === "employment");
  const units = new Set(rows.map((r) => r.units));
  assert.equal(units.size, rows.length);
});

test("every reported row's number really appears in its own quote", () => {
  // The transcription guard, run over the whole corpus. If this fails, a digit
  // was dropped while hand-typing at the event and a wrong number is about to
  // render under a real citation.
  const bad = corpus.filter((r) => checkQuote(r).kind === "unverified");
  assert.deepEqual(bad.map((r) => r.id), []);
});

test("the employment zero is flagged as a null result, not a published estimate", () => {
  const m = corpus.find((r) => r.id === "marinello-2021-employment")!;
  const c = checkQuote(m);
  assert.equal(c.kind, "null_result");
  assert.match(c.detail, /not a number the authors printed/);
});

test("estimateInQuote catches a dropped digit", () => {
  const real = corpus.find((r) => r.id === "bleich-2021-passthrough")!;
  assert.equal(estimateInQuote(real), true);
  assert.equal(estimateInQuote({ ...real, estimate: 2.6 }), false);
});

test("a statute written $.015 still matches an estimate of 0.015", () => {
  const rate = corpus.find((r) => r.id === "phila-code-rate")!;
  assert.equal(estimateInQuote(rate), true);
});

test("the FY2026 figure is tagged as eleven months, not a year", () => {
  const r = corpus.find((r) => r.id === "phila-fy2026-ytd-11mo")!;
  assert.match(r.units, /ELEVEN months/);
});

test("two health rows from ONE paper overlap each other yet disagree about zero", () => {
  const panel = corpus.find((r) => r.id === "petimar-2024-adult-bmi-panel")!;
  const cross = corpus.find((r) => r.id === "petimar-2024-adult-bmi-cross")!;
  assert.equal(panel.study, cross.study); // same paper

  // GRADE says these are consistent: their intervals overlap.
  const c = consistency([panel, cross])!;
  assert.equal(c.allOverlap, true);

  // And yet they answer the question differently, which overlap alone hides.
  assert.equal(crossesZero(panel), true);
  assert.equal(crossesZero(cross), false);
});

test("crossesZero is null when the paper published no interval", () => {
  const r = corpus.find((x) => x.id === "seiler-2021-passthrough")!;
  assert.equal(crossesZero(r), null);
});

test("rows sharing a study carry distinct plot labels", () => {
  const byStudy = new Map<string, Row[]>();
  for (const r of corpus) {
    const k = r.study;
    byStudy.set(k, [...(byStudy.get(k) ?? []), r]);
  }
  for (const [study, rs] of byStudy) {
    if (rs.length < 2) continue;
    const shown = rs.map((r) => r.label ?? study);
    assert.equal(
      new Set(shown).size,
      shown.length,
      `${study} has ${rs.length} rows that would render with the same label`
    );
  }
});

test("counterfactual rows are labelled as model output, not observation", () => {
  const cf = corpus.filter((r) => r.estimate_kind === "authors_counterfactual");
  assert.ok(cf.length >= 6, `expected the Laffer rows to be tagged, found ${cf.length}`);
  for (const r of cf) {
    const c = checkQuote(r);
    assert.equal(c.kind, "authors_counterfactual");
    assert.match(c.detail, /Not an observation/);
    // still has to pass transcription
    assert.equal(estimateInQuote(r), true, `${r.id} number not in its quote`);
  }
});
