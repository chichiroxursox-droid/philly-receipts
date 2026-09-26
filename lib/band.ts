// The honesty rail. No model touches anything in this file.
// Every function here is arithmetic a judge can be walked through line by line.

export type Row = {
  id: string;
  outcome: string;
  /** Point estimate as published. */
  estimate: number;
  /** Published 95% CI. null when the paper reports none. */
  ci_low: number | null;
  ci_high: number | null;
  units: string;
  study: string;
  doi: string;
  funder: string;
  industry_funded: boolean;
  /** Verbatim sentence from the source containing the number. */
  quote: string;
  /**
   * What KIND of number the estimate is. This exists because "0" in the
   * employment row is not a figure Marinello published, it is this app's
   * encoding of a paper that reported no effect. Treating that 0 as a
   * published point estimate would be the most dishonest thing in the corpus.
   */
  estimate_kind?:
    | "reported"
    | "authors_counterfactual"
    | "null_result"
    | "statute"
    | "official_record"
    | "budget_estimate";
  /**
   * Short label for the plot when the citation alone is ambiguous. Two rows in
   * the health view are the SAME paper and differ only by sample construction,
   * so rendering "Petimar et al. 2024" twice tells the reader nothing.
   */
  label?: string;
  /**
   * The tax rate this row describes, in cents per fluid ounce. Set only on rows
   * that state an outcome AT a specific rate. It is what the rate rail snaps to,
   * and rows without it are not counterfactuals.
   */
  dose_cents_per_oz?: number;
  /** Scope/window caveat shown next to the row. */
  note?: string;
};

/** A row only counts toward an interval calculation if the paper actually published one. */
export function hasInterval(r: Row): boolean {
  return r.ci_low !== null && r.ci_high !== null && r.ci_low <= r.ci_high;
}

export type UnitPartition = {
  /** Rows sharing the canonical unit. These are the only rows that may share an axis. */
  plotted: Row[];
  /** Rows measured on some other scale. Shown, never plotted alongside. */
  otherScale: Row[];
};

/**
 * Split rows by unit before anything is drawn.
 *
 * Putting two different units on one axis silently asserts the studies measured
 * the same quantity. Seiler's "97% of the tax" and Petimar's "1.02 cents per
 * ounce" are not the same number and must never share a scale. Employment is
 * worse: three papers, three units, no shared axis exists at all.
 */
export function partitionByUnits(rows: Row[], units: string | null): UnitPartition {
  if (units === null) return { plotted: [], otherScale: rows };
  return {
    plotted: rows.filter((r) => r.units === units),
    otherScale: rows.filter((r) => r.units !== units),
  };
}

/**
 * Does the published interval contain zero?
 *
 * This is the difference between "we found nothing" and "we found something",
 * and it is NOT the same question as whether two studies agree. Two intervals
 * can overlap each other while one contains zero and the other does not, which
 * is exactly what the two health samples do. Saying only "the studies are
 * consistent" would hide the disagreement people actually care about.
 */
export function crossesZero(r: Row): boolean | null {
  if (!hasInterval(r)) return null;
  return (r.ci_low as number) <= 0 && (r.ci_high as number) >= 0;
}

export type Band = {
  low: number;
  high: number;
  lowFrom: string;
  highFrom: string;
  /** Rows that had no published interval and were therefore excluded. */
  excluded: string[];
};

/**
 * The uncertainty band is the lowest published low to the highest published high.
 * Not an average, not a model. Rows without a published interval are EXCLUDED,
 * never imputed, because inventing an interval is the exact failure this app exists to avoid.
 */
export function band(rows: Row[]): Band | null {
  const withCI = rows.filter(hasInterval);
  const excluded = rows.filter((r) => !hasInterval(r)).map((r) => r.id);
  if (withCI.length === 0) return null;

  let lo = withCI[0];
  let hi = withCI[0];
  for (const r of withCI) {
    if ((r.ci_low as number) < (lo.ci_low as number)) lo = r;
    if ((r.ci_high as number) > (hi.ci_high as number)) hi = r;
  }
  return {
    low: lo.ci_low as number,
    high: hi.ci_high as number,
    lowFrom: lo.id,
    highFrom: hi.id,
    excluded,
  };
}

export type Consistency = {
  /** True when every published interval shares at least one common value. */
  allOverlap: boolean;
  maxLow: number;
  minHigh: number;
  maxLowFrom: string;
  minHighFrom: string;
  n: number;
};

/**
 * GRADE's inconsistency rule: downgrade when the confidence intervals across
 * studies do not all overlap. Overlap holds exactly when max(lows) <= min(highs).
 */
export function consistency(rows: Row[]): Consistency | null {
  const withCI = rows.filter(hasInterval);
  if (withCI.length < 2) return null;

  let maxLowRow = withCI[0];
  let minHighRow = withCI[0];
  for (const r of withCI) {
    if ((r.ci_low as number) > (maxLowRow.ci_low as number)) maxLowRow = r;
    if ((r.ci_high as number) < (minHighRow.ci_high as number)) minHighRow = r;
  }
  const maxLow = maxLowRow.ci_low as number;
  const minHigh = minHighRow.ci_high as number;
  return {
    allOverlap: maxLow <= minHigh,
    maxLow,
    minHigh,
    maxLowFrom: maxLowRow.id,
    minHighFrom: minHighRow.id,
    n: withCI.length,
  };
}

/** Plain spread of point estimates. Used for the forest plot axis. */
export function spread(rows: Row[]): { min: number; max: number } | null {
  if (rows.length === 0) return null;
  let min = rows[0].estimate;
  let max = rows[0].estimate;
  for (const r of rows) {
    if (r.estimate < min) min = r.estimate;
    if (r.estimate > max) max = r.estimate;
  }
  return { min, max };
}

/**
 * Tipping point. Sweep a parameter across its published range and report the
 * value where a conclusion changes sign. This is a computation OVER the evidence,
 * which is why it is not something any single cited study reports.
 * Returns null when the conclusion never flips inside the range.
 */
export function tippingPoint(
  low: number,
  high: number,
  conclusion: (x: number) => number,
  steps = 400
): { at: number; before: number; after: number } | null {
  if (!(high > low) || steps < 2) return null;
  const step = (high - low) / steps;
  let prevX = low;
  let prevY = conclusion(low);
  for (let i = 1; i <= steps; i++) {
    const x = low + step * i;
    const y = conclusion(x);
    if (prevY === 0) return { at: prevX, before: prevY, after: y };
    if ((prevY < 0 && y > 0) || (prevY > 0 && y < 0)) {
      // linear interpolation between the bracketing samples
      const t = prevY / (prevY - y);
      return { at: prevX + step * t, before: prevY, after: y };
    }
    prevX = x;
    prevY = y;
  }
  return null;
}

/**
 * Normalize before substring matching. Smart quotes, non-breaking spaces and
 * unicode variants silently break naive matching, which would make the quote
 * check pass or fail for the wrong reason.
 */
export function normalizeForMatch(s: string): string {
  return s
    .normalize("NFKC")
    .replace(/[‘’‚‛′]/g, "'")
    .replace(/[“”„‟″]/g, '"')
    .replace(/[‐-―−]/g, "-")
    .replace(/[    ]/g, " ")
    // Publishers group digits differently: JAMA prints "2 094 220" with thin
    // spaces, Lancet prints "2,094,220". Collapse both so a quote matches either.
    .replace(/(\d)[ ,](?=\d{3}(?!\d))/g, "$1")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** A claim renders only if its quote really appears in the source text. */
export function quoteVerified(quote: string, sourceText: string): boolean {
  const q = normalizeForMatch(quote);
  if (q.length === 0) return false;
  return normalizeForMatch(sourceText).includes(q);
}

export type QuoteCheck = {
  /** Safe to display the number. */
  ok: boolean;
  kind: "verified" | "authors_counterfactual" | "null_result" | "budget_estimate" | "unverified";
  detail: string;
};

/**
 * Does the published estimate literally appear in the sentence quoted beneath it?
 *
 * This is the transcription guard. Hand-typing 14 numbers out of 10 papers at
 * 3am is exactly where a digit gets dropped, and a wrong number with a real
 * citation under it is worse than no number at all. A row that fails this does
 * not render its figure.
 */
export function estimateInQuote(r: Row): boolean {
  const q = normalizeForMatch(r.quote);
  if (q.length === 0) return false;
  const e = Math.abs(r.estimate);

  const forms = new Set<string>([
    String(e),
    e.toFixed(1),
    e.toFixed(2),
    e.toFixed(3),
    String(e).replace(/^0\./, "."), // statutes write $.015, never $0.015
    e.toLocaleString("en-US"),
  ]);
  // A share can be printed as a percent. Seiler stores 0.97 and prints "97%".
  // Only for values below 1, so 2.06 never goes looking for "206".
  if (e > 0 && e < 1) {
    forms.add(String(e * 100));
    forms.add((e * 100).toFixed(0));
    forms.add((e * 100).toFixed(1));
  }

  for (const f of forms) {
    if (f && containsNumber(q, normalizeForMatch(f))) return true;
  }
  return false;
}

/**
 * Substring matching is not enough for numbers. Rounding 2.6 to "3" matched the
 * "3" inside "2.38" and happily verified a number the paper never printed. A
 * numeric match must not be flanked by more digits or a decimal point.
 */
function containsNumber(haystack: string, needle: string): boolean {
  if (!needle) return false;
  let from = 0;
  for (;;) {
    const i = haystack.indexOf(needle, from);
    if (i === -1) return false;
    const before = i === 0 ? "" : haystack[i - 1];
    const after = haystack[i + needle.length] ?? "";
    if (!/[0-9.]/.test(before) && !/[0-9.]/.test(after)) return true;
    from = i + 1;
  }
}

/** The gate the UI actually calls. */
export function checkQuote(r: Row): QuoteCheck {
  if (r.estimate_kind === "null_result") {
    return {
      ok: true,
      kind: "null_result",
      detail:
        "This paper reports no effect and publishes no point estimate. The zero is this app's encoding of a null result, not a number the authors printed.",
    };
  }
  if (r.estimate_kind === "authors_counterfactual") {
    // The number is real and published, but it describes a world that did not
    // happen. It is the authors' model output under assumptions they state, not
    // something anyone measured. Saying "verified" here would be true about the
    // transcription and misleading about the epistemics.
    return {
      ok: estimateInQuote(r),
      kind: "authors_counterfactual",
      detail:
        "Published by the authors, but a counterfactual: a rate nobody levied, computed under assumptions they state. Not an observation.",
    };
  }
  if (r.estimate_kind === "budget_estimate") {
    return {
      ok: true,
      kind: "budget_estimate",
      detail: "A figure the city forecast, not money it collected.",
    };
  }
  if (estimateInQuote(r)) {
    return { ok: true, kind: "verified", detail: "This number appears in the quoted sentence." };
  }
  return {
    ok: false,
    kind: "unverified",
    detail:
      "The stored number does not appear in the stored quote, so it is not displayed. This is a transcription failure, not a finding.",
  };
}

/** Revenue arithmetic. Division, not economics. */
export function taxedOunces(revenueDollars: number, centsPerOunce: number): number {
  if (centsPerOunce <= 0) throw new Error("centsPerOunce must be positive");
  return revenueDollars / (centsPerOunce / 100);
}
