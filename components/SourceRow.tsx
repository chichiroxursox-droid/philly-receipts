"use client";

import { checkQuote, hasInterval, type Row } from "@/lib/band.ts";

const BADGE: Record<string, { label: string; cls: string }> = {
  verified: {
    label: "number found in quote",
    cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  null_result: {
    label: "null result, no point estimate published",
    cls: "bg-neutral-200 text-neutral-700 dark:bg-neutral-700/50 dark:text-neutral-300",
  },
  budget_estimate: {
    label: "forecast, not collections",
    cls: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  },
  unverified: {
    label: "number NOT found in quote, figure withheld",
    cls: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
  },
};

export default function SourceRow({
  row,
  selected,
  onSelect,
}: {
  row: Row;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const check = checkQuote(row);
  const badge = BADGE[check.kind];
  return (
    <li
      id={`src-${row.id}`}
      className={`rounded-lg border p-4 transition-colors ${
        selected
          ? "border-sky-400 bg-sky-50/60 dark:border-sky-500/60 dark:bg-sky-500/5"
          : "border-neutral-200 bg-white/50 dark:border-neutral-800 dark:bg-neutral-900/40"
      }`}
      onClick={() => onSelect(row.id)}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.study}</p>
        {row.industry_funded && (
          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-medium text-orange-800 dark:bg-orange-500/15 dark:text-orange-300">
            industry funded
          </span>
        )}
      </div>

      <p className="mt-2 text-[15px] tabular-nums text-neutral-900 dark:text-neutral-100">
        <span className="font-semibold">
          {check.ok ? row.estimate.toLocaleString() : "withheld"}
        </span>{" "}
        <span className="text-neutral-500 dark:text-neutral-400">{row.units}</span>
        {hasInterval(row) ? (
          <span className="text-neutral-500 dark:text-neutral-400">
            {"  95% CI "}
            {row.ci_low}, {row.ci_high}
          </span>
        ) : (
          <span className="ml-2 text-[13px] italic text-neutral-400 dark:text-neutral-500">
            no interval published
          </span>
        )}
      </p>

      <p className="mt-2">
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${badge.cls}`}>
          {badge.label}
        </span>
      </p>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-neutral-500 dark:text-neutral-400">
        {check.detail}
      </p>

      {row.note && (
        <p className="mt-1 text-[13px] text-neutral-600 dark:text-neutral-400">{row.note}</p>
      )}

      <blockquote className="mt-3 border-l-2 border-neutral-300 pl-3 text-[13.5px] leading-relaxed text-neutral-700 dark:border-neutral-700 dark:text-neutral-300">
        {row.quote}
      </blockquote>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-neutral-500 dark:text-neutral-400">
        <span>Funding: {row.funder}</span>
        {row.doi && (
          <a
            href={`https://doi.org/${row.doi}`}
            target="_blank"
            rel="noreferrer"
            className="text-sky-700 underline underline-offset-2 dark:text-sky-400"
            onClick={(e) => e.stopPropagation()}
          >
            doi.org/{row.doi}
          </a>
        )}
        <span className="font-mono text-neutral-400 dark:text-neutral-600">{row.id}</span>
      </div>
    </li>
  );
}
