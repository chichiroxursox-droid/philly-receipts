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
  /** Scope/window caveat shown next to the row. */
  note?: string;
};

/** A row only counts toward an interval calculation if the paper actually published one. */
export function hasInterval(r: Row): boolean {
  return r.ci_low !== null && r.ci_high !== null && r.ci_low <= r.ci_high;
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

/** Revenue arithmetic. Division, not economics. */
export function taxedOunces(revenueDollars: number, centsPerOunce: number): number {
  if (centsPerOunce <= 0) throw new Error("centsPerOunce must be positive");
  return revenueDollars / (centsPerOunce / 100);
}
