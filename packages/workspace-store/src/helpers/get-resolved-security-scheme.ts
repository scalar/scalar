import { isObject } from '@scalar/helpers/object/is-object'

import type { NodeInput } from './get-resolved-ref'

/**
 * Follow Security Scheme Reference Objects through annotated aliases. Unlike schema
 * references, these do not establish new resources, so annotations do not stop resolution.
 * The nearest description overrides the target without mutating shared schemes. Callers
 * handling OpenAPI 3.0 must disable overrides because that version ignores reference siblings.
 * Missing targets and cycles stay unresolved instead of becoming empty auth schemes.
 */
export const getResolvedSecurityScheme = <Node>(
  node: NodeInput<Node>,
  { overrideDescription = true }: { overrideDescription?: boolean } = {},
): Node | undefined => {
  const seen = new Set<unknown>()
  let current: unknown = node
  let description: string | undefined
  while (isObject(current) && typeof current.$ref === 'string') {
    if (seen.has(current)) {
      return undefined
    }
    seen.add(current)
    if (overrideDescription && description === undefined && typeof current.description === 'string') {
      description = current.description
    }
    current = current['$ref-value']
  }
  return (isObject(current) && description !== undefined ? { ...current, description } : current) as Node | undefined
}
