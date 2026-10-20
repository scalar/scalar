import { parseJsonPointerSegments } from '@scalar/helpers/json/parse-json-pointer-segments'
import { isObject } from '@scalar/helpers/object/is-object'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { unpackProxyShallow } from '@scalar/workspace-store/helpers/unpack-proxy'
import type { OpenApiDocument, SchemaObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

import { type ConstraintSchema, schemaDialect } from '../constraint-metadata'
import { unwrapForRead } from './unwrap-for-read'

type Dialect = NonNullable<ConstraintSchema[typeof schemaDialect]>

const dialectFromUri = (uri: unknown): Dialect => {
  if (typeof uri !== 'string') return 'unsupported'
  const normalized = uri.replace(/#$/, '')
  if (/^https?:\/\/json-schema.org\/draft-07\/schema$/.test(normalized)) return 'draft-07'
  if (normalized === 'https://json-schema.org/draft/2019-09/schema') return '2019-09'
  if (
    normalized === 'https://json-schema.org/draft/2020-12/schema' ||
    normalized === 'https://spec.openapis.org/oas/3.1/dialect/base' ||
    normalized === 'https://spec.openapis.org/oas/3.2/dialect/base'
  )
    return '2020-12'
  return 'unsupported'
}

/** Store upgrades do not change which JSON Schema keywords the source document supports. */
export const supportsOpenApiSchemaDialect = (document: OpenApiDocument | undefined): boolean => {
  const version = document?.['x-original-oas-version'] ?? document?.openapi
  return typeof version === 'string' && /^3\.(?:[1-9]\d*)\./.test(version)
}

/**
 * Make read-only display views without annotating the document or its examples.
 * Children are lazy so collapsed trees do not eagerly traverse every referenced model.
 * Cache by source and inherited dialect to preserve cycles while allowing reused schemas
 * to appear under different resource dialects.
 */
const createAdapter = (document: OpenApiDocument): ((schema: SchemaObject) => SchemaObject) => {
  const defaultDialect =
    document.jsonSchemaDialect === undefined ? '2020-12' : dialectFromUri(document.jsonSchemaDialect)
  const cache = new WeakMap<object, Map<Dialect, Record<PropertyKey, unknown>>>()

  const referenceDialect = (ref: unknown): Dialect => {
    if (typeof ref !== 'string' || !ref.startsWith('#/')) return defaultDialect
    let current: unknown = document
    let dialect = defaultDialect
    for (const key of parseJsonPointerSegments(ref.slice(1))) {
      if (!isObject(current) && !Array.isArray(current)) break
      current = (current as Record<string, unknown>)[key]
      if (isObject(current) && '$schema' in current) dialect = dialectFromUri(current.$schema)
    }
    return dialect
  }

  const adapt = (input: unknown, inherited: Dialect): unknown => {
    if (!isObject(input)) return input
    const source = unwrapForRead(input) as Record<PropertyKey, unknown>
    if (schemaDialect in source) return source
    const dialect = '$schema' in source ? dialectFromUri(source.$schema) : inherited
    const identity = unpackProxyShallow(source)
    const cached = cache.get(identity)?.get(dialect)
    if (cached) return cached
    const view: Record<PropertyKey, unknown> = { ...source, [schemaDialect]: dialect }
    const entries = cache.get(identity) ?? new Map<Dialect, Record<PropertyKey, unknown>>()
    entries.set(dialect, view)
    cache.set(identity, entries)

    const child = (key: string, read: () => unknown): void => {
      if (!(key in source)) return
      let loaded = false
      let value: unknown
      Object.defineProperty(view, key, {
        enumerable: key !== '$ref-value',
        configurable: true,
        get: () => {
          if (!loaded) {
            value = read()
            loaded = true
          }
          return value
        },
      })
    }
    for (const key of ['properties', 'patternProperties', '$defs', 'definitions', 'dependentSchemas', 'dependencies']) {
      child(key, () =>
        isObject(source[key])
          ? Object.fromEntries(Object.entries(source[key]).map(([name, value]) => [name, adapt(value, dialect)]))
          : source[key],
      )
    }
    for (const key of [
      'items',
      'additionalItems',
      'additionalProperties',
      'unevaluatedProperties',
      'unevaluatedItems',
      'propertyNames',
      'not',
      'contains',
      'if',
      'then',
      'else',
      'contentSchema',
    ]) {
      child(key, () =>
        Array.isArray(source[key]) ? source[key].map((value) => adapt(value, dialect)) : adapt(source[key], dialect),
      )
    }
    for (const key of ['allOf', 'oneOf', 'anyOf', 'prefixItems']) {
      child(key, () => (Array.isArray(source[key]) ? source[key].map((value) => adapt(value, dialect)) : source[key]))
    }
    if ('$ref' in source) {
      // The target belongs to its own resource, not the resource containing the reference.
      child('$ref-value', () => adapt(source['$ref-value'], referenceDialect(source.$ref)))
      if (dialect === 'draft-07') {
        // Draft-07 treats a reference as indirection and ignores all siblings.
        for (const key of Reflect.ownKeys(view)) {
          if (key !== '$ref' && key !== '$ref-value') delete view[key]
        }
        return view
      }
      // Pure reference wrappers must not override the target's dialect during resolution.
      if (
        Object.keys(source).every((key) =>
          [
            '$ref',
            '$ref-value',
            '$global',
            '$status',
            'title',
            'description',
            'deprecated',
            'readOnly',
            'writeOnly',
            'example',
            'examples',
            'default',
          ].includes(key),
        )
      ) {
        delete view[schemaDialect]
      } else {
        const target = getResolvedRef(view['$ref-value']) as ConstraintSchema | undefined
        if (
          ![
            'if',
            'then',
            'else',
            'contains',
            'minContains',
            'maxContains',
            'dependencies',
            'dependentRequired',
            'dependentSchemas',
          ].some((key) => key in source) &&
          (!target?.[schemaDialect] || target[schemaDialect] === dialect)
        )
          return view
        // $ref and its siblings both apply. Merging their conditional groups would
        // pair one resource's `if` with another resource's `then` or dialect.
        const reference = { $ref: source.$ref, '$ref-value': view['$ref-value'] }
        const members = Array.isArray(view.allOf) ? view.allOf : []
        delete view.$ref
        delete view['$ref-value']
        Object.defineProperty(view, 'allOf', { value: [reference, ...members], enumerable: true, configurable: true })
      }
    }
    return view
  }
  return (schema) => adapt(schema, defaultDialect) as SchemaObject
}

// Like unwrapForRead, these views rely on API descriptions being replaced rather than
// edited in place. Weak keys release both views and their caches when a document is removed.
const adapters = new WeakMap<OpenApiDocument, ReturnType<typeof createAdapter>>()

/** Opt OpenAPI 3.1+ into dialect-aware constraints while preserving native AsyncAPI views. */
export const openApiSchemaView = (
  schema: SchemaObject | undefined,
  document: OpenApiDocument | undefined,
): SchemaObject | undefined => {
  if (!schema || !document || schemaDialect in schema || !supportsOpenApiSchemaDialect(document)) return schema
  const source = unwrapForRead(document)
  const adapter = adapters.get(source) ?? createAdapter(source)
  adapters.set(source, adapter)
  return adapter(schema)
}
