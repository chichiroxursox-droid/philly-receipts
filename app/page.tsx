"use client";

import { useMemo, useState } from "react";
import Forest from "@/components/Forest";
import SourceRow from "@/components/SourceRow";
import Cited from "@/components/Cited";
import TippingPoint from "@/components/TippingPoint";
import { taxedOunces } from "@/lib/band.ts";
import { OUTCOMES, outcomeById, rowById, viewFor, type OutcomeId } from "@/lib/corpus.ts";
import { noEvidence, routeByRules, type Routing } from "@/lib/router.ts";

const EXAMPLES = [
  "What if Philadelphia doubled the soda tax?",
  "Did the beverage tax cost jobs?",
  "Did people just buy soda outside the city?",
  "Raise the Philly minimum wage to $20 an hour",
  "What would a soda tax do in Chicago?",
  "Build a monorail down Broad Street",
];

export default function Home() {
  const [input, setInput] = useState("");
  const [routing, setRouting] = useState<Routing | null>(null);
  const [outcomeId, setOutcomeId] = useState<OutcomeId>("price_pass_through");
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function ask(text: string) {
    setInput(text);
    setSelected(null);
    const local = routeByRules(text);
    if (local) {
      setRouting(local);
      if (local.matched_outcome) setOutcomeId(local.matched_outcome);
      return;
    }
    // Ambiguous. Only now does anything leave the machine.
    setBusy(true);
    try {
      const res = await fetch("/api/route-proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const r: Routing = res.ok ? await res.json() : noEvidence(text);
      setRouting(r);
      if (r.matched_outcome) setOutcomeId(r.matched_outcome);
    } catch {
      setRouting(noEvidence(text));
    } finally {
      setBusy(false);
    }
  }

  const outcome = outcomeById(outcomeId)!;
  const view = useMemo(() => viewFor(outcome), [outcome]);
  const showResults = routing?.verdict === "have_evidence";

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-10 sm:py-14">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Philly Receipts</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-neutral-600 dark:text-neutral-300">
          Ask what a Philadelphia policy did. You get every published estimate side by side with the
          researchers&rsquo; names on it, and a refusal when the literature does not support an
          answer. Nothing here is a forecast. Every number traces to a paper you can open.
        </p>
      </header>

      <form
        className="mt-8"
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="What if Philadelphia doubled the soda tax?"
            aria-label="Policy proposal"
            className="min-w-0 flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-3 text-[15px] outline-none placeholder:text-neutral-400 focus:border-sky-500 dark:border-neutral-700 dark:bg-neutral-900"
          />
          <button
            type="submit"
            disabled={busy}
            className="shrink-0 rounded-lg bg-neutral-900 px-5 py-3 text-[15px] font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
          >
            {busy ? "Checking" : "Show me"}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {EXAMPLES.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => ask(e)}
              className="rounded-full border border-neutral-300 px-3 py-1 text-[12.5px] text-neutral-600 hover:border-neutral-500 hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-100"
            >
              {e}
            </button>
          ))}
        </div>
      </form>

      {routing && (
        <section
          className={`mt-6 rounded-xl border p-4 ${
            routing.verdict === "have_evidence"
              ? "border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/50"
              : "border-amber-300 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-500/10"
          }`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            {routing.verdict === "have_evidence"
              ? "Evidence found"
              : routing.verdict === "out_of_jurisdiction"
                ? "Refused: outside the city's power"
                : "Refused: no evidence encoded"}
            <span className="ml-2 font-normal normal-case tracking-normal">
              decided by {routing.decided_by}
            </span>
          </p>
          <p className="mt-1.5 text-[14.5px] leading-relaxed text-neutral-800 dark:text-neutral-200">
            {routing.reason}
          </p>
        </section>
      )}

      {showResults && (
        <>
          <nav className="mt-10 flex flex-wrap gap-2" aria-label="Outcomes">
            {OUTCOMES.map((o) => (
              <button
                key={o.id}
                onClick={() => {
                  setOutcomeId(o.id);
                  setSelected(null);
                }}
                className={`rounded-lg px-3 py-2 text-[13.5px] font-medium ${
                  o.id === outcomeId
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                    : "border border-neutral-300 text-neutral-600 hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-100"
                }`}
              >
                {o.short}
              </button>
            ))}
          </nav>

          <h2 className="mt-8 text-xl font-semibold tracking-tight">{outcome.question}</h2>

          {outcome.plotUnits ? (
            <div className="mt-5">
              <Forest
                rows={view.plotted}
                band={view.band}
                consistency={view.consistency}
                unitLabel={outcome.axisLabel}
                selectedId={selected}
                onSelect={setSelected}
              />
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed border-neutral-400 p-5 dark:border-neutral-600">
              <p className="text-[14.5px] font-medium text-neutral-900 dark:text-neutral-100">
                No chart, on purpose.
              </p>
              <p className="mt-1.5 text-[14px] leading-relaxed text-neutral-600 dark:text-neutral-300">
                {outcome.noChartReason}
              </p>
              <ul className="mt-3 space-y-1 text-[13.5px] text-neutral-600 dark:text-neutral-400">
                {[...view.plotted, ...view.otherScale].map((r) => (
                  <li key={r.id}>
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">
                      {r.study.split(",")[0]}
                    </span>{" "}
                    reported in <span className="italic">{r.units}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-neutral-700 dark:text-neutral-300">
            {outcome.takeaway}
          </p>

          {outcome.plotUnits && view.otherScale.length > 0 && (
            <div className="mt-5 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-[13.5px] dark:border-neutral-800 dark:bg-neutral-900/50">
              <p className="font-medium text-neutral-900 dark:text-neutral-100">
                Kept off the axis above
              </p>
              <ul className="mt-2 space-y-1.5 text-neutral-600 dark:text-neutral-400">
                {view.otherScale.map((r) => (
                  <li key={r.id}>
                    <span className="text-neutral-900 dark:text-neutral-100">
                      {r.study.split(",")[0]}
                    </span>{" "}
                    reports{" "}
                    <Cited rowId={r.id} onClick={setSelected}>
                      {r.estimate.toLocaleString()}
                    </Cited>{" "}
                    in <span className="italic">{r.units}</span>, which is a different scale from{" "}
                    {outcome.plotUnits}. Plotting it beside them would read as agreement.
                  </li>
                ))}
              </ul>
            </div>
          )}

          {outcomeId === "price_pass_through" && (
            <TippingPoint
              band={view.band}
              threshold={1.5}
              thresholdRowId="phila-code-rate"
              below="retailers absorbed part of the tax and shoppers paid less than its face value."
              above="the whole tax reached the shelf and then some, so shoppers paid more than the tax itself."
              onSelect={setSelected}
            />
          )}

          {outcomeId === "revenue" && <RevenuePanel onSelect={setSelected} />}

          {view.context.length > 0 && (
            <div className="mt-6">
              <h3 className="text-[13px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Context
              </h3>
              <ul className="mt-3 space-y-3">
                {view.context.map((r) => (
                  <SourceRow
                    key={r.id}
                    row={r}
                    selected={selected === r.id}
                    onSelect={setSelected}
                  />
                ))}
              </ul>
            </div>
          )}

          <div className="mt-8">
            <h3 className="text-[13px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Sources, every one of them
            </h3>
            <ul className="mt-3 space-y-3">
              {[...view.plotted, ...view.otherScale].map((r) => (
                <SourceRow key={r.id} row={r} selected={selected === r.id} onSelect={setSelected} />
              ))}
            </ul>
          </div>
        </>
      )}

      <footer className="mt-16 border-t border-neutral-200 pt-6 text-[13px] leading-relaxed text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
        <p>
          <strong className="text-neutral-700 dark:text-neutral-300">How this works.</strong> No
          model produces any number on this page. Every figure is hand-typed from the paper into a
          JSON corpus and renders only through a provenance check. The range is the lowest published
          interval low to the highest published high, never an average, and papers that published no
          interval are excluded rather than estimated. Whether studies agree is GRADE&rsquo;s
          inconsistency rule, one comparison. The only model call in the product routes your
          question to an outcome, and it never returns a quantity.
        </p>
        <p className="mt-3">
          Built solo at OwlHacks 2026.{" "}
          <a
            className="text-sky-700 underline underline-offset-2 dark:text-sky-400"
            href="https://github.com/chichiroxursox-droid/philly-receipts"
            target="_blank"
            rel="noreferrer"
          >
            Source on GitHub
          </a>
          .
        </p>
      </footer>
    </main>
  );
}

/** Collections divided by the statutory rate. Division, not economics. */
function RevenuePanel({ onSelect }: { onSelect: (id: string) => void }) {
  const collections = rowById("phila-fy2025-collections")!;
  const rate = rowById("phila-code-rate")!;
  const ounces = taxedOunces(collections.estimate, rate.estimate * 100);
  const cans = ounces / 12;

  return (
    <div className="mt-6 rounded-xl border border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-900/50">
      <p className="text-[13px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
        The arithmetic
      </p>
      <p className="mt-3 font-mono text-[14px] leading-relaxed text-neutral-900 dark:text-neutral-100">
        <Cited rowId={collections.id} onClick={onSelect}>
          ${collections.estimate.toLocaleString()}
        </Cited>
        {"  ÷  "}
        <Cited rowId={rate.id} onClick={onSelect}>
          ${rate.estimate.toFixed(3)}/oz
        </Cited>
        {"  =  "}
        <span className="font-semibold tabular-nums">
          {Math.round(ounces).toLocaleString()} ounces
        </span>
      </p>
      <p className="mt-2 text-[14px] text-neutral-600 dark:text-neutral-300">
        That is about {(cans / 1_000_000).toFixed(0)} million twelve-ounce cans the city actually
        billed tax on in FY2025. It is one division with two cited inputs. No model, no estimate, no
        forecast.
      </p>
    </div>
  );
}
