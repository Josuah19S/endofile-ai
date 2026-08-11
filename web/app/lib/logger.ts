/**
 * Development-only console output.
 *
 * `process.env.NODE_ENV` is statically replaced at build time by Next.js — the
 * comparison folds to `false` in production builds, so the bundler dead-codes
 * every devLog() call site and its arguments. That keeps production bundles
 * small and stops model-load progress, warm-up timings, and per-prediction
 * debug dumps from leaking to end users.
 *
 * console.warn / console.error are intentionally NOT wrapped here: those are
 * for real runtime issues (validation fallbacks, model init failures) that
 * should surface in any environment.
 */
export function devLog(...args: unknown[]): void {
  if (process.env.NODE_ENV !== 'production') {
    console.log(...args);
  }
}