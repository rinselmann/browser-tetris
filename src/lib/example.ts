/**
 * Placeholder module proving the unit-test pipeline works.
 * Delete this (and its test) once real game logic lands in `src/lib/`.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
