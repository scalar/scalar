import { decodeUriFragment } from './decode-uri-fragment'
import { parseJsonPointer } from './parse-json-pointer'

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

  const pointer = decodeUriFragment(fragment)
  if (pointer.startsWith('/')) {
    return [...root, ...parseJsonPointer(pointer)]
  }

  return schemas.get(`${baseUrl || currentContext}#${pointer}`)
}
