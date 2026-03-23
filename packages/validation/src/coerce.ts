import { isObject } from './helpers/is-object'
import type { Schema } from './schema'
import type { Static } from './types'
import { validate } from './validate'

const scoreUnion = (schema: Schema, value: unknown): number => {
  if (schema.type === 'object') {
    if (!isObject(value)) {
      return 0
    }

    return Object.keys(schema.properties).reduce<number>((acc, key) => {
      const exists = key in value
      const isLiteralMatch = schema.properties[key].type === 'literal' && value[key] === schema.properties[key].value
      if (isLiteralMatch) {
        return acc + 10
      }
      return acc + (exists ? 1 : 0)
    }, 0)
  }
  if (schema.type === 'array') {
    return Array.isArray(value) ? 1 : 0
  }
  if (schema.type === 'record') {
    // TODO: implement smarter scoring for records
    return isObject(value) ? 1 : 0
  }
  if (schema.type === 'union') {
    return Math.max(...schema.schemas.map((schema) => scoreUnion(schema, value)))
  }

  if (schema.type === 'recursive') {
    return scoreUnion(schema.schema(), value)
  }

  // Primitive types
  return validate(schema, value) ? 1 : 0
}

/**
 * Coerces an unknown value toward the static type implied by `schema`. Values that
 * pass {@link validate} for that branch are kept; otherwise primitives default to
 * `0`, `''`, or `false`, and arrays, records, and objects are built recursively.
 * Unions pick the best-matching branch; `evaluate` runs `expression` before the inner schema.
 *
 * @example
 * ```ts
 * import { coerce, number, object, string } from '@scalar/validation'
 *
 * coerce(number(), 42) // 42
 * coerce(number(), 'nope') // 0 — invalid number uses default
 * coerce(object({ id: number(), name: string() }), { id: '1', name: 'Ada' }) // { id: 0, name: 'Ada' }
 * ```
 *
 * The optional `cache` argument tracks visited object–schema pairs to stop infinite recursion
 * on cyclic graphs; callers normally omit it.
 */
export const coerce = <S extends Schema>(
  schema: S,
  value: unknown,
  cache: WeakMap<object, Set<Schema>> = new WeakMap(),
): Static<S> => {
  // Prevent infinite recursion
  if (isObject(value) && cache.get(value)?.has(schema)) {
    return value as Static<S>
  }
  // Track visited schemas to prevent infinite recursion
  if (isObject(value)) {
    const schemas = cache.get(value) || new Set<Schema>()
    schemas.add(schema)
    cache.set(value, schemas)
  }

  // If no schema is provided, return the value as is
  if (!schema) {
    return value as Static<S>
  }

  if (schema.type === 'any') {
    return value as unknown as Static<S>
  }
  if (schema.type === 'number') {
    if (validate(schema, value)) {
      return value as Static<S>
    }
    return 0 as Static<S>
  }
  if (schema.type === 'string') {
    if (validate(schema, value)) {
      return value as unknown as Static<S>
    }
    return '' as unknown as Static<S>
  }
  if (schema.type === 'boolean') {
    if (validate(schema, value)) {
      return value as unknown as Static<S>
    }
    return false as unknown as Static<S>
  }
  if (schema.type === 'nullable') {
    return null as unknown as Static<S>
  }
  if (schema.type === 'notDefined') {
    return undefined as unknown as Static<S>
  }
  if (schema.type === 'array') {
    if (!Array.isArray(value)) {
      return [] as unknown as Static<S>
    }
    return value.map((item) => coerce(schema.items, item, cache)) as unknown as Static<S>
  }
  if (schema.type === 'record') {
    if (typeof value !== 'object' || value === null) {
      return {} as unknown as Static<S>
    }
    return Object.fromEntries(
      Object.entries(value).map(([key, value]) => [key, coerce(schema.value, value, cache)]),
    ) as unknown as Static<S>
  }
  if (schema.type === 'object') {
    const keys = Object.keys(schema.properties)
    const target = isObject(value) ? value : null
    return Object.fromEntries(
      keys.map((key) => [key, coerce(schema.properties[key], target, cache)]),
    ) as unknown as Static<S>
  }
  if (schema.type === 'union') {
    const branch = schema.schemas.reduce(
      (acc, schema) => {
        const score = scoreUnion(schema, value)
        return score > acc.score ? { schema, score } : acc
      },
      { schema: schema.schemas[0], score: 0 },
    )
    // We need some way to pick one of the union values
    return coerce(branch.schema, value, cache)
  }
  if (schema.type === 'literal') {
    return schema.value
  }
  if (schema.type === 'recursive') {
    return coerce(schema.schema(), value, cache)
  }
  if (schema.type === 'evaluate') {
    return coerce(schema.schema, schema.expression(value), cache)
  }

  // We need to assert here that schema has the type never so we know we handle all cases
  const _exhaustive: never = schema
  console.warn('Unknown schema type:', _exhaustive)
  return value as unknown as Static<S>
}
