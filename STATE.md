# STATE

Read first at every session start. Append only, never rewrite.
If a checkpoint runs 90 minutes late, apply the next scope cut and log it.

| Clock | Hour | Done-when | Status |
|---|---|---|---|
| Sat 11:00am | 1 | Repo live, deployed to prod once, real URL returns 200 | DONE 10:50 |
| Sat 1:00pm | 3 | Band math works in isolation with a passing test | DONE EARLY |
| Sat 3:00pm | 5 | Corpus typed, forest plot renders from it | |
| **Sat 6:00pm** | **8** | **GATE: a judge could use it end to end on the prod URL** | |
| Sat 8:00pm | 10 | Scope router and all three refusal states work. No new deps after this | |
| Sat 10:00pm | 12 | Backup screen recording saved to phone. Tagged v0-demo | |
| Sun 12:30am | 14.5 | README and Devpost draft done | |
| Sun 4:30am | 18.5 | Awake, fresh eyes on the demo path only | |
| **Sun 6:00am** | **20** | **CODE FREEZE. Tagged v1. Bug fixes only** | |
| Sun 9:30am | 23 | **SUBMITTED**, before leaving for church | |
| Sun 12:15pm | | Back on site, judging at 12:30 | |

## Log

### Sat 10:20am, Hour 0.3
- Milestone: band math complete and tested, roughly 2.5 hours ahead of plan
- Done-when result: `node --test lib/band.test.ts` passes 13 of 13. band, GRADE consistency, tipping point, quote normalization, revenue arithmetic all green
- Real finding baked in: pass-through intervals do NOT all overlap (max low 1.75 Bleich, min high 1.11 Petimar), so the disagreement is provable in code
- What broke: nothing. create-next-app install was slow, so the band math was written while it ran
- Next step: git init and first deploy, then type the corpus
- Scope cuts applied so far: none

### Sat 10:50am, Hour 0.8
- Milestone: HIT. Hour-1 gate cleared early.
- Done-when result: https://philly-receipts.vercel.app returns 200. `npx next build` clean. `node --test lib/band.test.ts` 15 of 15 green. Corpus has 14 rows through Cut Line B plus revenue.
- What broke: two things, both fixed. create-next-app took about 20 minutes, so the band math got written while it installed. Then the test file's `.ts` import failed the Next typecheck, fixed by excluding `**/*.test.ts` in tsconfig.
- Also fixed: the Lawman quote contained an eszett that would never substring-match, so the stored quote is now the numeric span only. Normalizer hardened for publisher digit grouping (JAMA thin spaces, Lancet commas) with two new tests.
- Next step: components/Forest.tsx inline SVG, then wire app/page.tsx to the corpus. Target: forest plot rendering by 1:00pm.
- Scope cuts applied so far: none. Running ahead.
- NEEDED FROM ETHAN: ANTHROPIC_API_KEY in .env.local before the scope router (hour 8-10). Not blocking yet.
