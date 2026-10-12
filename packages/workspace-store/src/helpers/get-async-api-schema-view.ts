import { isObject } from '@scalar/helpers/object/is-object'

import { getResolvedAsyncApiRef } from './get-resolved-async-api-ref'

const schemaMaps = new Set(['properties', 'patternProperties', 'definitions', '$defs', 'dependentSchemas'])
const schemaArrays = new Set(['allOf', 'anyOf', 'oneOf', 'prefixItems'])
const schemaFields = new Set([
  'items',
  'additionalItems',
  'additionalProperties',
  'contains',
  'propertyNames',
  'not',
  'if',
  'then',
  'else',
  'unevaluatedItems',
  'unevaluatedProperties',
])

/**
 * Give shared schema renderers and example generation an AsyncAPI view without authored
 * reference siblings. Keep reference wrappers for model links and traverse only schema
 * positions: examples, defaults, extensions, and property names can contain literal `$ref`s.
 * The snapshot is local to a read so subsequent reactive edits are not hidden by a cache.
 */
export const getAsyncApiSchemaView = (source: unknown, schemaFormat?: string): unknown => {
  // Foreign schema formats own their reference semantics. AsyncAPI's native schemas and
  // its required JSON Schema draft-07 format both ignore reference siblings.
  if (
    schemaFormat &&
    !/^application\/(?:vnd\.aai\.asyncapi(?:\+json|\+yaml)?(?:;|$)|schema\+(?:json|yaml)(?:;version=draft-07)?$)/i.test(
      schemaFormat,
    )
  ) {
    return source
  }

  const seen = new WeakMap<object, Record<string, unknown>>()
  const visit = (value: unknown): unknown => {
    if (!isObject(value)) {
      return value
    }
    const existing = seen.get(value)
    if (existing) {
      return existing
    }
    const result: Record<string, unknown> = {}
    seen.set(value, result)
    if (typeof value.$ref === 'string') {
      result.$ref = value.$ref
      // Bookkeeping belongs to the store, not the authored Reference Object.
      for (const key of ['$global', '$status']) {
        if (Object.hasOwn(value, key)) {
          result[key] = value[key]
        }
      }
      Object.defineProperty(result, '$ref-value', {
        value: visit(getResolvedAsyncApiRef(value)),
        enumerable: true,
      })
      return result
    }
    for (const [key, child] of Object.entries(value)) {
      Object.defineProperty(result, key, {
        value: visitChild(key, child),
        enumerable: true,
        configurable: true,
        writable: true,
      })
    }
    return result
  }
  const visitChild = (key: string, child: unknown): unknown => {
    if (schemaMaps.has(key) && isObject(child)) {
      return Object.fromEntries(Object.entries(child).map(([name, schema]) => [name, visit(schema)]))
    }
    if (key === 'dependencies' && isObject(child)) {
      return Object.fromEntries(
        Object.entries(child).map(([name, dependency]) => [
          name,
          Array.isArray(dependency) ? dependency : visit(dependency),
        ]),
      )
    }
    if ((schemaArrays.has(key) || key === 'items') && Array.isArray(child)) {
      return child.map(visit)
    }
    return schemaFields.has(key) ? visit(child) : child
  }
  return visit(source)
}
