# Philly Receipts

**https://philly-receipts.vercel.app**

Ask what a Philadelphia policy did. You get every published estimate side by side
with the researchers' names on it, and a refusal when the literature does not
support an answer.

Built solo at OwlHacks 2026.

---

## The one rule

**No model produces any number that appears on screen.**

Every figure is hand-typed from the paper into `lib/corpus.json` and rendered
through a provenance check that throws on any id it cannot find. The only model
call in the product routes your question to an outcome. It returns a label, never
a quantity. If it routes wrong, you see the wrong chart and fix it with one
click. It cannot invent a number.

## Why this instead of a policy simulator

Ask an LLM what doubling the soda tax would do and it will tell you, fluently,
with a number. That number is unfalsifiable: it describes a world that does not
exist, so nothing can ever check it.

Philadelphia's 2017 beverage tax is the opposite situation. It actually happened,
several teams measured it, and **they got different answers**. That disagreement
is the most useful thing in the literature and it is exactly what gets flattened
when someone quotes a single figure.

So this tool does not predict. It shows you the spread, names who produced each
end of it, and refuses when the evidence runs out.

## What it does that a chart does not

**It proves the studies disagree, in code.** GRADE's inconsistency rule says a
set of intervals is consistent only when `max(lows) <= min(highs)`. For
pass-through the highest low is **1.75** (Bleich) and the lowest high is **1.11**
(Petimar). 1.75 > 1.11, so they do not all overlap. That is one comparison, it
runs on every render, and it is a test in `lib/band.test.ts`.

**It excludes rather than imputes.** The published range is the lowest published
low to the highest published high. Papers that published no interval are left out
of it and named as left out. Nothing is averaged, because an average of four
disagreeing teams is a fifth number nobody measured.

**It refuses to share an axis between different units.** Seiler reports 0.97 as a
*share of the tax*. Petimar reports 1.02 *cents per ounce*. On one axis those sit
side by side and read as agreement. They are not the same quantity, so Seiler is
shown separately with the reason. Employment is worse, three papers and three
units, so that view **draws no chart at all** and says why.

**It finds where the conclusion flips.** The tax is 1.5 cents per ounce. Below
that, retailers absorbed part of it; above it, shoppers paid more than the tax
itself. The published range runs 0.94 to 2.38, so it straddles that line and the
evidence does not settle which happened. No paper reports this, because it is a
statement about the set of papers rather than any one of them.

**It shows when the method decides the answer.** Two rows in the health view are
the same paper, the same city, the same three years. The panel sample follows the
same adults over time and its interval crosses zero. The cross-sectional sample
takes different people each period and its interval does not. The dental paper
splits exactly the same way. Whether this tax improved health depends on how you
build your sample, and the published work does not settle it.

That needed a signal beyond consistency. Two intervals can overlap each other
while one contains zero and the other does not, so "the studies agree" on its own
hides the disagreement people actually care about. Every row with an interval says
which side of zero it falls on.

**It refuses on jurisdiction.** Ask it to raise the minimum wage and it will not
model it, because Pennsylvania's Minimum Wage Act preempts municipalities from
setting one. Ask about firearms and 18 Pa.C.S. § 6120 preempts that too.
Philadelphia has passed such ordinances and lost in court. A mayor cannot do these
things, so there is nothing to simulate. This list is hand-written with statutes
attached. A model never decides preemption.

## The corpus

24 rows across seven outcomes: price pass-through, net volume, in-city volume,
health, employment, revenue, and where the money went. 9 rows carry a published confidence interval. One is
industry funded and labelled as such on screen.

Every row stores the verbatim sentence its number came from. Rows are also tagged
by what KIND of number they hold, which matters more than it sounds:

- `reported` the figure is printed in the source
- `null_result` the paper found no effect and published no point estimate. The
  zero in the employment row is this app's encoding, not Marinello's number, and
  it is labelled that way on screen
- `statute` the rate as written in the Philadelphia Code
- `official_record` collections as filed by the city
- `budget_estimate` a city forecast, not money collected

## Traps encoded on purpose

Each of these is a real error that a careless build would ship:

- Pass-through **percentages** have no confidence intervals in any of these
  papers. The intervals belong to the cents-per-ounce figures only. An interval
  drawn beside a percentage is fabricated.
- Roberto's store-type intervals bracket a difference-in-differences in million
  ounces per four-week period, not the percent. Attaching them to the percent
  would be wrong by a unit.
- Philadelphia's FY2026 collections figure covers eleven months, not twelve. The
  revenue view uses FY2025 so the division is against a full year.
- Source sentences carry publisher Unicode: thin spaces in JAMA's digit grouping,
  commas in Lancet's, smart quotes, an eszett. `normalizeForMatch` handles these
  so a quote check fails for real reasons only.

## Stack

Next.js 16 App Router, TypeScript, Tailwind v4, deployed on Vercel.

The forest plot is hand-written inline SVG. No charting library. The evidence is
a JSON file. No database. **Zero dependencies beyond what `create-next-app`
installed.**

```
lib/band.ts        band, GRADE consistency, tipping point, transcription guard, unit partition
lib/band.test.ts   27 tests over that math, including a corpus-wide transcription check
lib/corpus.ts      outcome config and the provenance guard
lib/router.ts      the scope gate, rules layer
lib/router.test.ts 11 tests over routing and refusals
components/        Forest, SourceRow, Cited
app/api/route-proposal/  the one model call, optional
```

## Run it

```bash
npm install
npm test        # 38 tests, no network
npm run verify  # typecheck + tests + production build
npm run dev
```

It runs with **no API keys at all.** The rules layer handles every path in the
demo. Keys only add a model fallback for inputs the rules cannot classify:

- `TYPESAFE_API_KEY` for TypeSafe Jev, tried first
- `ANTHROPIC_API_KEY` for Claude, tried second

With neither set, an unclassifiable input gets the no-evidence refusal, which is
the correct answer anyway.

## What this is not

It covers one tax in one city. The studies it cites do not agree, and the tool's
whole job is to show you that rather than resolve it. It will not tell you whether
the tax was good policy. That is a judgement about tradeoffs, and no forest plot
settles it.

## MLH rules

Every line of code and every corpus row was written during the event. First commit
is stamped `2026-09-26 10:18:00 -0400`. Research notes and design were brought in,
which Rule 9 permits; no code was. Repo public per Rules 12-13. `.env*` gitignored
from the first commit.
