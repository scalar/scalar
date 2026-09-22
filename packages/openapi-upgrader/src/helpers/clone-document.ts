import { isObject } from '@scalar/helpers/object/is-object'
import type { UnknownObject } from '@scalar/types/utils'

/** Allow small shared values while capping amplified allocation, not ordinary document size. */
const ALIAS_EXPANSION_ENTRY_FLOOR = 100_000
/** More than ten copies per unique source entry is treated as disproportionate alias expansion. */
const MAX_ALIAS_EXPANSION_RATIO = 10

/**
 * Clone each occurrence independently so YAML aliases cannot couple schema
 * transformations to literal examples. Undefined values are preserved.
 */
export const cloneDocument = (document: UnknownObject): UnknownObject => {
  const ancestors = new WeakSet<object>()
  const expansion = { sourceEntries: 0, copiedEntries: 0, sizes: new Map<object, number>() }
  const clone = (value: unknown): unknown => {
    if (
      value === null ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      typeof value === 'undefined'
    ) {
      return value
    }
    if (!Array.isArray(value) && !isObject(value)) {
      return structuredClone(value)
    }
    if (ancestors.has(value)) {
      throw new Error('Cannot upgrade to OpenAPI 3.2: cyclic objects cannot be represented in JSON. Use $ref instead.')
    }
    // These are allocation policy limits, not OpenAPI validity constraints: allow
    // 100,000 copied entries unconditionally, then require more than 10x growth
    // before rejecting. Large documents without alias amplification remain valid.
    const size = expansion.sizes.get(value) ?? 1 + (Array.isArray(value) ? value.length : Object.keys(value).length)
    if (!expansion.sizes.has(value)) {
      expansion.sizes.set(value, size)
      expansion.sourceEntries += size
    }
    expansion.copiedEntries += size
    if (
      expansion.copiedEntries > ALIAS_EXPANSION_ENTRY_FLOOR &&
      expansion.copiedEntries > expansion.sourceEntries * MAX_ALIAS_EXPANSION_RATIO
    ) {
      throw new Error('Cannot upgrade to OpenAPI 3.2: excessive YAML alias expansion. Use $ref for shared schemas.')
    }
    ancestors.add(value)
    const result = Array.isArray(value)
      ? value.map(clone)
      : Object.fromEntries(Object.entries(value).map(([key, item]) => [key, clone(item)]))
    ancestors.delete(value)
    return result
  }
  return clone(document) as UnknownObject
}
