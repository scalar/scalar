import { isObject } from '@scalar/helpers/object/is-object'
import type { AsyncApiMessageObject } from '@scalar/types/asyncapi/3.1'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'

/**
 * Apply JSON Merge Patch to resolved trait fields. Unlike mergeObjects, null removes a key.
 * Resolve schema references before merging so a message can extend referenced trait headers.
 */
const mergeTraitFields = (target: unknown, patch: unknown, ancestors = new WeakMap<object, unknown>()): unknown => {
  const resolvedPatch = isObject(patch) ? getResolvedRef(patch) : patch
  if (!isObject(resolvedPatch)) {
    return resolvedPatch
  }

  // Resolved schemas can be recursive. Keep their cycles without changing the source document.
  if (ancestors.has(resolvedPatch)) {
    return ancestors.get(resolvedPatch)
  }
  const resolvedTarget = isObject(target) ? getResolvedRef(target) : target
  const result: Record<string, unknown> = isObject(resolvedTarget) ? { ...resolvedTarget } : {}
  ancestors.set(resolvedPatch, result)
  for (const [key, value] of Object.entries(resolvedPatch)) {
    if (value === null) {
      delete result[key]
    } else if (value !== undefined) {
      // Define an own property even for schema properties named __proto__.
      Object.defineProperty(result, key, {
        value: mergeTraitFields(Object.hasOwn(result, key) ? result[key] : undefined, value, ancestors),
        enumerable: true,
        configurable: true,
        writable: true,
      })
    }
  }
  ancestors.delete(resolvedPatch)
  return result
}

/** Merge message traits in order, then apply the message's own fields with highest priority. */
export const resolveMessageTraits = (message: AsyncApiMessageObject): AsyncApiMessageObject => {
  if (!message.traits?.length) {
    return message
  }

  const inherited = message.traits.reduce<Record<string, unknown>>((fields, trait) => {
    const resolved = getResolvedRef(trait)
    return resolved ? (mergeTraitFields(fields, resolved) as Record<string, unknown>) : fields
  }, {})

  // Only overlay fields supplied by traits. Payload schemas and other unrelated fields stay intact.
  const overrides = Object.fromEntries(Object.entries(message).filter(([key]) => Object.hasOwn(inherited, key)))
  const merged = mergeTraitFields(inherited, overrides) as Record<string, unknown>
  const ownFields = Object.fromEntries(Object.entries(message).filter(([key]) => !Object.hasOwn(inherited, key)))
  return { ...ownFields, ...merged } as AsyncApiMessageObject
}
