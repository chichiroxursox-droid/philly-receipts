"use client";

import { assertRowId } from "@/lib/corpus.ts";

/**
 * Renders a number and refuses to render one that has no corpus row behind it.
 * assertRowId throws on a bad id, so a typo takes the page down instead of
 * quietly publishing a figure with no source. That is the intended trade.
 */
export default function Cited({
  rowId,
  children,
  onClick,
}: {
  rowId: string;
  children: React.ReactNode;
  onClick?: (id: string) => void;
}) {
  assertRowId(rowId);
  return (
    <button
      type="button"
      data-row={rowId}
      onClick={onClick ? () => onClick(rowId) : undefined}
      className="underline decoration-dotted decoration-neutral-400 underline-offset-4 tabular-nums hover:decoration-sky-500 hover:text-sky-700 dark:hover:text-sky-400"
      title={`source: ${rowId}`}
    >
      {children}
    </button>
  );
}
