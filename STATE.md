# STATE

Read first at every session start. Append only, never rewrite.
If a checkpoint runs 90 minutes late, apply the next scope cut and log it.

| Clock | Hour | Done-when | Status |
|---|---|---|---|
| Sat 11:00am | 1 | Repo live, deployed to prod once, real URL returns 200 | DONE 10:50 |
| Sat 1:00pm | 3 | Band math works in isolation with a passing test | DONE EARLY |
| Sat 3:00pm | 5 | Corpus typed, forest plot renders from it | DONE 11:35, 3.5h early |
| **Sat 6:00pm** | **8** | **GATE: a judge could use it end to end on the prod URL** | **HIT 11:35** |
| Sat 8:00pm | 10 | Scope router and all three refusal states work. No new deps after this | DONE 11:35, zero new deps |
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

### Sat 11:35am, Hour 1.6

- Milestone: HIT, and the hour-8 gate is cleared six and a half hours early. A judge can use the prod URL end to end right now.
- Done-when result: https://philly-receipts.vercel.app serves the real app. Verified in a real browser on a production build, zero console errors. All three verdict states work on prod. 29 of 29 tests green. `npx next build` clean. Zero new dependencies.
- Public repo created and pushed: github.com/chichiroxursox-droid/philly-receipts. Rules 12-13 satisfied. First commit stamped 2026-09-26 10:18:00 EDT, which is the Rule 6 receipt.

- What broke, and what it taught:
  1. **Jev key returns 401.** Bearer is the right scheme, proven by contrast: every other header shape returns 403 "Must supply an API key" while Bearer returns 401 "check your API key". `/health` is 200. So the service is up and the request is well formed; the key itself is rejected, almost certainly unbilled. NOT blocking, because the router was built rules-first.
  2. **`next dev` silently overwrote CLAUDE.md** with a one-line `@AGENTS.md` pointer, deleting the governing rules. Restored from the bell-time source and committed. Watch for this after any `next dev` run.
  3. **Node ESM needs explicit `.ts` extensions, Next's typecheck rejected them.** Fixed properly with `allowImportingTsExtensions`, which also let the test files back under the typechecker instead of staying excluded.
  4. **Two real routing bugs the tests caught, not me.** "Ban assault weapons" missed because the regex said `assault weapon` with a trailing `\b`. And "Did the beverage tax cost jobs?" routed to PRICES, because the subject term "beverage tax" outvoted the only outcome word in the sentence. Fixed by splitting SUBJECT terms from OUTCOME terms and treating a tie as ambiguous rather than letting list order decide.

- Design decision worth defending to a judge: **the forest plot refuses to share an axis between rows that do not share a unit.** Seiler reports 0.97 as a SHARE of the tax; on a cents-per-ounce axis it lands beside Petimar's 1.02 and reads as agreement. It is not agreement. Employment is worse: three papers, three units, so that view draws no chart at all and says why. `partitionByUnits` in lib/band.ts, three tests.

- Next step: README and Devpost draft, then the backup screen recording, then domain. The build is far enough ahead that polish and submission materials are now the critical path, not features.
- Scope cuts applied so far: NONE. Nothing has been cut.
- NEEDED FROM ETHAN: (1) add billing to TypeSafe if you want Jev in the demo, key is already in Vercel prod env and wired; (2) ANTHROPIC_API_KEY only if you want the Claude fallback, also optional. The product is complete without either.

### Sat 12:05pm, Hour 2.1

- Milestone: submission materials done. Feature work is finished; everything left is Ethan's to execute.
- Done-when result: README committed. Devpost draft written to Operating Systems `references/temple-ai-lab/owlhacks/receipts/devpost-draft.md`, NOT posted, awaiting voice review. Backup demo recorded: 39s, 1.3MB H.264 mp4 at `~/Desktop/philly-receipts-demo.mp4`, verified frame by frame to contain all six demo beats.
- Recording is reproducible: `node .demo/record.mjs [url]`. Video output gitignored. If the venue wifi dies Sunday, that file IS the demo.

- What broke:
  1. `.demo/record.mjs` wrote into a percent-encoded directory because `new URL(...).pathname` keeps `%20` and this repo lives under "CLAUDE CODE". Fixed with `fileURLToPath`. Also shadowed the global `URL` with a const named `URL`.
  2. **Domain availability check was wrong the first time.** `rdap.nic.tech` returns an HTML page with HTTP 200 for every query, so "200 means registered" marked every .tech as taken. Caught it with a nonsense-domain control. Re-ran through the rdap.org redirector with two controls (nonsense = 404, google.com = 200) before trusting any result. LESSON: never read an availability or existence check without a positive AND negative control.

- Domain, verified available as of 12:05pm Sat: **receipts.tech**, phillyreceipts.tech, showmethereceipts.tech, thereceipts.tech, phillyreceipts.com, phillyreceipts.org. `receipts.tech` is the pick. MLH normally hands out free .tech vouchers at the sponsor table.

- Next step: nothing blocking. Optional polish only. Remaining work is Ethan's: register the domain, AirDrop the mp4 to his phone, review the Devpost draft, submit.
- Scope cuts applied so far: NONE.

### Sat 12:35pm, Hour 2.6

- Milestone: shipped the two things that were tested but never wired into the product, plus a corpus honesty fix I found by auditing my own Devpost draft.
- Trigger: I had written "quote verification matches the stored sentence against the source" in the Devpost draft. Checked, and `quoteVerified` and `tippingPoint` existed in lib/band.ts with passing tests but were called from nowhere in the app. That claim would have been false in front of judges.

- Shipped:
  1. **Transcription guard.** Every displayed figure must literally appear in the sentence quoted beneath it, or the number is withheld and the row shows why. Runs over the whole corpus as a test.
  2. **Tipping point.** The published range 0.94 to 2.38 straddles the 1.5 cent statutory rate, so the evidence cannot say whether shoppers paid more or less than the tax itself.
  3. **Corpus 14 to 16 rows**, all tagged by what KIND of number they hold.

- What broke, and it was my own verification code:
  1. **The guard verified a wrong number.** `Math.round` made a fake 2.6 match Bleich, because the "3" it rounded to appears inside "2.38". A guard that says yes to a wrong number is worse than no guard. Numeric matches now require non-digit boundaries on both sides.
  2. **Seiler stores 0.97 but prints "97%"**, so shares below 1 also try percent forms.
  3. **The employment zero was not a finding.** Marinello reports no effect and publishes no point estimate. Storing 0 makes a null indistinguishable from a measured zero. Now tagged `null_result` and labelled as this app's encoding on screen.
  4. **The revenue view called city records "papers"**, inherited from the employment copy. Each outcome now carries its own no-chart reason, with a test that one exists.
  5. Two empty quotes on the city rows are now filled from the verified sheet, so all 16 rows pass the guard.

- Done-when result: 35 of 35 tests green. Build clean. Deployed and verified on prod. Backup video re-recorded against prod, now 49.8s covering the tipping point, the verification badges and the revenue arithmetic.
- Next step: nothing blocking. Remaining work is Ethan's: register the domain, AirDrop the mp4, review the Devpost draft, submit.
- Scope cuts applied so far: NONE. The two "scope cut candidates" from the plan both shipped instead.

### Sat 1:00pm, Hour 3.0

- Milestone: responsive fix. Found by testing rather than by looking.
- **The bug:** SVG text scales with the viewBox. A 760-wide viewBox squeezed into a 350px phone rendered the 13px study labels at **6.1px**, which is unreadable. The page had no horizontal overflow and zero console errors, so every automated check passed while the chart was useless on a phone. Measured the rendered text height instead of trusting "it fits."
- **The fix:** two layouts. Below 640px the viewBox narrows to 392 and the study name moves above its own interval instead of sitting in a left gutter. Labels now render at 11.1px on iPhone, 12.2 on iPad, 14 on desktop. Verified on prod at all three widths: no page overflow, no text past the SVG edge, zero errors.
- Done-when result: 35 of 35 tests green, build clean, deployed, verified on three viewports in both colour schemes.
- LESSON worth keeping: "no overflow and no console errors" is not the same as "legible." Measure the rendered size of the smallest text.
- Next step: nothing blocking. Remaining work is Ethan's.
- Scope cuts applied so far: NONE.
