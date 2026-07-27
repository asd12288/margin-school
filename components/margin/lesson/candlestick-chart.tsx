import * as React from "react";

import { cn } from "@/lib/utils";
import type { ChartBlock } from "@/lib/fixtures/content";

/**
 * A price chart that sits inside editorial prose.
 *
 * The brief calls this the hardest thing to get right and probably where the
 * design identity gets decided, so the decisions here are deliberate:
 *
 * - **No widget chrome.** No panel border, no toolbar, no legend box, no
 *   background fill. The chart's surface is the page.
 * - **Hairline horizontal grid only.** Vertical gridlines turn a figure into
 *   a terminal.
 * - **Direction comes from the `gain` and `loss` roles**, and up candles are
 *   hollow while down candles are filled — so the two are separable by shape
 *   as well as by colour.
 * - **Annotations are footnotes, not tooltips.** A numbered marker on the
 *   candle and a numbered note underneath, the way a textbook figure does it.
 *   That keeps the labels translatable, printable, readable by a screen
 *   reader, and legible without hovering — which is impossible on a phone.
 *
 * Rendered as plain SVG on the server. No charting library, no client
 * JavaScript, no layout shift.
 */

const VIEW_W = 720;
const VIEW_H = 300;
const PAD_TOP = 16;
const PAD_BOTTOM = 28;
const PAD_RIGHT = 52;
const PAD_LEFT = 8;

export interface CandlestickChartLabels {
  /** Accessible summary of the figure, e.g. "EURUSD daily, 1 to 16 June". */
  description: string;
  /** Formats a price for the axis. */
  formatPrice: (value: number) => string;
  /** Formats a candle timestamp for the axis. */
  formatDate: (iso: string) => string;
}

function CandlestickChart({
  block,
  labels,
  className,
  ...props
}: Omit<React.ComponentProps<"figure">, "children"> & {
  block: ChartBlock;
  labels: CandlestickChartLabels;
}) {
  const { candles, annotations } = block;

  const highs = candles.map((c) => c.h);
  const lows = candles.map((c) => c.l);
  const max = Math.max(...highs);
  const min = Math.min(...lows);
  // A little headroom so wicks never touch the edge of the figure.
  const pad = (max - min) * 0.12;
  const top = max + pad;
  const bottom = min - pad;

  const plotW = VIEW_W - PAD_LEFT - PAD_RIGHT;
  const plotH = VIEW_H - PAD_TOP - PAD_BOTTOM;

  const y = (price: number) =>
    PAD_TOP + ((top - price) / (top - bottom)) * plotH;

  const slot = plotW / candles.length;
  const bodyW = Math.min(slot * 0.58, 14);
  const x = (i: number) => PAD_LEFT + slot * i + slot / 2;

  // Four price gridlines is enough to read a level and few enough to stay
  // quiet behind the data.
  const ticks = Array.from({ length: 4 }, (_, i) => bottom + pad + ((top - pad - (bottom + pad)) * i) / 3);

  // Annotations are positioned 0–1 along the series; resolve to a candle.
  const marked = annotations.map((a, i) => ({
    ...a,
    index: Math.min(candles.length - 1, Math.round(a.at * (candles.length - 1))),
    number: i + 1,
  }));

  return (
    <figure
      data-slot="chart-figure"
      className={cn("measure-wide my-8", className)}
      {...props}
    >
      <div className="flex items-baseline justify-between gap-4 pb-2">
        <span
          data-numeric
          className="font-mono text-xs tracking-wide text-muted-foreground"
        >
          {block.symbol} · {block.timeframe}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="h-auto w-full overflow-visible"
        role="img"
        aria-label={labels.description}
      >
        {ticks.map((price) => (
          <g key={price}>
            <line
              x1={PAD_LEFT}
              x2={VIEW_W - PAD_RIGHT}
              y1={y(price)}
              y2={y(price)}
              className="stroke-chart-grid"
              strokeWidth={1}
            />
            <text
              x={VIEW_W - PAD_RIGHT + 8}
              y={y(price)}
              dominantBaseline="middle"
              className="fill-chart-axis font-mono text-[11px]"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {labels.formatPrice(price)}
            </text>
          </g>
        ))}

        {candles.map((candle, i) => {
          const up = candle.c >= candle.o;
          const bodyTop = y(Math.max(candle.o, candle.c));
          const bodyBottom = y(Math.min(candle.o, candle.c));
          const colour = up ? "text-gain" : "text-loss";

          return (
            <g key={candle.t} className={colour}>
              <line
                x1={x(i)}
                x2={x(i)}
                y1={y(candle.h)}
                y2={y(candle.l)}
                stroke="currentColor"
                strokeWidth={1}
              />
              <rect
                x={x(i) - bodyW / 2}
                y={bodyTop}
                width={bodyW}
                // A doji would otherwise be invisible.
                height={Math.max(1, bodyBottom - bodyTop)}
                fill={up ? "currentColor" : "currentColor"}
                fillOpacity={up ? 0.18 : 1}
                stroke="currentColor"
                strokeWidth={1}
                rx={1}
              />
            </g>
          );
        })}

        {marked.map((a) => (
          <g key={a.number} className="text-chart-annotation">
            <line
              x1={x(a.index)}
              x2={x(a.index)}
              y1={y(candles[a.index].h) - 6}
              y2={PAD_TOP - 4}
              stroke="currentColor"
              strokeWidth={1}
              strokeDasharray="2 3"
              opacity={0.5}
            />
            <circle
              cx={x(a.index)}
              cy={PAD_TOP - 10}
              r={8}
              fill="currentColor"
            />
            <text
              x={x(a.index)}
              y={PAD_TOP - 10}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-background text-[10px] font-semibold"
            >
              {a.number}
            </text>
          </g>
        ))}

        {candles.map((candle, i) =>
          // Date labels every fourth candle; more than that becomes noise.
          i % 4 === 0 ? (
            <text
              key={candle.t}
              x={x(i)}
              y={VIEW_H - 8}
              textAnchor="middle"
              className="fill-chart-axis font-mono text-[11px]"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {labels.formatDate(candle.t)}
            </text>
          ) : null
        )}
      </svg>

      {marked.length ? (
        <ol className="mt-3 flex flex-col gap-1.5">
          {marked.map((a) => (
            <li key={a.number} className="flex items-baseline gap-2.5 text-sm">
              <span
                aria-hidden
                className={cn(
                  "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-4xl",
                  "bg-chart-annotation text-[10px] font-semibold text-background"
                )}
              >
                {a.number}
              </span>
              <span className="text-muted-foreground">{a.label}</span>
            </li>
          ))}
        </ol>
      ) : null}

      {block.caption ? (
        <figcaption className="mt-3 border-t border-border pt-2.5 text-xs text-muted-foreground">
          {block.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

export { CandlestickChart };
