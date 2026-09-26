"use client";

import { corpusScope } from "@/lib/corpus.ts";

/**
 * The answer to the one question this project could not otherwise answer:
 * "what was your inclusion criterion, and what did you leave out?"
 *
 * The product's whole claim is that the spread is the finding. A spread computed
 * over a sample the author chose is a spread the author chose. Without this
 * section, one omitted study that cuts against the band turns "receipts" into
 * "curation". It is cheaper to admit the sampling frame than to defend it.
 */

const EXCLUDED: { what: string; why: string }[] = [
  {
    what: "Petimar 2022's per-category food estimates (candy -4%, sweet snacks -8%, salty snacks -6%)",
    why: "Real numbers from the paper's table, but the quote available to me is the abstract's '4%-8% decreases' range, which does not contain -6 at all. A figure whose own quote cannot support it is withheld, so this paper enters as its stated null instead.",
  },
  {
    what: "Lozano-Rojas 2022's confidence intervals",
    why: "Derivable from the paper but not printed in it. A derived interval displayed as a published one is fabricated precision.",
  },
  {
    what: "Seiler 2021's 'interpreted more cautiously' caveat sentence",
    why: "It appears in the published Journal of Marketing Research version but NOT in the working paper I can actually open. I will not quote a sentence I have not read in the copy I hold.",
  },
  {
    what: "Philadelphia's FY2026 revenue as an annual figure",
    why: "It covers eleven months, not twelve. It is included, but labelled as eleven months, because comparing it to a full year is the most common way this tax is misreported.",
  },
  {
    what: "Every soda tax outside Philadelphia (Berkeley, Seattle, Oakland, Boulder, Mexico, UK)",
    why: "Different rates on different products in different markets. Borrowing them would be the transfer error this tool exists to refuse.",
  },
];

export default function Methods() {
  const s = corpusScope();
  return (
    <section className="mt-10 rounded-xl border border-neutral-300 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-900/60">
      <h2 className="text-[13px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
        How this corpus was assembled, and what is missing
      </h2>

      <p className="mt-3 text-[14.5px] leading-relaxed text-neutral-800 dark:text-neutral-200">
        <strong>This is a convenience sample, not a systematic review.</strong> I typed every
        number I could find in the peer-reviewed Philadelphia Beverage Tax literature, plus the
        City&rsquo;s own revenue statements and the Philadelphia Code. I did not run a registered
        search protocol, so I cannot claim completeness. The range you see is the range of what I
        found, not the range of what exists.
      </p>

      <dl className="mt-4 grid gap-x-6 gap-y-2 text-[13.5px] sm:grid-cols-[auto_1fr]">
        <dt className="font-medium text-neutral-700 dark:text-neutral-300">Scope</dt>
        <dd className="text-neutral-600 dark:text-neutral-400">
          Philadelphia only. The tax as enacted, 1.5 cents per fluid ounce, in force since 1 January
          2017.
        </dd>
        <dt className="font-medium text-neutral-700 dark:text-neutral-300">Sources used</dt>
        <dd className="text-neutral-600 dark:text-neutral-400">
          Peer-reviewed journals reachable by DOI, the Philadelphia Revenue Department&rsquo;s
          published collections statements, and the Philadelphia Code. {s.sources} sources,{" "}
          {s.dois} with a DOI.
        </dd>
        <dt className="font-medium text-neutral-700 dark:text-neutral-300">Inclusion rule</dt>
        <dd className="text-neutral-600 dark:text-neutral-400">
          A row renders only if its number literally appears in the verbatim sentence stored beside
          it. Everything else is withheld, visibly.
        </dd>
        <dt className="font-medium text-neutral-700 dark:text-neutral-300">Not adjudicated</dt>
        <dd className="text-neutral-600 dark:text-neutral-400">
          Where studies disagree, nothing is pooled, averaged or ranked. No study is called wrong.
        </dd>
      </dl>

      <h3 className="mt-5 text-[13px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
        Deliberately excluded, with reasons
      </h3>
      <ul className="mt-2 space-y-2.5 text-[13.5px] text-neutral-600 dark:text-neutral-400">
        {EXCLUDED.map((e) => (
          <li key={e.what}>
            <span className="text-neutral-900 dark:text-neutral-100">{e.what}</span>
            <br />
            {e.why}
          </li>
        ))}
      </ul>

      <h3 className="mt-5 text-[13px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
        Known gaps
      </h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-[13.5px] text-neutral-600 dark:text-neutral-400">
        <li>
          No volume estimate in this corpus carries a published confidence interval. Volume is the
          outcome a mayor most wants to move, and it is the one where the literature gives the least
          quantified uncertainty.
        </li>
        <li>
          Pass-through <em>percentages</em> carry no intervals in any of these papers. Intervals
          belong to the cents-per-ounce figures only.
        </li>
        <li>
          One searcher, one weekend, English language only. A second reader would likely find rows I
          missed.
        </li>
        <li>
          No long-run outcomes. The longest follow-up here ends in 2019, and the tax is still in
          force.
        </li>
      </ul>

      <p className="mt-5 border-t border-neutral-200 pt-3 text-[13.5px] leading-relaxed text-neutral-700 dark:border-neutral-800 dark:text-neutral-300">
        The corpus is a single public JSON file with a citation on every row. If I have missed a
        study, or included one I should not have, the fix is a pull request rather than an argument.
      </p>
    </section>
  );
}
