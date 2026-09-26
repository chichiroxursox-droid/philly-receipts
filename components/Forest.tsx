"use client";

import { hasInterval, type Band, type Consistency, type Row } from "@/lib/band.ts";

/**
 * Dot-and-interval plot, hand-written SVG. No charting library.
 *
 * The one rule this component enforces visually: a horizontal bar is drawn ONLY
 * where the paper actually published an interval. Every other row gets a bare
 * dot and an explicit "no interval published" tag. Drawing a bar on a row
 * without one would fabricate precision, which is the exact failure this
 * product exists to expose.
 */

const LEFT = 232;
const RIGHT = 716;
const ROW_H = 46;
const TOP = 34;
const AXIS_H = 56;

/** "Petimar et al., Am J Prev Med 2022;62(6):921-929" -> "Petimar et al." */
function shortName(study: string): string {
  return study.split(",")[0].trim();
}

/** Year out of the citation, for the second label line. */
function year(study: string): string {
  const m = study.match(/\b(19|20)\d{2}\b/);
  return m ? m[0] : "";
}

function niceTicks(lo: number, hi: number, target = 5): number[] {
  if (!(hi > lo)) return [lo];
  const raw = (hi - lo) / target;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm >= 7.5 ? 10 : norm >= 3.5 ? 5 : norm >= 1.5 ? 2 : 1) * mag;
  const out: number[] = [];
  for (let t = Math.ceil(lo / step) * step; t <= hi + step * 1e-9; t += step) {
    out.push(Math.abs(t) < step * 1e-9 ? 0 : t);
  }
  return out;
}

function fmt(n: number): string {
  const a = Math.abs(n);
  if (a >= 1_000_000) return (n / 1_000_000).toFixed(a >= 10_000_000 ? 0 : 1) + "M";
  if (a >= 10_000) return (n / 1000).toFixed(0) + "k";
  if (a >= 100) return n.toFixed(0);
  if (a >= 10) return n.toFixed(1);
  return n.toFixed(2).replace(/\.?0+$/, "") || "0";
}

export default function Forest({
  rows,
  band,
  consistency,
  unitLabel,
  selectedId,
  onSelect,
}: {
  rows: Row[];
  band: Band | null;
  consistency: Consistency | null;
  unitLabel: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (rows.length === 0) return null;

  // Domain covers every point estimate and every PUBLISHED bound. Nothing imputed.
  let lo = Infinity;
  let hi = -Infinity;
  for (const r of rows) {
    lo = Math.min(lo, r.estimate);
    hi = Math.max(hi, r.estimate);
    if (hasInterval(r)) {
      lo = Math.min(lo, r.ci_low as number);
      hi = Math.max(hi, r.ci_high as number);
    }
  }
  if (lo === hi) {
    const pad = Math.abs(lo) * 0.1 || 1;
    lo -= pad;
    hi += pad;
  }
  const pad = (hi - lo) * 0.1;
  lo -= pad;
  hi += pad;

  const x = (v: number) => LEFT + ((v - lo) / (hi - lo)) * (RIGHT - LEFT);
  const height = TOP + rows.length * ROW_H + AXIS_H;
  const axisY = TOP + rows.length * ROW_H + 12;
  const ticks = niceTicks(lo, hi);
  const showZero = lo < 0 && hi > 0;

  return (
    <figure className="w-full">
      <svg
        viewBox={`0 0 760 ${height}`}
        className="w-full h-auto overflow-visible"
        role="img"
        aria-label={`Published estimates, ${unitLabel}. ${rows.length} studies.`}
      >
        {/* The band: lowest published low to highest published high. */}
        {band && (
          <g>
            <rect
              x={x(band.low)}
              y={TOP - 14}
              width={Math.max(1, x(band.high) - x(band.low))}
              height={rows.length * ROW_H + 10}
              className="fill-amber-200/35 dark:fill-amber-400/15"
            />
            <text
              x={(x(band.low) + x(band.high)) / 2}
              y={TOP - 20}
              textAnchor="middle"
              className="fill-amber-800 dark:fill-amber-300 text-[11px] font-medium"
            >
              published range {fmt(band.low)} to {fmt(band.high)}
            </text>
          </g>
        )}

        {/* Zero reference, only when the data actually crosses it. */}
        {showZero && (
          <line
            x1={x(0)}
            x2={x(0)}
            y1={TOP - 4}
            y2={axisY}
            className="stroke-neutral-400 dark:stroke-neutral-600"
            strokeDasharray="3 3"
            strokeWidth={1}
          />
        )}

        {rows.map((r, i) => {
          const cy = TOP + i * ROW_H + ROW_H / 2;
          const isSel = selectedId === r.id;
          const withCI = hasInterval(r);
          return (
            <g
              key={r.id}
              onClick={() => onSelect(r.id)}
              className="cursor-pointer"
              tabIndex={0}
              role="button"
              aria-label={`${shortName(r.study)}, ${r.estimate} ${r.units}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(r.id);
                }
              }}
            >
              <rect
                x={0}
                y={cy - ROW_H / 2}
                width={760}
                height={ROW_H}
                className={
                  isSel
                    ? "fill-sky-100/70 dark:fill-sky-500/10"
                    : "fill-transparent hover:fill-neutral-100/70 dark:hover:fill-neutral-800/40"
                }
              />

              <text
                x={LEFT - 14}
                y={cy - 2}
                textAnchor="end"
                className="fill-neutral-900 dark:fill-neutral-100 text-[13px] font-medium"
              >
                {shortName(r.study)}
              </text>
              <text
                x={LEFT - 14}
                y={cy + 13}
                textAnchor="end"
                className="fill-neutral-500 dark:fill-neutral-400 text-[11px]"
              >
                {year(r.study)}
                {r.industry_funded ? " · industry funded" : ""}
              </text>

              {withCI ? (
                <g>
                  <line
                    x1={x(r.ci_low as number)}
                    x2={x(r.ci_high as number)}
                    y1={cy}
                    y2={cy}
                    className="stroke-neutral-800 dark:stroke-neutral-200"
                    strokeWidth={2}
                  />
                  <line
                    x1={x(r.ci_low as number)}
                    x2={x(r.ci_low as number)}
                    y1={cy - 6}
                    y2={cy + 6}
                    className="stroke-neutral-800 dark:stroke-neutral-200"
                    strokeWidth={2}
                  />
                  <line
                    x1={x(r.ci_high as number)}
                    x2={x(r.ci_high as number)}
                    y1={cy - 6}
                    y2={cy + 6}
                    className="stroke-neutral-800 dark:stroke-neutral-200"
                    strokeWidth={2}
                  />
                </g>
              ) : (
                // No bar. Ever. The paper published no interval.
                <text
                  x={x(r.estimate) + 14}
                  y={cy + 4}
                  className="fill-neutral-400 dark:fill-neutral-500 text-[10.5px] italic"
                >
                  no interval published
                </text>
              )}

              <circle
                cx={x(r.estimate)}
                cy={cy}
                r={isSel ? 7.5 : 6}
                className={
                  r.industry_funded
                    ? "fill-orange-500 stroke-white dark:stroke-neutral-900"
                    : "fill-sky-700 dark:fill-sky-400 stroke-white dark:stroke-neutral-900"
                }
                strokeWidth={1.5}
              />
            </g>
          );
        })}

        {/* Axis */}
        <line
          x1={LEFT}
          x2={RIGHT}
          y1={axisY}
          y2={axisY}
          className="stroke-neutral-400 dark:stroke-neutral-600"
          strokeWidth={1}
        />
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={x(t)}
              x2={x(t)}
              y1={axisY}
              y2={axisY + 5}
              className="stroke-neutral-400 dark:stroke-neutral-600"
              strokeWidth={1}
            />
            <text
              x={x(t)}
              y={axisY + 18}
              textAnchor="middle"
              className="fill-neutral-500 dark:fill-neutral-400 text-[11px] tabular-nums"
            >
              {fmt(t)}
            </text>
          </g>
        ))}
        <text
          x={(LEFT + RIGHT) / 2}
          y={axisY + 38}
          textAnchor="middle"
          className="fill-neutral-600 dark:fill-neutral-300 text-[11.5px]"
        >
          {unitLabel}
        </text>
      </svg>

      <figcaption className="mt-1 text-[12.5px] leading-relaxed text-neutral-600 dark:text-neutral-400">
        {consistency ? (
          consistency.allOverlap ? (
            <>
              Every published interval overlaps. Highest low {fmt(consistency.maxLow)} is at or
              below lowest high {fmt(consistency.minHigh)}, so these {consistency.n} studies are
              statistically consistent.
            </>
          ) : (
            <>
              <strong className="text-neutral-900 dark:text-neutral-100">
                These intervals do not all overlap.
              </strong>{" "}
              The highest low is {fmt(consistency.maxLow)} and the lowest high is{" "}
              {fmt(consistency.minHigh)}. Under the GRADE inconsistency rule that is a real
              disagreement between teams, not noise.
            </>
          )
        ) : (
          <>Fewer than two papers published an interval here, so no consistency test is possible.</>
        )}
        {band && band.excluded.length > 0 && (
          <>
            {" "}
            {band.excluded.length} row{band.excluded.length > 1 ? "s" : ""} published no interval and{" "}
            {band.excluded.length > 1 ? "are" : "is"} excluded from the range rather than estimated.
          </>
        )}
      </figcaption>
    </figure>
  );
}
