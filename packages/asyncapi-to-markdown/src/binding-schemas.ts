import { isObject } from '@scalar/helpers/object/is-object'
import { getRaw } from '@scalar/json-magic/magic-proxy'

const schemaMaps = new Set(['properties', 'patternProperties', '$defs', 'definitions', 'dependencies'])
const literalFields = new Set(['example', 'examples', 'default', 'enum', 'const'])

/** Find schema references inside protocol bindings without interpreting authored example data. */
export const getBindingSchemas = (binding: Record<string, unknown>): Record<string, unknown>[] => {
  const references: Record<string, unknown>[] = []
  const seen = new Set<unknown>()
  const visit = (value: unknown, map = false): void => {
    if (value === null || typeof value !== 'object' || seen.has(getRaw(value))) {
      return
    }
    seen.add(getRaw(value))
    if (Array.isArray(value)) {
      value.forEach((entry) => visit(entry))
      return
    }
    if (!isObject(value)) {
      return
    }
    if (!map && typeof value.$ref === 'string') {
      references.push(value)
      return
    }
    for (const [key, child] of Object.entries(value)) {
      if (map || (!literalFields.has(key) && !key.startsWith('x-'))) {
        visit(child, !map && schemaMaps.has(key))
      }
    }
  }
  visit(binding)
  return references
}
