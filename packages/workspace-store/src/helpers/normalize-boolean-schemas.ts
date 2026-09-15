import { parseJsonPointerSegments } from '@scalar/helpers/json/parse-json-pointer-segments'
import { getValueAtPath } from '@scalar/helpers/object/get-value-at-path'
import { isObject } from '@scalar/helpers/object/is-object'
import { isSchemaPath } from '@scalar/helpers/openapi/is-schema-path'
import { setValueAtPath } from '@scalar/json-magic/helpers/set-value-at-path'

const schemaMaps = new Set(['properties', 'patternProperties', '$defs', 'definitions', 'dependentSchemas'])
const schemaArrays = new Set(['allOf', 'anyOf', 'oneOf', 'prefixItems'])
const childSchemas = new Set([
  'items',
  'not',
  'if',
  'then',
  'else',
  'contains',
  'propertyNames',
  'contentSchema',
  '$ref-value',
])
const openApiMaps = new Set([
  'paths',
  'webhooks',
  'responses',
  'content',
  'headers',
  'examples',
  'links',
  'encoding',
  'variables',
  'parameters',
  'requestBodies',
  'securitySchemes',
  'pathItems',
  'mediaTypes',
  'additionalOperations',
  'callbacks',
  'x-ext',
])
const opaqueValues = new Set(['example', 'examples', 'default', 'enum', 'const', 'value', 'dataValue'])

/**
 * Normalize boolean schemas in place before the store's object-only coercion.
 * The internal marker represents an untyped schema: true accepts every value,
 * while false is the negation of that schema. Boolean annotations and examples
 * remain literal values, and additionalProperties already supports booleans.
 */
export const normalizeBooleanSchemas = <T extends Record<string, unknown>>(document: T): T => {
  const visitedSchemas = new WeakSet<object>()
  const visitedObjects = new WeakSet<object>()
  const normalizeSchema = (value: unknown): unknown => {
    if (typeof value === 'boolean') {
      return value ? { __scalar_: '' } : { __scalar_: '', not: { __scalar_: '' } }
    }
    if (!isObject(value) || visitedSchemas.has(value)) return value
    visitedSchemas.add(value)
    // Bundled targets retain their original shape until a schema reference supplies the context.
    if (typeof value.$ref === 'string' && value.$ref.startsWith('#/')) {
      const pointer = value.$ref.slice(1)
      const target = getValueAtPath(document, parseJsonPointerSegments(pointer))
      if (typeof target === 'boolean' || isObject(target)) {
        setValueAtPath(document, pointer, normalizeSchema(target))
      }
    }
    for (const [key, child] of Object.entries(value)) {
      if (schemaMaps.has(key) && isObject(child)) {
        for (const name of Object.keys(child)) child[name] = normalizeSchema(child[name])
      } else if (schemaArrays.has(key) && Array.isArray(child)) {
        value[key] = child.map(normalizeSchema)
      } else if (childSchemas.has(key)) {
        value[key] = normalizeSchema(child)
      } else if (
        ['additionalProperties', 'unevaluatedProperties', 'unevaluatedItems'].includes(key) &&
        isObject(child)
      ) {
        value[key] = normalizeSchema(child)
      }
    }
    return value
  }
  const visit = (value: unknown, path: string[]): void => {
    if (!value || typeof value !== 'object' || visitedObjects.has(value)) return
    visitedObjects.add(value)
    for (const [key, child] of Object.entries(value)) {
      const childPath = [...path, key]
      const isMapEntry = openApiMaps.has(path.at(-1) ?? '') || path.at(-2) === 'callbacks'
      if (key === 'schemas' && path.at(-1) === 'components' && isObject(child)) {
        for (const name of Object.keys(child)) child[name] = normalizeSchema(child[name])
      } else if ((key === 'schema' || key === 'itemSchema') && !isMapEntry && isSchemaPath(childPath)) {
        ;(value as Record<string, unknown>)[key] = normalizeSchema(child)
      } else if (isMapEntry || (!opaqueValues.has(key) && (!key.startsWith('x-') || key === 'x-ext'))) {
        visit(child, childPath)
      }
    }
  }
  visit(document, [])
  return document
}
