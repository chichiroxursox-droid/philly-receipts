"use client";

import { tippingPoint, type Band } from "@/lib/band.ts";
import Cited from "@/components/Cited";

/**
 * A computation OVER the evidence rather than a number from any single paper.
 *
 * The statutory rate is the line that separates two opposite stories: below it
 * retailers absorbed part of the tax, above it shoppers paid more than the tax
 * itself. The published range straddles that line, so the literature does not
 * settle which story is true. That sentence is the product.
 */
export default function TippingPoint({
  band,
  threshold,
  thresholdRowId,
  below,
  above,
  onSelect,
}: {
  band: Band | null;
  threshold: number;
  thresholdRowId: string;
  below: string;
  above: string;
  onSelect: (id: string) => void;
}) {
  if (!band) return null;
  const flip = tippingPoint(band.low, band.high, (x) => x - threshold);

  return (
    <div className="mt-6 rounded-xl border border-neutral-300 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-900/60">
      <p className="text-[13px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
        Where the conclusion flips
      </p>

      {flip ? (
        <>
          <p className="mt-3 text-[15px] leading-relaxed text-neutral-900 dark:text-neutral-100">
            The tax itself is{" "}
            <Cited rowId={thresholdRowId} onClick={onSelect}>
              {threshold} cents per ounce
            </Cited>
            . Sweeping the published range from {band.low} to {band.high}, the conclusion changes
            sign at exactly{" "}
            <span className="font-semibold tabular-nums">{flip.at.toFixed(2)}</span>.
          </p>
          <ul className="mt-3 space-y-1.5 text-[14px] text-neutral-700 dark:text-neutral-300">
            <li>
              <span className="font-medium">Below {threshold}:</span> {below}
            </li>
            <li>
              <span className="font-medium">Above {threshold}:</span> {above}
            </li>
          </ul>
          <p className="mt-3 text-[14px] font-medium leading-relaxed text-neutral-900 dark:text-neutral-100">
            The published range contains that line, so the evidence does not settle which of those
            two things happened.
          </p>
        </>
      ) : (
        <p className="mt-3 text-[15px] leading-relaxed text-neutral-900 dark:text-neutral-100">
          Every published estimate falls on the same side of {threshold} cents per ounce, so the
          conclusion never flips inside the range the literature supports.
        </p>
      )}

      <p className="mt-3 text-[12.5px] text-neutral-500 dark:text-neutral-400">
        No paper reports this, because it is a statement about the set of papers rather than about
        any one of them. It is a sign-change sweep over the published range, in lib/band.ts.
      </p>
    </div>
  );
}
