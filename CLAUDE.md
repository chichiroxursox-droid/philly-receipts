@AGENTS.md

# Philly Receipts

A Philadelphia policy evidence tool. Ask what a policy did, see every credible
estimate side by side with names attached, and watch it refuse to answer when the
literature does not. Built on the Philadelphia Beverage Tax, where peer-reviewed
teams measured the same quantity and disagreed.

The product never predicts. It reports what was measured, shows the spread, and
says so when nobody knows.

## THE GOVERNING RULE

**No model produces any number that appears on screen.**

Every number renders from a `lib/corpus.json` row that was hand-typed from the
paper. The only model call in the entire product is the scope router, which
returns a routing verdict and never a quantity.

## The deterministic core

All of it lives in `lib/band.ts`. No model touches that file.

- **Band** = lowest `ci_low` to highest `ci_high` for an outcome. Not an average.
  Rows with no published interval are EXCLUDED, never imputed.
- **Do the studies agree** = GRADE inconsistency rule, `max(ci_low) <= min(ci_high)`.
  For pass-through it already FAILS. That is the story.
- **Quote check** = a displayed claim carries a verbatim quote that must
  substring-match after Unicode normalization, or the row does not render.
- **Number provenance** = no number renders without a corpus row id.
- **Tipping point** = sweep a parameter across its published range, report where
  the conclusion flips sign. The answer to "this is just a chart."
- **Revenue** = `$68,338,441 / $0.015` = ounces. Pure arithmetic.

## Verified traps (each one already bit someone)

- Pass-through PERCENTAGES have no confidence intervals in any paper. Intervals
  belong to the cents-per-ounce figures only. **An interval drawn next to a
  percentage is fabricated.**
- Roberto's store-type intervals bracket a DiD in million-ounces-per-4-week-period,
  NOT the percent. Do not attach them to the percent.
- Hua is 106.7, not 107. The 2021 pass-through paper is **Gregory**, not Edmondson.
- Substitution papers disagree using different data. They do not contradict.
- Philadelphia FY2026 `$64.6M` is ELEVEN months, not twelve. Use FY2025 for a
  full-year figure.
- Source quotes carry publisher Unicode: eszett, thin spaces, smart quotes. Store
  the numeric span when a sentence carries an exotic glyph.

## The one AI mechanism

The scope router in `app/api/route-proposal/route.ts`, and nothing else.
Returns `{ verdict, matched_outcome, reason }`. Three refusals:
- **out_of_jurisdiction** Pennsylvania preempts municipal minimum wage. A mayor
  cannot do it. Hard-coded list, the model only routes to it.
- **no_evidence** nothing in the corpus covers it. Name what the corpus does cover.
- **have_evidence** route to the outcome and render.

## Scope cut order

Electoral college teaser, tipping-point sweep, revenue branch, substitution and
BMI outcomes, the third refusal state, corpus down to 10 rows.
**Never cut:** the forest plot, the quote check, the out_of_jurisdiction refusal,
the band math and its test.

## Never do

- Never use the word "prediction" in the product, README or Devpost copy.
- Never show a probability about a policy that did not happen.
- Never render a number without a corpus row id.
- Never average the estimates into one number. The spread IS the product.
- Never draw an interval on a row where `hasInterval()` is false.
- No new dependencies after hour 10. No code changes after Sunday 6am freeze.
- No em dashes anywhere.

## Rule 9 / Rule 12-13

Research notes and design were brought in, which MLH allows. Every line of code
and every corpus row was typed after the bell. First commit 2026-09-26 10:18 EDT.
Repo is public: github.com/chichiroxursox-droid/philly-receipts.
`.env*` gitignored from commit one.

## STATE.md protocol

Append at every checkpoint: timestamp, milestone hit or missed, done-when result,
what broke, next step, scope cuts applied. Read STATE.md first every session.
If a checkpoint runs 90 minutes late, apply the next scope cut and log it.
