import { isDefined } from '@scalar/helpers/array/is-defined'
import { getRaw } from '@scalar/json-magic/magic-proxy'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { unpackOverridesProxy } from '@scalar/workspace-store/helpers/overrides-proxy'
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

/** Cache required property names per parent schema for O(1) membership checks */
const requiredNamesCache = new WeakMap<object, ReadonlySet<string>>()

/**
 * Retrieves the set of required property names from a schema.
 * Caches the result in a WeakMap for efficient lookups.
 */
const getRequiredNames = (parentSchema: SchemaObject | undefined): ReadonlySet<string> | undefined => {
  if (!parentSchema) {
    return undefined
  }

  const cached = requiredNamesCache.get(parentSchema)
  if (cached) {
    return cached
  }

  if ('required' in parentSchema) {
    const required = parentSchema.required
    if (Array.isArray(required) && required.length > 0) {
      const set = new Set<string>(required)
      requiredNamesCache.set(parentSchema, set)
      return set
    }
  }

  return undefined
}

/**
 * Cache the result for a schema if it is an object type.
 * Primitive values are not cached to avoid unnecessary WeakMap operations.
 */
const cache = (schema: SchemaObject, result: unknown) => {
  if (typeof result !== 'object' || result === null) {
    return result
  }
  // Store the result in the cache using the raw schema object as the key
  resultCache.set(getRaw(unpackOverridesProxy(schema)), result)
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
  if (options?.omitEmptyAndOptionalProperties !== true) {
    return false
  }

  // Never omit container types (objects/arrays) or composed schemas
  const isContainer = ('type' in schema && (schema.type === 'object' || schema.type === 'array')) || isComposed(schema)
  if (isContainer) {
    return false
  }

  // Do not omit if explicit example-like values are present
  if (
    ('examples' in schema && Array.isArray(schema.examples) && schema.examples.length > 0) ||
    ('example' in schema && schema.example !== undefined) ||
    ('default' in schema && schema.default !== undefined) ||
    ('const' in schema && schema.const !== undefined) ||
    ('enum' in schema && Array.isArray(schema.enum) && schema.enum.length > 0)
  ) {
    return false
  }

  // Check if the property is required
  const name = propertyName ?? schema.title ?? ''
  const requiredNames = getRequiredNames(parentSchema)
  const isRequired = requiredNames ? requiredNames.has(name) : false

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
 * Build an example for an object schema, including properties, patternProperties,
 * additionalProperties, and composition (allOf/oneOf/anyOf) merging.
 */
const handleObjectSchema = (
  schema: SchemaObject,
  options: Parameters<typeof getExampleFromSchema>[1],
  level: number,
  seen: WeakSet<object>,
): unknown => {
  const response: Record<string, unknown> = {}

  if ('properties' in schema && schema.properties) {
    const propertyNames = Object.keys(schema.properties)
    const limit = level > 3 ? Math.min(MAX_PROPERTIES, propertyNames.length) : propertyNames.length

    for (let i = 0; i < limit; i++) {
      const propertyName = propertyNames[i]!
      const propertySchema = getResolvedRef(schema.properties[propertyName])
      if (!propertySchema) {
        continue
      }

      const propertyXmlName = options?.xml && 'xml' in propertySchema ? propertySchema.xml?.name : undefined
      const value = getExampleFromSchema(propertySchema, options, {
        level: level + 1,
        parentSchema: schema,
        name: propertyName,
        seen,
      })

      if (typeof value !== 'undefined') {
        response[propertyXmlName ?? propertyName] = value
      }
    }

    if (level > 3 && propertyNames.length > MAX_PROPERTIES) {
      response['...'] = '[Additional Properties Truncated]'
    }
  }

  if ('patternProperties' in schema && schema.patternProperties) {
    for (const pattern of Object.keys(schema.patternProperties)) {
      const propertySchema = getResolvedRef(schema.patternProperties[pattern])
      if (!propertySchema) {
        continue
      }
      response[pattern] = getExampleFromSchema(propertySchema, options, {
        level: level + 1,
        parentSchema: schema,
        name: pattern,
        seen,
      })
    }
  }

  if ('additionalProperties' in schema && schema.additionalProperties) {
    const additional = getResolvedRef(schema.additionalProperties)
    const isAnyType =
      schema.additionalProperties === true ||
      (typeof schema.additionalProperties === 'object' && Object.keys(schema.additionalProperties).length === 0)

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
        ? getExampleFromSchema(additional, options, {
            level: level + 1,
            seen,
          })
        : 'anything'
  }

  // onOf
  if (schema.oneOf?.[0]) {
    Object.assign(
      response,
      getExampleFromSchema(getResolvedRef(schema.oneOf[0]), options, {
        level: level + 1,
        seen,
      }),
    )
  }
  // anyOf
  else if (schema.anyOf?.[0]) {
    Object.assign(
      response,
      getExampleFromSchema(getResolvedRef(schema.anyOf[0]), options, {
        level: level + 1,
        seen,
      }),
    )
  }
  // allOf
  else if (Array.isArray(schema.allOf) && schema.allOf.length > 0) {
    let merged: unknown = response
    for (const item of schema.allOf) {
      const ex = getExampleFromSchema(getResolvedRef(item), options, {
        level: level + 1,
        parentSchema: schema,
        seen,
      })
      merged = mergeExamples(merged, ex)
    }
    if (merged && typeof merged === 'object') {
      Object.assign(response, merged as Record<string, unknown>)
    }
  }

  if (options?.xml && 'xml' in schema && schema.xml?.name && level === 0) {
    const wrapped: Record<string, unknown> = {}
    wrapped[schema.xml.name] = response
    return cache(schema, wrapped)
  }

  return cache(schema, response)
}

/** Build an example for an array schema, including items, allOf, oneOf/anyOf, and XML wrapping */
const handleArraySchema = (
  schema: SchemaObject,
  options: Parameters<typeof getExampleFromSchema>[1],
  level: number,
  seen: WeakSet<object>,
) => {
  const items = 'items' in schema ? getResolvedRef(schema.items) : undefined
  const itemsXmlTagName = items && typeof items === 'object' && 'xml' in items ? items.xml?.name : undefined
  const wrapItems = !!(options?.xml && 'xml' in schema && schema.xml?.wrapped && itemsXmlTagName)

  if (schema.example !== undefined) {
    return cache(schema, wrapItems ? { [itemsXmlTagName as string]: schema.example } : schema.example)
  }

  if (items && typeof items === 'object') {
    if (Array.isArray(items.allOf) && items.allOf.length > 0) {
      const allOf = items.allOf.filter(isDefined)
      const first = getResolvedRef(allOf[0])

      if (first && typeof first === 'object' && 'type' in first && first.type === 'object') {
        const combined: SchemaObject = { type: 'object', allOf }
        const merged = getExampleFromSchema(combined, options, {
          level: level + 1,
          parentSchema: schema,
          seen,
        })
        return cache(schema, wrapItems ? [{ [itemsXmlTagName as string]: merged }] : [merged])
      }

      const examples = allOf
        .map((s: any) =>
          getExampleFromSchema(getResolvedRef(s), options, {
            level: level + 1,
            parentSchema: schema,
            seen,
          }),
        )
        .filter(isDefined)
      return cache(
        schema,
        wrapItems ? (examples as unknown[]).map((e) => ({ [itemsXmlTagName as string]: e })) : examples,
      )
    }

    const union = items.anyOf || items.oneOf
    if (union && union.length > 0) {
      const first = union[0] as SchemaObject
      const ex = getExampleFromSchema(getResolvedRef(first), options, {
        level: level + 1,
        parentSchema: schema,
        seen,
      })
      return cache(schema, wrapItems ? [{ [itemsXmlTagName as string]: ex }] : [ex])
    }
  }

  const isObject =
    items && typeof items === 'object' && (('type' in items && items.type === 'object') || 'properties' in items)
  const isArray =
    items && typeof items === 'object' && (('type' in items && items.type === 'array') || 'items' in items)

  if (items && typeof items === 'object' && (('type' in items && items.type) || isObject || isArray)) {
    const ex = getExampleFromSchema(items as SchemaObject, options, {
      level: level + 1,
      seen,
    })
    return cache(schema, wrapItems ? [{ [itemsXmlTagName as string]: ex }] : [ex])
  }

  return cache(schema, [])
}

/** Return primitive example value for single-type schemas, or undefined if not primitive */
const getPrimitiveValue = (schema: SchemaObject, makeUpRandomData: boolean, emptyString: string | undefined) => {
  if ('type' in schema && schema.type && !Array.isArray(schema.type)) {
    switch (schema.type) {
      case 'string':
        return guessFromFormat(schema, makeUpRandomData, emptyString ?? '')
      case 'boolean':
        return true
      case 'integer':
        return 'minimum' in schema && typeof schema.minimum === 'number' ? schema.minimum : 1
      case 'number':
        return 'minimum' in schema && typeof schema.minimum === 'number' ? schema.minimum : 1
      case 'array':
        return []
      default:
        return undefined
    }
  }
  return undefined
}

/** Return primitive example value for union-type schemas (type: string[]) */
const getUnionPrimitiveValue = (schema: SchemaObject, makeUpRandomData: boolean, emptyString: string | undefined) => {
  if ('type' in schema && Array.isArray(schema.type)) {
    if (schema.type.includes('null')) {
      return null
    }

    const first = schema.type[0]
    if (first) {
      switch (first) {
        case 'string':
          return guessFromFormat(schema, makeUpRandomData, emptyString ?? '')
        case 'boolean':
          return true
        case 'integer':
          return 'minimum' in schema && typeof schema.minimum === 'number' ? schema.minimum : 1
        case 'number':
          return 'minimum' in schema && typeof schema.minimum === 'number' ? schema.minimum : 1
        case 'null':
          return null
        default:
          return undefined
      }
    }
  }
  return undefined
}

/**
 * Generate an example value from a given OpenAPI SchemaObject.
 *
 * This function recursively processes OpenAPI schemas to create realistic example data.
 * It handles all OpenAPI schema types including primitives, objects, arrays, and
 * composition schemas (allOf, oneOf, anyOf).
 * Uses a tonne of caching for maximum performance.
 *
 * @param schema - The OpenAPI SchemaObject to generate an example from.
 * @param options - Options to customize example generation.
 * @param level - The current recursion depth.
 * @param parentSchema - The parent schema, if any.
 * @param name - The name of the property being processed.
 * @returns An example value for the given schema.
 */
export const getExampleFromSchema = (
  schema: SchemaObject,
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
  args?: Partial<{
    level: number
    parentSchema: SchemaObject
    name: string
    seen: WeakSet<object>
  }>,
): unknown => {
  const { level = 0, parentSchema, name, seen = new WeakSet() } = args ?? {}

  // Resolve any $ref references to get the actual schema
  const _schema = getResolvedRef(schema)
  if (!isDefined(_schema)) {
    return undefined
  }

  // Unpack from all proxies to get the raw schema object for cycle detection
  const targetValue = getRaw(unpackOverridesProxy(_schema))
  if (seen.has(targetValue)) {
    return '[Circular Reference]'
  }
  seen.add(targetValue)

  // Check cache first for performance - avoid recomputing the same schema
  if (resultCache.has(targetValue)) {
    seen.delete(targetValue)
    return resultCache.get(targetValue)
  }

  // Prevent infinite recursion in circular references
  if (level > MAX_LEVELS_DEEP) {
    seen.delete(targetValue)
    return '[Max Depth Exceeded]'
  }

  // Determine if we should generate realistic example data
  const makeUpRandomData = !!options?.emptyString

  // Early exits for schemas that should not be included (deprecated, readOnly, writeOnly, omitEmptyAndOptionalProperties)
  if (
    _schema.deprecated ||
    (options?.mode === 'write' && _schema.readOnly) ||
    (options?.mode === 'read' && _schema.writeOnly) ||
    shouldOmitProperty(_schema, parentSchema, name, options)
  ) {
    seen.delete(targetValue)
    return undefined
  }

  // Handle custom variables (x-variable extension)
  if ('x-variable' in _schema && _schema['x-variable']) {
    const value = options?.variables?.[_schema['x-variable']]
    if (value !== undefined) {
      // Type coercion for numeric types
      if ('type' in _schema && (_schema.type === 'number' || _schema.type === 'integer')) {
        seen.delete(targetValue)
        return cache(_schema, Number(value))
      }
      seen.delete(targetValue)
      return cache(_schema, value)
    }
  }

  // Priority order: examples > example > default > const > enum
  if (Array.isArray(_schema.examples) && _schema.examples.length > 0) {
    seen.delete(targetValue)
    return cache(_schema, _schema.examples[0])
  }
  if (_schema.example !== undefined) {
    seen.delete(targetValue)
    return cache(_schema, _schema.example)
  }
  if (_schema.default !== undefined) {
    seen.delete(targetValue)
    return cache(_schema, _schema.default)
  }
  if (_schema.const !== undefined) {
    seen.delete(targetValue)
    return cache(_schema, _schema.const)
  }
  if (Array.isArray(_schema.enum) && _schema.enum.length > 0) {
    seen.delete(targetValue)
    return cache(_schema, _schema.enum[0])
  }

  // Handle object types - check for properties to identify objects
  if ('properties' in _schema || ('type' in _schema && _schema.type === 'object')) {
    const result = handleObjectSchema(_schema, options, level, seen)
    seen.delete(targetValue)
    return result
  }

  // Handle array types
  if (('type' in _schema && _schema.type === 'array') || 'items' in _schema) {
    const result = handleArraySchema(_schema, options, level, seen)
    seen.delete(targetValue)
    return result
  }

  // Handle primitive types without allocating temporary objects
  const primitive = getPrimitiveValue(_schema, makeUpRandomData, options?.emptyString)
  if (primitive !== undefined) {
    seen.delete(targetValue)
    return cache(_schema, primitive)
  }

  // Handle composition schemas (oneOf, anyOf) at root level
  const discriminate = _schema.oneOf || _schema.anyOf
  if (Array.isArray(discriminate) && discriminate.length > 0) {
    // Find the first non-null type without allocating intermediate arrays
    for (const item of discriminate) {
      const resolved = getResolvedRef(item)
      if (resolved && (!('type' in resolved) || resolved.type !== 'null')) {
        seen.delete(targetValue)
        return cache(
          _schema,
          getExampleFromSchema(resolved, options, {
            level: level + 1,
            seen,
          }),
        )
      }
    }
    seen.delete(targetValue)
    return cache(_schema, null)
  }

  // Handle allOf at root level (non-object/array schemas)
  if (Array.isArray(_schema.allOf) && _schema.allOf.length > 0) {
    let merged: unknown = undefined
    const items = _schema.allOf
    for (const item of items) {
      const ex = getExampleFromSchema(item as SchemaObject, options, {
        level: level + 1,
        parentSchema: _schema,
        seen,
      })
      if (merged === undefined) {
        merged = ex
      } else if (merged && typeof merged === 'object' && ex && typeof ex === 'object') {
        merged = mergeExamples(merged, ex)
      } else if (ex !== undefined) {
        // Prefer the latest defined primitive value
        merged = ex
      }
    }
    seen.delete(targetValue)
    return cache(_schema, merged ?? null)
  }

  // Handle union types (array of types)
  const unionPrimitive = getUnionPrimitiveValue(_schema, makeUpRandomData, options?.emptyString)
  if (unionPrimitive !== undefined) {
    seen.delete(targetValue)
    return cache(_schema, unionPrimitive)
  }

  // Default fallback
  seen.delete(targetValue)
  return cache(_schema, null)
}
