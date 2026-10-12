import { getRaw } from '@scalar/json-magic/magic-proxy'

import { object } from './document'

/** Cache display-only simplifications within one immutable document snapshot. */
export const createSchemaView = (): ((input: Record<string, unknown>) => Record<string, unknown>) => {
  const cache = new WeakMap<object, Record<string, unknown>>()
  const view = (schema: Record<string, unknown>): Record<string, unknown> => {
    const identity = getRaw(schema)
    const previous = cache.get(identity)
    if (previous) {
      return previous
    }
    // Seed first so cyclic compositions retain their original shape.
    cache.set(identity, schema)
    const keys = Object.keys(schema)
    if (
      Array.isArray(schema.allOf) &&
      schema.allOf.length === 1 &&
      keys.every((key) => ['allOf', 'title', 'description'].includes(key))
    ) {
      const branch = object(schema.allOf[0])
      if (Object.keys(branch).length) {
        const normalized = {
          ...view(branch),
          ...Object.fromEntries(Object.entries(schema).filter(([key]) => key !== 'allOf')),
        }
        cache.set(identity, normalized)
        return normalized
      }
    }
    for (const keyword of ['anyOf', 'oneOf'] as const) {
      const branches = schema[keyword]
      if (Array.isArray(branches) && keys.every((key) => [keyword, 'title', 'description'].includes(key))) {
        const types = branches.map((branch) => object(branch))
        if (
          types.length &&
          types.every(
            (branch) =>
              Object.keys(branch).length === 1 &&
              typeof branch.type === 'string' &&
              !['object', 'array'].includes(branch.type),
          )
        ) {
          const names = types.map((branch) => branch.type)
          // Overlapping oneOf branches are not equivalent to a union.
          if (
            keyword === 'oneOf' &&
            (new Set(names).size !== names.length || (names.includes('integer') && names.includes('number')))
          ) {
            continue
          }
          const normalized = {
            ...Object.fromEntries(Object.entries(schema).filter(([key]) => key !== keyword)),
            type: [...new Set(names)],
          }
          cache.set(identity, normalized)
          return normalized
        }
      }
    }
    return schema
  }
  return view
}
