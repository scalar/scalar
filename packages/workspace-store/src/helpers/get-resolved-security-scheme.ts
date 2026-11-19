import { isObject } from '@scalar/helpers/object/is-object'

import type { NodeInput } from './get-resolved-ref'

/**
 * Follow Security Scheme Reference Objects through annotated aliases. Unlike schema
 * references, these do not establish new resources, so annotations do not stop resolution.
 * Missing targets and cycles stay unresolved instead of becoming empty auth schemes.
 */
export const getResolvedSecurityScheme = <Node>(node: NodeInput<Node>): Node | undefined => {
  const seen = new Set<unknown>()
  let current: unknown = node
  while (isObject(current) && typeof current.$ref === 'string') {
    if (seen.has(current)) {
      return undefined
    }
    seen.add(current)
    current = current['$ref-value']
  }
  return current as Node | undefined
}
