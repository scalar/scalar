import { isObject } from '@scalar/helpers/object/is-object'
import type { UnknownObject } from '@scalar/types/utils'

/**
 * Clone each occurrence independently so YAML aliases cannot couple schema
 * transformations to literal examples. Undefined values are preserved.
 */
export const cloneDocument = (document: UnknownObject): UnknownObject => {
  const ancestors = new WeakSet<object>()
  const expansion = { sourceEntries: 0, copiedEntries: 0, sizes: new Map<object, number>() }
  const clone = (value: unknown): unknown => {
    if (value === null || ['string', 'number', 'boolean', 'undefined'].includes(typeof value)) {
      return value
    }
    if (!Array.isArray(value) && !isObject(value)) {
      return structuredClone(value)
    }
    if (ancestors.has(value)) {
      throw new Error('Cannot upgrade to OpenAPI 3.2: cyclic objects cannot be represented in JSON. Use $ref instead.')
    }
    // Permit large descriptions, but bound the extra allocations caused by aliases.
    const size = expansion.sizes.get(value) ?? 1 + (Array.isArray(value) ? value.length : Object.keys(value).length)
    if (!expansion.sizes.has(value)) {
      expansion.sizes.set(value, size)
      expansion.sourceEntries += size
    }
    expansion.copiedEntries += size
    if (expansion.copiedEntries > 100_000 && expansion.copiedEntries > expansion.sourceEntries * 10) {
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
