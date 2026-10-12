import { isObject } from '@scalar/helpers/object/is-object'

/**
 * AsyncAPI Reference Objects have no authored siblings. Follow every hop, including
 * references with ignored siblings, and leave missing or circular aliases unresolved.
 * Keep the shared OpenAPI resolver unchanged: its schema resources have different rules.
 */
export const getResolvedAsyncApiRef = <Node>(node: Node | { $ref: string; '$ref-value'?: Node }): Node | undefined => {
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
