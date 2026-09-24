import { isObject } from '@scalar/helpers/object/is-object'

/** Where a value sits in an OpenAPI description: a schema, a map of schemas, or anything else. */
export type SchemaPosition = 'document' | 'schema' | 'map'

const schemaMaps = new Set(['properties', 'patternProperties', '$defs', 'definitions', 'dependentSchemas'])
const schemaArrays = new Set(['allOf', 'anyOf', 'oneOf', 'prefixItems'])
const schemaFields = new Set([
  'items',
  'not',
  'additionalProperties',
  'additionalItems',
  'contains',
  'propertyNames',
  'if',
  'then',
  'else',
  'unevaluatedProperties',
  'unevaluatedItems',
])

/**
 * Returns the position of the value stored under `key`, or `undefined` when that value
 * is not part of the schema tree, such as example payloads and schema metadata.
 */
export const getChildPosition = (position: SchemaPosition, key: string): SchemaPosition | undefined => {
  if (position === 'map') return 'schema'
  if (position === 'schema') {
    if (schemaMaps.has(key)) return 'map'
    if (schemaArrays.has(key) || schemaFields.has(key)) return 'schema'
    return undefined
  }
  if (key === 'schema' || key === 'itemSchema') return 'schema'
  if (key === 'schemas') return 'map'
  if (['example', 'examples', 'default', 'const', 'enum'].includes(key)) return undefined
  return 'document'
}

/**
 * The workspace schema currently casts boolean JSON Schemas into empty objects.
 * Restore them only in schema positions, never in example payloads or metadata.
 * TODO: Remove this bridge when the shared schema accepts boolean JSON Schemas.
 */
export const restoreBooleanSchemas = (
  source: unknown,
  target: unknown,
  position: SchemaPosition = 'document',
): void => {
  const seen = new WeakSet<object>()
  const visit = (original: unknown, coerced: unknown, context: SchemaPosition): unknown => {
    if (context === 'schema' && typeof original === 'boolean') return original
    if (!original || typeof original !== 'object' || !coerced || typeof coerced !== 'object' || seen.has(coerced))
      return coerced
    seen.add(coerced)
    if (Array.isArray(original) && Array.isArray(coerced)) {
      for (const [index, value] of original.entries()) {
        const property = Object.getOwnPropertyDescriptor(coerced, index)
        if (!property || !('value' in property)) continue
        Object.defineProperty(coerced, index, { ...property, value: visit(value, property.value, context) })
      }
    } else if (isObject(original) && isObject(coerced)) {
      for (const [key, value] of Object.entries(original)) {
        // Never follow inherited values or invoke setters, including __proto__.
        // Defining an own data property still preserves those names in schema maps.
        const property = Object.getOwnPropertyDescriptor(coerced, key)
        if (!property || !('value' in property)) continue
        const childContext = getChildPosition(context, key)
        if (childContext === undefined) continue
        Object.defineProperty(coerced, key, { ...property, value: visit(value, property.value, childContext) })
      }
    }
    return coerced
  }
  visit(source, target, position)
}
