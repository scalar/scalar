import { unescapeJsonPointerSegment } from '@scalar/helpers/json/unescape-json-pointer-segment'

/**
 * Resolves a reference into literal property names for object traversal.
 * Only URI fragments are decoded; schema locations already contain literal keys.
 */
export const resolveRefSegments = (
  ref: string,
  currentContext: string,
  schemas: Map<string, string[]>,
): string[] | undefined => {
  const [baseUrl, fragment] = ref.split('#', 2)
  const root = baseUrl ? schemas.get(baseUrl) : []

  if (root === undefined) {
    return undefined
  }

  if (!fragment) {
    return baseUrl ? root : undefined
  }

  const pointer = decodeURIComponent(fragment)
  if (pointer.startsWith('/')) {
    return [...root, ...pointer.slice(1).split('/').map(unescapeJsonPointerSegment)]
  }

  return schemas.get(`${baseUrl || currentContext}#${pointer}`)
}
