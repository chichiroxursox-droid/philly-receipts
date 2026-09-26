"use client";

import { corpusScope } from "@/lib/corpus.ts";

/**
 * Says up front what is encoded and, just as importantly, what is not.
 *
 * Narrow coverage is the honest cost of the governing rule: every number is
 * hand-typed from its paper, so the corpus grows at the speed of reading, not
 * the speed of scraping. Saying that out loud is better than letting a reader
 * discover it by being refused three times.
 */
export default function Scope() {
  const s = corpusScope();
  return (
    <section className="mt-8 rounded-xl border border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-900/50">
      <h2 className="text-[13px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
        What is encoded
      </h2>

      <p className="mt-2 text-[15px] leading-relaxed text-neutral-800 dark:text-neutral-200">
        One policy: the <strong>Philadelphia Beverage Tax</strong>, in force since January 2017.{" "}
        <span className="tabular-nums">{s.rows}</span> rows from{" "}
        <span className="tabular-nums">{s.sources}</span> sources,{" "}
        <span className="tabular-nums">{s.dois}</span> with a DOI,{" "}
        <span className="tabular-nums">{s.withInterval}</span> carrying a published confidence
        interval, <span className="tabular-nums">{s.industryFunded}</span> industry funded and
        labelled as such.
      </p>

      <p className="mt-3 text-[13.5px] font-medium text-neutral-700 dark:text-neutral-300">
        Questions it can answer:
      </p>
      <ul className="mt-1.5 grid gap-1 text-[13.5px] text-neutral-600 sm:grid-cols-2 dark:text-neutral-400">
        {s.questions.map((q) => (
          <li key={q}>{q}</li>
        ))}
      </ul>

      <p className="mt-4 border-t border-neutral-200 pt-3 text-[13.5px] leading-relaxed text-neutral-600 dark:border-neutral-800 dark:text-neutral-400">
        <strong className="text-neutral-800 dark:text-neutral-200">
          Ask about anything else and it will refuse.
        </strong>{" "}
        That narrowness is the price of the rule this is built on: no model produces any number
        here, so every row had to be read out of its paper and typed by hand. The corpus grows at
        the speed of reading, not the speed of scraping. A tool that answered everything would be
        making most of it up.
      </p>
    </section>
  );
}
