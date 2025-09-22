import { isDefined } from '@scalar/helpers/array/is-defined'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

/** Maximum recursion depth to prevent infinite loops in circular references */
const MAX_LEVELS_DEEP = 10

/**
 * Maximum properties to include after level 3 to prevent exponential growth
 * in deeply nested object structures
 */
const MAX_PROPERTIES = 10

/** Default name used for additional properties when no custom name is provided */
const DEFAULT_ADDITIONAL_PROPERTIES_NAME = 'propertyName*'

/**
 * Pre-computed date/time values to avoid expensive Date operations on every call.
 * These are calculated once at module load time for better performance.
 */
const currentISOString = new Date().toISOString()
const currentDateString = currentISOString.split('T')[0]!
const currentTimeString = currentISOString.split('T')[1]!.split('.')[0]!

/**
 * Mapping of OpenAPI string formats to example values.
 * Used to generate realistic examples for different string formats.
 */
const genericExampleValues: Record<string, string> = {
  'date-time': currentISOString,
  'date': currentDateString,
  'email': 'hello@example.com',
  'hostname': 'example.com',
  // https://tools.ietf.org/html/rfc6531#section-3.3
  'idn-email': 'jane.doe@example.com',
  // https://tools.ietf.org/html/rfc5890#section-2.3.2.3
  'idn-hostname': 'example.com',
  'ipv4': '127.0.0.1',
  'ipv6': '51d4:7fab:bfbf:b7d7:b2cb:d4b4:3dad:d998',
  'iri-reference': '/entitiy/1',
  // https://tools.ietf.org/html/rfc3987
  'iri': 'https://example.com/entity/123',
  'json-pointer': '/nested/objects',
  'password': 'super-secret',
  'regex': '/[a-z]/',
  // https://tools.ietf.org/html/draft-handrews-relative-json-pointer-01
  'relative-json-pointer': '1/nested/objects',
  // full-time in https://tools.ietf.org/html/rfc3339#section-5.6
  'time': currentTimeString,
  // either a URI or relative-reference https://tools.ietf.org/html/rfc3986#section-4.1
  'uri-reference': '../folder',
  'uri-template': 'https://example.com/{id}',
  'uri': 'https://example.com',
  'uuid': '123e4567-e89b-12d3-a456-426614174000',
  'object-id': '6592008029c8c3e4dc76256c',
}

/**
 * Generate example values for string types based on their format.
 * Special handling for binary format which returns a File object.
 */
const guessFromFormat = (
  schema: SchemaObject,
  makeUpRandomData: boolean = false,
  fallback: string = '',
): string | File => {
  // Handle binary format specially - return a File object
  if ('type' in schema && schema.type === 'string' && 'format' in schema && schema.format === 'binary') {
    return new File([''], 'filename')
  }

  // Return format-specific example if we have one and are making up data
  if (makeUpRandomData && 'format' in schema && schema.format) {
    return genericExampleValues[schema.format] ?? fallback
  }

  return fallback
}

/**
 * WeakMap cache for memoizing resolved example results.
 * Uses the resolved schema object as the key for efficient lookups.
 */
const resultCache = new WeakMap<object, unknown>()

/**
 * Cache the result for a schema if it is an object type.
 * Primitive values are not cached to avoid unnecessary WeakMap operations.
 */
const cache = (schema: SchemaObject, result: unknown): unknown => {
  if (typeof result !== 'object' || result === null) return result
  resultCache.set(schema, result)
  return result
}

/**
 * Check if a schema uses composition keywords (allOf, oneOf, anyOf).
 * These require special handling for merging or selecting schemas.
 */
const isComposed = (schema: SchemaObject): boolean => !!(schema.allOf || schema.oneOf || schema.anyOf)

/**
 * Determine if a property should be omitted based on the options.
 * Properties are omitted if they are not required and the option is enabled.
 */
const shouldOmitProperty = (
  schema: SchemaObject,
  parentSchema: SchemaObject | undefined,
  propertyName: string | undefined,
  options: { omitEmptyAndOptionalProperties?: boolean } | undefined,
): boolean => {
  if (options?.omitEmptyAndOptionalProperties !== true) return false

  // Never omit container types (objects/arrays) or composed schemas
  const isContainer = ('type' in schema && (schema.type === 'object' || schema.type === 'array')) || isComposed(schema)
  if (isContainer) return false

  // Check if the property is required
  const name = propertyName ?? schema.title ?? ''
  const isRequired =
    parentSchema && Array.isArray((parentSchema as any).required) && (parentSchema as any).required.includes(name)

  return !isRequired
}

/**
 * Merge two example values with predictable semantics.
 * Arrays are concatenated, objects are merged, otherwise the new value wins.
 */
const mergeExamples = (baseValue: unknown, newValue: unknown): unknown => {
  if (Array.isArray(baseValue) && Array.isArray(newValue)) {
    return [...baseValue, ...newValue]
  }
  if (baseValue && typeof baseValue === 'object' && newValue && typeof newValue === 'object') {
    return { ...(baseValue as Record<string, unknown>), ...(newValue as Record<string, unknown>) }
  }
  return newValue
}

/**
 * Generate an example value from a given OpenAPI SchemaObject.
 *
 * This function recursively processes OpenAPI schemas to create realistic example data.
 * It handles all OpenAPI schema types including primitives, objects, arrays, and
 * composition schemas (allOf, oneOf, anyOf).
 *
 * Performance optimizations:
 * - Uses WeakMap caching to avoid recomputing examples for the same schema
 * - Limits recursion depth to prevent infinite loops
 * - Limits property count in deep objects to prevent exponential growth
 * - Uses efficient type guards to minimize property access
 */
export const getExampleFromSchema = (
  _schema: SchemaObject,
  options?: {
    /** Fallback string for empty string values. */
    emptyString?: string
    /** Whether to use XML tag names as keys. */
    xml?: boolean
    /** Whether to show read-only/write-only properties. */
    mode?: 'read' | 'write'
    /** Dynamic variables which can replace values via x-variable. */
    variables?: Record<string, unknown>
    /** Whether to omit empty and optional properties. */
    omitEmptyAndOptionalProperties?: boolean
  },
  level: number = 0,
  parentSchema?: SchemaObject,
  name?: string,
): unknown => {
  // Resolve any $ref references to get the actual schema
  const schema = getResolvedRef(_schema)
  if (!isDefined(schema)) return undefined

  // Check cache first for performance - avoid recomputing the same schema
  if (resultCache.has(schema)) return resultCache.get(schema)

  // Prevent infinite recursion in circular references
  if (level > MAX_LEVELS_DEEP) return '[Max Depth Exceeded]'

  // Determine if we should generate realistic example data
  const makeUpRandomData = !!options?.emptyString

  // Early exits for schemas that should not be included
  if (schema.deprecated) return undefined
  if ((options?.mode === 'write' && schema.readOnly) || (options?.mode === 'read' && schema.writeOnly)) return undefined
  if (shouldOmitProperty(schema, parentSchema, name, options)) return undefined

  // Handle custom variables (x-variable extension)
  if ('x-variable' in schema && schema['x-variable']) {
    const value = options?.variables?.[schema['x-variable']]
    if (value !== undefined) {
      // Type coercion for numeric types
      if ('type' in schema && (schema.type === 'number' || schema.type === 'integer')) {
        return cache(schema, Number(value))
      }
      return cache(schema, value)
    }
  }

  // Priority order: examples > example > default > const > enum
  if (Array.isArray(schema.examples) && schema.examples.length > 0) {
    return cache(schema, schema.examples[0])
  }
  if (schema.example !== undefined) return cache(schema, schema.example)
  if (schema.default !== undefined) return cache(schema, schema.default)
  if (schema.const !== undefined) return cache(schema, schema.const)
  if (Array.isArray(schema.enum) && schema.enum.length > 0) {
    return cache(schema, schema.enum[0])
  }

  // Handle object types - check for properties to identify objects
  if ('properties' in schema || ('type' in schema && schema.type === 'object')) {
    const response: Record<string, unknown> = {}

    // Process regular properties
    if ('properties' in schema && schema.properties) {
      const propertyNames = Object.keys(schema.properties)
      // Limit properties in deep objects to prevent exponential growth
      const limit = level > 3 ? Math.min(MAX_PROPERTIES, propertyNames.length) : propertyNames.length

      for (let i = 0; i < limit; i++) {
        const propertyName = propertyNames[i]!
        const propertySchema = getResolvedRef(schema.properties[propertyName])
        if (!propertySchema) continue

        // Use XML name if specified and XML mode is enabled
        const propertyXmlName = options?.xml && 'xml' in propertySchema ? propertySchema.xml?.name : undefined
        const value = getExampleFromSchema(propertySchema, options, level + 1, schema, propertyName)

        if (typeof value !== 'undefined') {
          response[propertyXmlName ?? propertyName] = value
        }
      }

      // Add truncation indicator if we hit the property limit
      if (level > 3 && propertyNames.length > MAX_PROPERTIES) {
        response['...'] = '[Additional Properties Truncated]'
      }
    }

    // Process pattern properties (regex-based property names)
    if ('patternProperties' in schema && schema.patternProperties) {
      const patterns = Object.keys(schema.patternProperties)
      for (let i = 0; i < patterns.length; i++) {
        const pattern = patterns[i]!
        const propertySchema = getResolvedRef(schema.patternProperties[pattern])
        if (!propertySchema) continue
        response[pattern] = getExampleFromSchema(propertySchema, options, level + 1, schema, pattern)
      }
    }

    // Process additional properties
    if ('additionalProperties' in schema && schema.additionalProperties !== undefined) {
      const additional = getResolvedRef(schema.additionalProperties)
      const isAnyType =
        schema.additionalProperties === true ||
        (typeof schema.additionalProperties === 'object' && Object.keys(schema.additionalProperties).length === 0)

      // Get custom name for additional properties if available
      const additionalName =
        typeof additional === 'object' &&
        'x-additionalPropertiesName' in additional &&
        typeof additional['x-additionalPropertiesName'] === 'string' &&
        additional['x-additionalPropertiesName'].trim().length > 0
          ? `${additional['x-additionalPropertiesName'].trim()}*`
          : DEFAULT_ADDITIONAL_PROPERTIES_NAME

      response[additionalName] = isAnyType
        ? 'anything'
        : typeof additional === 'object'
          ? getExampleFromSchema(additional, options, level + 1)
          : 'anything'
    }

    // Handle composition schemas within objects
    if (schema.oneOf?.[0]) {
      Object.assign(response, getExampleFromSchema(getResolvedRef(schema.oneOf[0]), options, level + 1))
    } else if (schema.anyOf?.[0]) {
      Object.assign(response, getExampleFromSchema(getResolvedRef(schema.anyOf[0]), options, level + 1))
    } else if (Array.isArray(schema.allOf) && schema.allOf.length > 0) {
      // Merge all schemas in allOf
      let merged: unknown = response
      for (let i = 0; i < schema.allOf.length; i++) {
        const item = getResolvedRef(schema.allOf[i])
        if (!item) continue
        const ex = getExampleFromSchema(item, options, level + 1, schema)
        merged = mergeExamples(merged, ex)
      }
      if (merged && typeof merged === 'object') {
        Object.assign(response, merged as Record<string, unknown>)
      }
    }

    // Handle XML wrapping at root level
    if (options?.xml && 'xml' in schema && schema.xml?.name && level === 0) {
      const wrapped: Record<string, unknown> = {}
      wrapped[schema.xml.name] = response
      return cache(schema, wrapped)
    }

    return cache(schema, response)
  }

  // Handle array types
  if (('type' in schema && schema.type === 'array') || 'items' in schema) {
    const items = 'items' in schema ? getResolvedRef(schema.items) : undefined
    const itemsXmlTagName = items && typeof items === 'object' && 'xml' in items ? (items as any).xml?.name : undefined
    const wrapItems = !!(options?.xml && 'xml' in schema && (schema as any).xml?.wrapped && itemsXmlTagName)

    // Use explicit example if provided
    if (schema.example !== undefined) {
      return cache(schema, wrapItems ? { [itemsXmlTagName as string]: schema.example } : schema.example)
    }

    if (items && typeof items === 'object') {
      // Handle allOf in array items
      if (Array.isArray((items as any).allOf) && (items as any).allOf.length > 0) {
        const allOf = (items as any).allOf.filter(isDefined)
        const first = getResolvedRef(allOf[0])

        // If first item is an object, merge all schemas
        if (first && typeof first === 'object' && 'type' in first && first.type === 'object') {
          const combined: SchemaObject = { type: 'object', allOf: allOf as any }
          const merged = getExampleFromSchema(combined, options, level + 1, schema)
          return cache(schema, wrapItems ? [{ [itemsXmlTagName as string]: merged }] : [merged])
        }

        // For non-objects, collect all examples
        const examples = allOf
          .map((s: any) => getExampleFromSchema(getResolvedRef(s), options, level + 1, schema))
          .filter(isDefined)
        return cache(
          schema,
          wrapItems ? (examples as unknown[]).map((e) => ({ [itemsXmlTagName as string]: e })) : examples,
        )
      }

      // Handle oneOf/anyOf in array items
      const union = (items as any).anyOf || (items as any).oneOf
      if (union && union.length > 0) {
        const first = union[0]
        const ex = getExampleFromSchema(getResolvedRef(first), options, level + 1, schema)
        return cache(schema, wrapItems ? [{ [itemsXmlTagName as string]: ex }] : [ex])
      }
    }

    // Generate example for regular array items
    const isObject =
      items && typeof items === 'object' && (('type' in items && items.type === 'object') || 'properties' in items)
    const isArray =
      items && typeof items === 'object' && (('type' in items && items.type === 'array') || 'items' in items)

    if (items && typeof items === 'object' && (('type' in items && items.type) || isObject || isArray)) {
      const ex = getExampleFromSchema(items as SchemaObject, options, level + 1)
      return cache(schema, wrapItems ? [{ [itemsXmlTagName as string]: ex }] : [ex])
    }

    return cache(schema, [])
  }

  // Handle primitive types
  const primitiveExamples: Record<string, unknown> = {
    string: guessFromFormat(schema, makeUpRandomData, options?.emptyString ?? ''),
    boolean: true,
    integer: 'minimum' in schema && typeof schema.minimum === 'number' ? schema.minimum : 1,
    number: 'minimum' in schema && typeof schema.minimum === 'number' ? schema.minimum : 1,
    array: [],
  }

  if ('type' in schema && schema.type && !Array.isArray(schema.type) && primitiveExamples[schema.type] !== undefined) {
    return cache(schema, primitiveExamples[schema.type])
  }

  // Handle composition schemas (oneOf, anyOf) at root level
  const discriminate = schema.oneOf || schema.anyOf
  if (Array.isArray(discriminate) && discriminate.length > 0) {
    // Find the first non-null type
    const firstNonNull = discriminate
      .map((i) => getResolvedRef(i))
      .find((i) => i && (!('type' in i) || i.type !== 'null'))

    if (firstNonNull) {
      return cache(schema, getExampleFromSchema(firstNonNull, options, level + 1))
    }
    return cache(schema, null)
  }

  // Handle union types (array of types)
  if ('type' in schema && Array.isArray(schema.type)) {
    if (schema.type.includes('null')) return cache(schema, null)
    const first = schema.type[0]
    const v = first ? primitiveExamples[first] : undefined
    if (v !== undefined) return cache(schema, v)
  }

  // Default fallback
  return cache(schema, null)
}
