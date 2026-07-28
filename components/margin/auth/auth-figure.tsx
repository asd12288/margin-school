/**
 * The decorative figure behind the auth panel.
 *
 * Server-rendered SVG: no charting library, no client JS, nothing in the
 * bundle — the same decision `lesson/candlestick-chart` makes, for the same
 * reason.
 *
 * It is a price series because that is what the product teaches, and an
 * *invented* one because a real chart on a sign-up screen would be read as a
 * market claim. The path is a fixed literal rather than generated: this is one
 * figure in one place, and a seeded generator would be machinery for a
 * variation nobody asked for.
 *
 * `aria-hidden`, with no title or description. It carries no information the
 * copy beside it does not already state, and announcing "decorative chart" to
 * a screen reader on a sign-in page is noise.
 *
 * Colours come from the chart roles, so it moves with the theme and picks up
 * dark mode's lighter steps without a second definition.
 */
function AuthFigure({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <defs>
        <linearGradient id="auth-figure-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--chart-1)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--chart-1)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="auth-figure-stroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--chart-2)" />
          <stop offset="100%" stopColor="var(--chart-1)" />
        </linearGradient>
      </defs>

      {/* Grid. Deliberately faint — it gives the figure the grammar of a chart
          without competing with the copy layered over it. */}
      <g stroke="var(--chart-grid)" strokeWidth="1" opacity="0.5">
        {[60, 120, 180, 240].map((y) => (
          <line key={y} x1="0" y1={y} x2="400" y2={y} />
        ))}
      </g>

      <path
        d="M0 232 L40 210 L80 224 L120 176 L160 190 L200 140 L240 154 L280 104 L320 118 L360 72 L400 84 L400 300 L0 300 Z"
        fill="url(#auth-figure-fill)"
      />
      <path
        d="M0 232 L40 210 L80 224 L120 176 L160 190 L200 140 L240 154 L280 104 L320 118 L360 72 L400 84"
        fill="none"
        stroke="url(#auth-figure-stroke)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* The leading point, where a live chart would be drawing now. */}
      <circle cx="400" cy="84" r="4" fill="var(--chart-1)" />
      <circle cx="400" cy="84" r="9" fill="var(--chart-1)" opacity="0.18" />
    </svg>
  );
}

export { AuthFigure };
