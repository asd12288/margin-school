/**
 * Deterministic cover art derivation.
 *
 * Separated from the component so the determinism is testable — it is the
 * whole property the feature rests on. If the same course id ever produced two
 * different covers, the catalog would reshuffle its own artwork on every
 * deploy and people would stop recognising courses by sight.
 */

/** FNV-1a. Small, stable across runtimes, and no dependency. */
export function hashId(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return Math.abs(h);
}

export interface CoverGradient {
  /** Degrees. */
  angle: number;
  /** Percentage mix of the second hue into the first stop. */
  mixFrom: number;
  /** Percentage mix of the third hue into the last stop. */
  mixTo: number;
}

/**
 * Every cover mixes the same three cool chart hues and varies only in ratio
 * and angle. Drawing freely from the full palette would put an amber cover
 * beside a rose one and make a catalog page look like a swatch book; this way
 * the grid reads as one wall while each course keeps a cover you can navigate
 * by.
 */
export function coverGradient(courseId: string): CoverGradient {
  const seed = hashId(courseId);
  return {
    angle: 120 + (seed % 5) * 15,
    mixFrom: (seed % 4) * 22,
    mixTo: ((seed >> 4) % 4) * 22,
  };
}

/** A rising-then-settling path, varied by seed. Ornament, not market data —
 *  pretending otherwise would be its own kind of lie. */
export function coverSeriesPath(courseId: string): string {
  const seed = hashId(courseId);
  const points = 9;
  let d = "";
  for (let i = 0; i < points; i += 1) {
    const x = (i / (points - 1)) * 100;
    const noise = ((seed >> (i * 2)) & 0x0f) / 15;
    const drift = 1 - i / (points - 1);
    const y = 18 + drift * 34 + noise * 22;
    d += `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)} `;
  }
  return d.trim();
}
