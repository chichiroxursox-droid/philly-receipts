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

### Sat 1:20pm, Hour 3.3

- Milestone: corpus 16 to 24 rows, and a new Health outcome that is now the strongest thing in the app.
- **The finding:** two rows in the Health view are the SAME paper, same city, same three years. Petimar 2024's panel sample follows the same adults and its interval crosses zero. The cross-sectional sample takes different people each period and its interval does not. Petimar 2023's dental paper splits identically. So whether this tax improved health depends on how you build your sample, and the published work does not settle it.
- **That forced a new signal.** Two intervals can OVERLAP each other while one contains zero and the other does not. GRADE calls those studies consistent, and they are, but consistency alone hides the disagreement anyone actually cares about. `crossesZero` is now shown per row.
- Also added PHLpreK rows so the revenue tab can say where the money went.

- What broke:
  1. **Both plotted Health rows rendered as "Petimar et al. 2024"**, which destroys the entire point of that view. Rows now carry an optional plot label, guarded by a test that no two rows of one study can render identically. That test immediately found two more groups I had missed (Seiler, PHLpreK).
  2. **A patch that did nothing and said nothing.** Adding `label?` to the Row type used an anchor reading "Scope caveat" when the file said "Scope/window caveat". Python's `str.replace` no-ops silently. `npm test` STILL PASSED, because Node strips TypeScript types without checking them, so only the Vercel build caught it. Every patch now asserts its anchor exists before and after.
  3. **README claimed ten intervals; there are nine.** Counted from the corpus instead of from memory.

- Process change: added `npm run verify` = tsc + tests + build. Run it before every deploy. `npm test` alone cannot catch a type error in this project.
- Done-when result: 38 of 38 tests green, verify clean, deployed, all five tabs walked in a real browser on prod with zero console errors. Backup video re-recorded, 55.2s, now includes the Health beat.
- Next step: nothing blocking. Remaining work is Ethan's.
- Scope cuts applied so far: NONE.

### Sat 1:35pm, Hour 3.6

- Milestone: read the OwlHacks 2026 Devpost page directly. It answers the judging question we parked last night, and it changes the submission.
- **Devpost deadline is Sep 27 10:00am EDT**, so the 9:30am target holds a 30 minute buffer.
- **JUDGING CRITERIA still says literally "TBD"** on the page. Not answerable from Devpost. Ask a volunteer at check in.
- **THERE ARE NO TRACKS IN 2026.** The 2025 structure including Philly Special is gone. Three generic prizes plus eight MLH sponsor prizes, eleven total. The Devpost draft said "Track: Philly Special" and that line is now removed. It would have been wrong on the submission.
- **All six judges are professors.** No industry judges. That is the best possible audience for a project whose pitch is methodological honesty.
- **22 participants registered on Devpost** against 11 prizes.
- Plain HTTP to Devpost now returns 403. Needs a browser user agent. Updating the old note that said plain fetch works.

- Shipped in response: **Gemini as a router provider**, with the label set enforced by the API's own `responseSchema` enum rather than by trusting the model to comply. Provider order is now `ROUTER_ORDER`, default `gemini,jev,claude`, so whichever key exists is the one that actually runs. A provider that never fires would not honestly earn a "Best Use of" tag.
- Deliberately NOT chasing Tiger Data, Vultr, Solana or Presage. Each means adding infrastructure this project does not need, and six professors would notice.
- Done-when result: 38 of 38 green, verify clean, deployed.
- Next step: Ethan's. Domain, Gemini key, read the draft, submit before 10:00am Sunday.
- Scope cuts applied so far: NONE.

### Sat 2:05pm, Hour 4.1

- Milestone: Substitution outcome added. 29 rows.
- **The finding:** Lozano-Rojas used a household panel and found people bought more sugar from sweetened foods, cancelling about 19% of the sugar drop inside the city and 37% counting border counties. Petimar used store scanner data and reported no evidence of food substitution at all. Different data, so a disagreement rather than a contradiction. Wording follows the verified sheet's warning exactly.
- The transcription guard decided what was admissible. Petimar's per-category food numbers (candy -4, sweet snacks -8, salty snacks -6) are in the paper's TABLE, but the quote I hold is the abstract's "mean 4%-8% decreases" range, which does not contain -6 at all. Rather than store a number its quote cannot support, Petimar enters as a `null_result` carrying its stated conclusion. Also refused to store Lozano-Rojas's DERIVED intervals as published ones.

- What broke:
  1. **Long labels overflowed the left gutter.** "Lozano-Rojas 2022, including border counties" is 42 characters in a gutter sized for "Petimar et al." The gutter is now measured from the longest label instead of guessed.
  2. **"no interval published" ran off the right edge** when the dot sat far right. The tag now flips to the left of the dot past 55% of the plot width.
  3. **iCloud is writing conflict files into the build directory.** `tsc` failed on `.next/types/cache-life.d 2.ts` and `routes.d 2.ts`, duplicate-identifier errors. This Desktop is iCloud-synced, which is WHY the demo video reaches the phone for free, but it also means iCloud drops "name 2.ts" copies into `.next`. 21 of them. Confined to build output, no source files and no node_modules touched. `npm run verify` now starts with `rm -rf .next`.
  4. **That clean then exposed an ordering trap:** `LayoutProps` is a global Next generates into `.next/types`, so a cleaned tree could not typecheck before building. Typed the layout explicitly instead of reordering around it.
  5. **I chained a deploy off a grep instead of off npm.** `npm run verify | grep ... && vercel deploy` chains on grep's exit code, so a failing verify still deployed. Now: run verify to a log, check `$?`, then deploy.

- Proof the safety net is real: injected `const x: number = "not a number"` into a test file, verify exited 2 with the right error, reverted, verify exited 0. Not assumed, measured.
- Done-when result: 38 of 38 green, verify exit 0 from a clean tree, six outcome tabs walked on prod with zero console errors.
- Scope cuts applied so far: NONE.

### Sat 2:35pm, Hour 4.6

- Milestone: clean across every viewport and colour scheme. 29 rows, eight outcomes, 39 tests.
- **Verified sweep:** 3 viewports x 2 colour schemes x 6 tabs = 36 view combinations. Zero overflowing text, zero horizontal page scroll, zero console errors.
- What broke: the substitution axis label was 76 characters and ran off both edges of the 392-unit phone viewBox. Volume sold was 70 and had the same defect, which I only found because the new test checks EVERY outcome rather than the one I happened to be looking at. Both shortened, invariant now enforced at 48 characters.
- Also: a patch silently did not apply because I guarded it with `node -e "require('./lib/corpus.ts')" || python3 ...`, and Node 24 strips types so the require SUCCEEDED and the `||` short-circuited. The test caught the unapplied change. Stop using `||` as a patch guard.
- Backup video re-recorded, 60.8s, now covering all six tabs including substitution.
- Done-when result: verify exit 0 from a clean tree, 39 of 39 tests, deployed, 36 view combinations clean.
- Next step: Ethan's, and nothing in the build is blocking.
- Scope cuts applied so far: NONE.

### Sat 2:55pm, Hour 5.0

- Milestone: proved the provenance guard rather than claiming it. 45 tests.
- The README and the Devpost copy both say an unsourced number cannot render. That is a claim about BEHAVIOUR, so I tested it instead of trusting the code read.
- **Method:** deliberately replaced a real corpus id with `TYPO-not-in-corpus` on the revenue panel, ran a full production build, loaded it in a real browser.
- **Result:** page renders "This page couldn't load", one page error, reading exactly `Unsourced number: no corpus row "TYPO-not-in-corpus". Every displayed figure must trace to lib/corpus.json.` The figure 68,338,441 did NOT appear anywhere. Reverted, verify exit 0.
- New `lib/provenance.test.ts` also asserts: every corpus id passes, every id hard-coded in page.tsx exists (a rename would otherwise crash at runtime), ids are unique, nothing is currently in the withheld state, and every row has a study, a quote and a funder.
- Done-when result: 45 of 45 green, verify exit 0 from a clean tree.
- Worth saying to a judge: "I broke it on purpose to show you it fails closed."
- Scope cuts applied so far: NONE.

### Sat 3:10pm, Hour 5.3

- Milestone: accessibility and performance audited on prod. No code changes needed.
- **Performance:** 356ms wall load, 97ms TTFB, 291ms DOMContentLoaded, 212KB over 10 requests. Fast enough for venue wifi with a judge watching.
- **Accessibility:** `html lang` set. Zero interactive elements without an accessible name. Zero images missing alt, zero SVGs missing aria-label. Heading order is clean H1 to H2 to H3. Focus outline is visible.
- **Keyboard:** the forest plot dots are genuinely reachable. Twelve tabs lands on "Petimar et al., 1.02 cents/oz" and Enter selects its source row. That was built on the first pass and is now verified working rather than assumed.
- **One finding, not fixed on purpose:** six tap targets are under 24 CSS px tall. All six are inline links inside running text, DOIs and "Source on GitHub" and the inline Cited figures. WCAG 2.2's target-size rule carries an explicit exception for links inline in a sentence, so these pass. Adding padding would risk a visual regression at hour 5 for a non-issue. Documented rather than churned.
- Scope cuts applied so far: NONE.

---

## HANDOFF, Sat 3:30pm, Hour 5.5

Read this first tomorrow. The build is DONE. Do not add features.

### Where it stands
- Prod: https://philly-receipts.vercel.app, 356ms load, verified across 3 viewports x 2 colour schemes x 6 tabs with zero console errors.
- Repo: github.com/chichiroxursox-droid/philly-receipts, public, 19 commits, first at Sat 10:18:00 EDT.
- 29 corpus rows, 16 sources, 11 DOIs, 9 with published intervals, 8 outcomes.
- 45 tests. `npm run verify` = clean tsc + tests + build. ALWAYS run it before deploying, and check `$?`, never chain off a grep.
- Backup video: ~/Desktop/philly-receipts-demo.mp4, 61s, already on the phone via iCloud Desktop sync.

### Blocked on Ethan, nothing else
1. Confirm he has JOINED the hackathon on Devpost. The Google Form is a different thing. The participants list needs a login, so this cannot be checked for him. **This is the only way the weekend is actually lost.**
2. Register a domain. Verified available Sat 12:05pm: receipts.tech, phillyreceipts.tech, thereceipts.tech, phillyreceipts.com/.org.
3. Free Gemini key if he wants that prize tag to be honest. Code path is live, `ROUTER_ORDER` defaults to gemini first.
4. Read devpost-draft.md and say what does not sound like him.

### Facts verified from the Devpost page, Sat ~1:25pm
- Deadline **Sun Sep 27 10:00am EDT**.
- Judging criteria: still literally "TBD".
- **No tracks in 2026.** Philly Special is gone. Do not write a track on the submission.
- Six judges, all professors.
- 11 prizes, 23 participants as of 3:30pm.

### Lessons from today, do not relearn these
- `npm test` CANNOT catch a type error here. Node strips types without checking. Only tsc or the build does.
- A python `str.replace` with a wrong anchor is a SILENT no-op. Assert the anchor before and after, every time.
- Do not use `||` as a patch guard. `node -e "require('./lib/corpus.ts')" || python3 ...` short-circuited because Node 24 strips types and the require succeeded.
- Chaining a deploy off a grep runs it even when verify failed. Write to a log, check `$?`.
- iCloud writes "name 2.ts" conflict copies into `.next` because this Desktop is synced. `verify` cleans first.
- "No overflow and no console errors" is NOT "legible". Measure rendered text size. The plot shipped 6.1px labels on a phone and every automated check passed.
- Devpost 403s a plain fetch now. Needs a browser user agent.
- Check every claim you write into the README or the Devpost copy. Two of mine were false when written: quote verification was not wired in, and the interval count was ten when it was nine.
