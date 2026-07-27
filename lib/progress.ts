/**
 * Progress arithmetic, in one place.
 *
 * Extracted because `ProgressBar`, `ProgressRing` and `CourseCard` were each
 * computing the same percentage independently, and two of them clamped while
 * the third did not. A learner who has completed more lessons than a course
 * currently contains — which happens the moment an editor deletes a published
 * lesson — would have rendered a bar overflowing its track.
 */

/**
 * Completion as a whole percentage, clamped to 0–100.
 *
 * `total <= 0` yields 0 rather than `NaN`: an empty chapter is a real state
 * (a course being authored), and `NaN` would reach the DOM as
 * `aria-valuenow="NaN"` and a `width: NaN%` that silently drops the style.
 */
export function toPercent(completed: number, total: number): number {
  if (!Number.isFinite(completed) || !Number.isFinite(total)) return 0;
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((completed / total) * 100)));
}

/** Whether a unit is fully finished. Kept beside `toPercent` so "complete"
 *  means exactly one thing everywhere it is drawn. */
export function isComplete(completed: number, total: number): boolean {
  return total > 0 && completed >= total;
}
