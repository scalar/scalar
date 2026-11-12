import { unescapeJsonPointerSegment } from '@scalar/helpers/json/unescape-json-pointer-segment'
import { isObject, isObjectLike } from '@scalar/helpers/object/is-object'

/**
 * Looks up local Reference Objects for semantic checks without mutating the API description.
 * External, malformed, missing and cyclic references are left to the caller's resolver.
 * Path Items can preserve adjacent fields, unlike Reference Objects.
 */
export const resolveLocalReference = (
  document: Record<string, unknown>,
  value: unknown,
  options?: { preserveSiblings?: boolean },
): Record<string, unknown> | undefined => {
  const seen = new WeakSet<object>()
  const siblings: Record<string, unknown> = {}
  const unresolved = options?.preserveSiblings ? siblings : undefined
  let current = value
  while (isObject(current)) {
    if (options?.preserveSiblings) {
      for (const [key, field] of Object.entries(current)) {
        if (key !== '$ref' && !Object.hasOwn(siblings, key)) {
          Object.defineProperty(siblings, key, { value: field, enumerable: true })
        }
      }
    }
    if (!('$ref' in current)) {
      return options?.preserveSiblings ? siblings : current
    }
    if (seen.has(current) || typeof current.$ref !== 'string' || !current.$ref.startsWith('#')) {
      return unresolved
    }
    seen.add(current)
    try {
      const pointer = decodeURIComponent(current.$ref.slice(1))
      if (pointer !== '' && !pointer.startsWith('/')) {
        return unresolved
      }
      current =
        pointer === ''
          ? document
          : pointer
              .slice(1)
              .split('/')
              .map(unescapeJsonPointerSegment)
              .reduce<unknown>(
                (target, key) => (isObjectLike(target) && Object.hasOwn(target, key) ? target[key] : undefined),
                document,
              )
    } catch {
      return unresolved
    }
  }
  return unresolved
}
