/**
 * Deep-clones plain data for use where mutation must not affect the source.
 *
 * In the browser we use `structuredClone`, which preserves `Date`, `Map`, `Set`,
 * typed arrays, and other structured types. During SSR there is no `window`, so
 * we fall back to `JSON.parse(JSON.stringify(...))`, which only supports JSON
 * values (functions, `undefined` in objects, symbols, etc. are dropped or altered).
 *
 * @example
 * ```ts
 * const copy = safeDeepClone(spec)
 * copy.info.title = 'Draft'
 * // original spec is unchanged
 * ```
 */
export const safeDeepClone = <T>(value: T): T => {
  if (typeof window === 'undefined') {
    return JSON.parse(JSON.stringify(value)) as T
  }
  return window.structuredClone(value) as T
}
