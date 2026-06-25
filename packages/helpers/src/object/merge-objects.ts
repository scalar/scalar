import { isObject } from './is-object'

/**
 * Deep-merges `override` onto `base` and returns a new object.
 *
 * Designed for layering partial overrides on top of a complete base (for example, merging
 * user-provided configuration onto defaults):
 *
 * - Nested plain objects are merged recursively.
 * - `undefined` values in `override` are skipped, so an override never clears a base value.
 * - Any non-plain-object value (including arrays) replaces the base value outright.
 *
 * The `base` is never mutated.
 *
 * Unlike a generic deep merge, this intentionally preserves base values for `undefined` overrides
 * and replaces (rather than concatenates) arrays, which is the behavior config-style merges expect.
 */
export const mergeObjects = <T extends Record<string, unknown>>(base: T, override?: unknown): T => {
  if (!override || !isObject(override)) {
    return { ...base }
  }

  const result: Record<string, unknown> = { ...base }

  for (const [key, value] of Object.entries(override)) {
    if (value === undefined) {
      continue
    }

    const baseValue = result[key]
    result[key] = isObject(baseValue) && isObject(value) ? mergeObjects(baseValue, value) : value
  }

  return result as T
}
