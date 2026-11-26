import { isObject } from '@scalar/helpers/object/is-object'

/** Keywords whose subschemas describe the same instance, so a read-only property declared beside them still applies */
const SAME_INSTANCE_KEYWORDS = new Set(['allOf', 'anyOf', 'oneOf', 'then', 'else'])

/** Keywords whose subschemas describe a different instance (an item, a property value, …) */
const NESTED_INSTANCE_KEYWORDS = new Set([
  'additionalItems',
  'additionalProperties',
  'contains',
  'items',
  'prefixItems',
  'unevaluatedItems',
  'unevaluatedProperties',
])

/** Keywords whose value maps author-chosen names to schemas */
const SCHEMA_MAP_KEYWORDS = new Set(['$defs', 'definitions', 'dependentSchemas', 'patternProperties', 'properties'])

/** Only unconditional annotations apply when a property is omitted, so union and conditional branches are excluded. */
const isReadOnlyProperty = (schema: unknown): boolean =>
  isObject(schema) &&
  (schema.readOnly === true || (Array.isArray(schema.allOf) && schema.allOf.some(isReadOnlyProperty)))

/** Names of the properties a schema, or any `allOf` member of it, marks as `readOnly` */
const getReadOnlyPropertyNames = (schema: Record<string, unknown>): string[] => {
  const own = isObject(schema.properties)
    ? Object.entries(schema.properties)
        .filter(([, property]) => isReadOnlyProperty(property))
        .map(([name]) => name)
    : []
  const inherited = Array.isArray(schema.allOf)
    ? schema.allOf.filter(isObject).flatMap((member) => getReadOnlyPropertyNames(member))
    : []
  return [...own, ...inherited]
}

/**
 * Remove `readOnly` properties from `required` throughout a request body schema.
 *
 * OpenAPI only enforces `required` for a `readOnly` property on responses, so a client creating a
 * resource must be able to leave out server-assigned fields such as `id` or `createdAt`.
 */
export const dropReadOnlyRequired = (schema: unknown, readOnlyNames: ReadonlySet<string> = new Set()): unknown => {
  if (Array.isArray(schema)) {
    return schema.map((item) => dropReadOnlyRequired(item))
  }
  if (!isObject(schema)) {
    return schema
  }

  const names = new Set([...readOnlyNames, ...getReadOnlyPropertyNames(schema)])

  return Object.fromEntries(
    Object.entries(schema).map(([keyword, value]) => {
      // These schemas test predicates rather than require fields in the request.
      // Relaxing them could select a different branch or make a negation reject a valid body.
      if (keyword === 'if' || keyword === 'not') {
        return [keyword, value]
      }
      if (keyword === 'required' && Array.isArray(value)) {
        return [keyword, value.filter((name) => !names.has(name))]
      }
      if (SAME_INSTANCE_KEYWORDS.has(keyword)) {
        const relax = (member: unknown): unknown => dropReadOnlyRequired(member, names)
        return [keyword, Array.isArray(value) ? value.map(relax) : relax(value)]
      }
      if (NESTED_INSTANCE_KEYWORDS.has(keyword)) {
        return [keyword, dropReadOnlyRequired(value)]
      }
      if (SCHEMA_MAP_KEYWORDS.has(keyword) && isObject(value)) {
        return [
          keyword,
          Object.fromEntries(
            Object.entries(value).map(([name, member]) => [
              name,
              dropReadOnlyRequired(member, keyword === 'dependentSchemas' ? names : undefined),
            ]),
          ),
        ]
      }
      return [keyword, value]
    }),
  )
}
