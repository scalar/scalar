import { isObject } from '@scalar/helpers/object/is-object'

import { SCHEMA_KEYWORDS, SCHEMA_MAP_KEYWORDS } from './replace-circular-markers'

/** Keywords that combine other schemas, which is where a `nullable` without a `type` has something to widen */
const COMPOSITION_KEYWORDS = ['allOf', 'anyOf', 'oneOf'] as const

/** Keywords whose branches are alternatives, so an arm that only says `nullable: true` is the "or null" arm */
const UNION_KEYWORDS = new Set(['anyOf', 'oneOf'])

/** Keywords that only describe a schema, matching the list the OpenAPI 3.0 upgrader uses for the same arm */
const ANNOTATION_KEYWORDS = new Set([
  'title',
  'description',
  'deprecated',
  'default',
  'example',
  'examples',
  'externalDocs',
  'readOnly',
  'writeOnly',
])

/**
 * Whether a union arm carries `nullable: true` and nothing but annotations and extensions, which is how some
 * OpenAPI 3.0 exporters spell `oneOf: [{ nullable: true }, { $ref: X }]`. Dropped to `{}`, the arm would match
 * every value and make a `oneOf` reject each value the real arm accepts.
 */
const isNullArm = (schema: unknown): schema is Record<string, unknown> =>
  isObject(schema) &&
  schema.nullable === true &&
  Object.keys(schema).every((key) => key === 'nullable' || ANNOTATION_KEYWORDS.has(key) || key.startsWith('x-'))

/**
 * Whether the schema declares a type, mirroring how Ajv reads it: a string, or a non-empty array.
 * Ajv only accepts `nullable` next to one of these.
 */
const hasType = (schema: Record<string, unknown>): boolean =>
  typeof schema.type === 'string' || (Array.isArray(schema.type) && schema.type.length > 0)

/** Whether the declared type already includes null, which Ajv does not allow beside `nullable: false` */
const typeIncludesNull = (schema: Record<string, unknown>): boolean =>
  schema.type === 'null' || (Array.isArray(schema.type) && schema.type.includes('null'))

/**
 * Whether Ajv would refuse the `nullable` keyword of this node: it has no type to widen, or it says
 * `nullable: false` beside a type that includes null.
 */
const isRefusedNullable = (schema: Record<string, unknown>): boolean =>
  'nullable' in schema && (!hasType(schema) || (schema.nullable === false && typeIncludesNull(schema)))

/**
 * Rewrite one schema node whose own `nullable` keyword Ajv would refuse because there is no `type` to widen.
 *
 * `nullable: true` next to a union (`oneOf`, `anyOf`, `allOf`) is how OpenAPI 3.0 documents spell "this or
 * null", so the node becomes `anyOf: [<node>, { type: 'null' }]`. That is the same shape the OpenAPI
 * upgrader writes for a nullable `$ref`, and unlike appending a branch to the union it stays correct for
 * a `oneOf` where another branch already accepts null, and for an `allOf`. Any other untyped node already
 * accepts null unless it constrains it elsewhere, so the keyword is dropped. `nullable: false` never
 * widened anything and is dropped as well, including beside a type that contains null, where Ajv reports a contradiction.
 */
const withoutNullable = (schema: Record<string, unknown>): Record<string, unknown> => {
  const { nullable, ...rest } = schema

  if (nullable === true && COMPOSITION_KEYWORDS.some((keyword) => keyword in rest)) {
    return { anyOf: [rest, { type: 'null' }] }
  }

  return rest
}

/**
 * Make `nullable` compile in Ajv for every schema that has no `type` next to it.
 *
 * Ajv implements the OpenAPI 3.0 `nullable` keyword but throws `"nullable" cannot be used without "type"`
 * at compile time for any node that carries it without a type, and `type: null contradicts nullable: false`
 * for a `nullable: false` beside a type that includes null. The caller then skips validation for the
 * whole body, or for every parameter of a location, so a single `nullable: true` beside a `oneOf` turned
 * request validation off for the operation. The upgrader leaves exactly that shape behind on purpose,
 * because there is nothing to widen, and a 3.1 document can carry the keyword as well.
 *
 * A `oneOf` or `anyOf` arm that only says `nullable: true` becomes `{ type: 'null' }`, as the upgrader does for
 * a 3.0 document, so a 3.1 document that kept the spelling does not get an arm that matches every value.
 * Other typed nodes are returned as they are, because Ajv widens their type itself. Only known schema
 * positions are rewritten, so a property that is named `nullable` and a `nullable` key inside `enum`,
 * `const`, `default` or an example are data and are carried over untouched. The input is never mutated,
 * and a subtree that needs no rewrite is shared with the input rather than copied.
 */
export const normalizeNullable = (schema: unknown): unknown => {
  // The resolved document is a graph in which one schema object is shared by every place that referenced
  // it, so each is rewritten once. Schemas and schema maps are cached apart because the same object read
  // as one or the other means something different: `{ nullable: true }` is a keyword in a schema and a
  // schema named `nullable` in a map.
  const rewritten = new WeakMap<object, unknown>()
  const rewrittenMaps = new WeakMap<object, unknown>()

  const asSchema = (value: unknown): unknown => {
    if (!isObject(value) && !Array.isArray(value)) {
      return value
    }

    if (rewritten.has(value)) {
      return rewritten.get(value)
    }

    if (Array.isArray(value)) {
      const items = value.map(asSchema)
      const result = items.some((item, index) => item !== value[index]) ? items : value
      rewritten.set(value, result)
      return result
    }

    let result: Record<string, unknown> = value

    for (const [keyword, child] of Object.entries(value)) {
      let next: unknown = child

      if (UNION_KEYWORDS.has(keyword) && Array.isArray(child)) {
        next = asUnion(child)
      } else if (SCHEMA_KEYWORDS.has(keyword)) {
        next = asSchema(child)
      } else if (SCHEMA_MAP_KEYWORDS.has(keyword) && isObject(child)) {
        next = asSchemaMap(child)
      }

      // Copy on the first change only, so the resolved document the schema came from is never touched.
      if (next !== child) {
        result = result === value ? { ...value } : result
        result[keyword] = next
      }
    }

    if (isRefusedNullable(result)) {
      result = withoutNullable(result)
    }

    rewritten.set(value, result)
    return result
  }

  /** Rewrite the arms of a `oneOf` or `anyOf`, turning an arm that only says `nullable: true` into the null arm */
  const asUnion = (arms: unknown[]): unknown[] => {
    const result = arms.map((arm): unknown => {
      if (!isNullArm(arm)) {
        return asSchema(arm)
      }
      const { nullable: _nullable, ...annotations } = arm
      return { ...annotations, type: 'null' }
    })
    return result.some((arm, index) => arm !== arms[index]) ? result : arms
  }

  /** Rewrite every schema under a map keyword, keeping its author-chosen names as they are */
  const asSchemaMap = (map: Record<string, unknown>): Record<string, unknown> => {
    if (rewrittenMaps.has(map)) {
      return rewrittenMaps.get(map) as Record<string, unknown>
    }

    // `Object.fromEntries` defines each name as an own property, so a schema named `__proto__` stays data.
    const entries = Object.entries(map).map(([name, sub]): [string, unknown] => [name, asSchema(sub)])
    const result = entries.some(([name, sub]) => sub !== map[name]) ? Object.fromEntries(entries) : map

    rewrittenMaps.set(map, result)
    return result
  }

  return asSchema(schema)
}
