import { isDefined } from '@scalar/helpers/array/is-defined'

import { type DynamicScope, isDynamicRef, pushDynamicScope, resolveDynamicRef } from '@/helpers/dynamic-ref'
import { unpackProxyObject } from '@/helpers/unpack-proxy'
import { resolve } from '@/resolve'
import type { SchemaObject } from '@/schemas/v3.1/strict/openapi-document'

/** Maximum recursion depth to prevent infinite loops in circular references */
const MAX_LEVELS_DEEP = 10

/** Default name used for additional properties when no custom name is provided */
const DEFAULT_ADDITIONAL_PROPERTIES_NAME = 'additionalProperty'

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
 * Extract enum values from the propertyNames keyword of an object schema.
 * JSON Schema's propertyNames constrains which keys are valid in a map/dict.
 */
const getPropertyNamesEnumValues = (schema: SchemaObject): unknown[] | undefined => {
  if (!('propertyNames' in schema) || !schema.propertyNames) {
    return undefined
  }

  const resolved = resolve.schema(schema.propertyNames as SchemaObject)
  if (resolved && 'enum' in resolved && Array.isArray(resolved.enum) && resolved.enum.length > 0) {
    return resolved.enum
  }

  return undefined
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
    return '@filename'
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
const resultCache = new WeakMap<object, Map<string, unknown>>()

/** Cache required property names per parent schema for O(1) membership checks */
const requiredNamesCache = new WeakMap<object, ReadonlySet<string>>()

/** Normalize schema identity for cache and cycle tracking */
const getSchemaCacheTarget = (schema: SchemaObject): object => unpackProxyObject(schema, { depth: 1 }) as object

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
 * Stores a map of cacheKey strings which is made up of the options object.
 *
 * Skips the cache while a dynamic scope is active: the same shared schema node can resolve to
 * different examples depending on the dynamic scope it was reached through, so caching it by object
 * identity would leak one scope's result into another.
 */
const cache = (schema: SchemaObject, result: unknown, cacheKey: string, skip = false) => {
  if (skip || typeof result !== 'object' || result === null) {
    return result
  }
  const rawSchema = getSchemaCacheTarget(schema)

  const cacheMap = resultCache.get(rawSchema) ?? new Map()
  if (cacheMap) {
    cacheMap.set(cacheKey, result)
  }
  resultCache.set(rawSchema, cacheMap)
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
  options: Pick<GetExampleFromSchemaOptions, 'omitEmptyAndOptionalProperties' | 'mode'> | undefined,
): boolean => {
  // Early exits for schemas that should not be included (deprecated, readOnly, writeOnly)
  if (
    schema.deprecated ||
    (options?.mode === 'write' && schema.readOnly) ||
    (options?.mode === 'read' && schema.writeOnly)
  ) {
    return true
  }

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

type CompositionKeyword = 'anyOf' | 'oneOf'
type SchemaPrimitiveType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null' | 'integer'
const MAX_SCHEMA_VALIDATION_DEPTH = MAX_LEVELS_DEEP * 5

/** Cache composed schema resolution to preserve identity across recursion checks. */
const composedSchemaResolutionCache = new WeakMap<object, SchemaObject | undefined>()

const isValueOfType = (value: unknown, targetType: SchemaPrimitiveType): boolean => {
  switch (targetType) {
    case 'string':
      return typeof value === 'string'
    case 'number':
      return typeof value === 'number' && !Number.isNaN(value)
    case 'integer':
      return typeof value === 'number' && Number.isInteger(value)
    case 'boolean':
      return typeof value === 'boolean'
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value)
    case 'array':
      return Array.isArray(value)
    case 'null':
      return value === null
    default:
      return false
  }
}

const resolveComposedSchemaMember = (schema: SchemaObject): SchemaObject | undefined => {
  const rawSchema = getSchemaCacheTarget(schema)
  if (composedSchemaResolutionCache.has(rawSchema)) {
    return composedSchemaResolutionCache.get(rawSchema)
  }

  const resolved = '$ref' in schema ? resolve.schema(schema) : schema
  composedSchemaResolutionCache.set(rawSchema, resolved)
  return resolved
}

const schemaAllowsValue = (
  schema: SchemaObject,
  value: unknown,
  seen: Set<object> = new Set(),
  level: number = 0,
): boolean => {
  // Depth guard prevents stack overflows when composed schemas loop through wrapped resolver objects.
  if (level > MAX_SCHEMA_VALIDATION_DEPTH) {
    return true
  }

  const rawSchema = getSchemaCacheTarget(schema)

  if (seen.has(rawSchema)) {
    return true
  }
  seen.add(rawSchema)

  if ('type' in schema && schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type]
    const matchesType = types.some((targetType) => {
      if (targetType === 'number' && isValueOfType(value, 'integer')) {
        return true
      }

      return isValueOfType(value, targetType)
    })

    if (!matchesType) {
      seen.delete(rawSchema)
      return false
    }
  }

  const anyOf = schema.anyOf
  if (Array.isArray(anyOf) && anyOf.length > 0) {
    const matchesAnyOf = anyOf.some((item) => {
      const resolved = resolveComposedSchemaMember(item as SchemaObject)
      return !!resolved && schemaAllowsValue(resolved, value, seen, level + 1)
    })

    if (!matchesAnyOf) {
      seen.delete(rawSchema)
      return false
    }
  }

  const oneOf = schema.oneOf
  if (Array.isArray(oneOf) && oneOf.length > 0) {
    const matchesOneOf = oneOf.some((item) => {
      const resolved = resolveComposedSchemaMember(item as SchemaObject)
      return !!resolved && schemaAllowsValue(resolved, value, seen, level + 1)
    })

    if (!matchesOneOf) {
      seen.delete(rawSchema)
      return false
    }
  }

  const allOf = schema.allOf
  if (Array.isArray(allOf) && allOf.length > 0) {
    const matchesAllOf = allOf.every((item) => {
      const resolved = resolveComposedSchemaMember(item as SchemaObject)
      return !resolved || schemaAllowsValue(resolved, value, seen, level + 1)
    })

    if (!matchesAllOf) {
      seen.delete(rawSchema)
      return false
    }
  }

  seen.delete(rawSchema)
  return true
}

const INVALID_DEFAULT = Symbol('INVALID_DEFAULT')

const normalizeSchemaDefault = (schema: SchemaObject): unknown | typeof INVALID_DEFAULT => {
  const defaultValue = schema.default

  if (schemaAllowsValue(schema, defaultValue)) {
    return defaultValue
  }

  return INVALID_DEFAULT
}

const getCompositionSelectionKey = (schemaPath: string[], composition: CompositionKeyword): string =>
  [...schemaPath, composition].join('.')

const getCompositionSelectionIndex = (
  schemaPath: string[],
  composition: CompositionKeyword,
  options: GetExampleFromSchemaOptions | undefined,
  length: number,
): number | undefined => {
  const rawIndex = options?.compositionSelection?.[getCompositionSelectionKey(schemaPath, composition)]

  if (typeof rawIndex !== 'number' || Number.isNaN(rawIndex)) {
    return undefined
  }

  return Math.max(0, Math.min(rawIndex, length - 1))
}

/**
 * Read the numeric `x-order` extension value from a raw property entry, if present.
 * The entry may be a schema or a `$ref` object, so we check membership before reading.
 */
const getXOrder = (property: unknown): number | undefined => {
  if (property && typeof property === 'object' && 'x-order' in property) {
    const order = Number((property as Record<string, unknown>)['x-order'])
    return Number.isNaN(order) ? undefined : order
  }
  return undefined
}

/**
 * Sort property names by the `x-order` extension.
 * Properties with `x-order` come first, ascending by value; the rest keep their
 * original insertion order thanks to a stable sort.
 */
const sortPropertyNamesByXOrder = (properties: Record<string, unknown>): string[] =>
  Object.keys(properties).sort((a, b) => {
    const aOrder = getXOrder(properties[a])
    const bOrder = getXOrder(properties[b])

    if (aOrder !== undefined && bOrder !== undefined) {
      return aOrder - bOrder
    }
    if (aOrder !== undefined) {
      return -1
    }
    if (bOrder !== undefined) {
      return 1
    }
    return 0
  })

/**
 * Build an example for an object schema, including properties, patternProperties,
 * additionalProperties, and composition (allOf/oneOf/anyOf) merging.
 */
const handleObjectSchema = (
  schema: SchemaObject,
  options: Parameters<typeof getExampleFromSchema>[1],
  level: number,
  seen: WeakSet<object>,
  cacheKey: string,
  schemaPath: string[],
  dynamicScope: DynamicScope,
): unknown => {
  const response: Record<string, unknown> = {}
  // Children are evaluated with this schema added to the dynamic scope so nested `$dynamicRef`s bind here.
  const childScope = pushDynamicScope(dynamicScope, schema)
  const skipCache = dynamicScope.length > 0

  if ('properties' in schema && schema.properties) {
    const properties = schema.properties
    const propertyNames = sortPropertyNamesByXOrder(properties)
    const limit = propertyNames.length

    for (let i = 0; i < limit; i++) {
      const propertyName = propertyNames[i]!
      const propertySchema = resolve.schema(properties[propertyName])
      if (!propertySchema) {
        continue
      }

      const propertyXmlName = options?.xml && 'xml' in propertySchema ? propertySchema.xml?.name : undefined
      const value = getExampleFromSchema(propertySchema, options, {
        level: level + 1,
        parentSchema: schema,
        name: propertyName,
        schemaPath: [...schemaPath, propertyName],
        seen,
        dynamicScope: childScope,
      })

      if (typeof value !== 'undefined') {
        response[propertyXmlName ?? propertyName] = value
      }
    }
  }

  if ('patternProperties' in schema && schema.patternProperties) {
    for (const pattern of Object.keys(schema.patternProperties)) {
      const propertySchema = resolve.schema(schema.patternProperties[pattern])
      if (!propertySchema) {
        continue
      }
      response[pattern] = getExampleFromSchema(propertySchema, options, {
        level: level + 1,
        parentSchema: schema,
        name: pattern,
        schemaPath: [...schemaPath, pattern],
        seen,
        dynamicScope: childScope,
      })
    }
  }

  if ('additionalProperties' in schema && schema.additionalProperties) {
    const additional =
      typeof schema.additionalProperties === 'boolean'
        ? schema.additionalProperties
        : resolve.schema(schema.additionalProperties)
    const isAnyType =
      schema.additionalProperties === true ||
      (typeof schema.additionalProperties === 'object' && Object.keys(schema.additionalProperties).length === 0)

    // Check for explicit x-additionalPropertiesName first
    const hasCustomName =
      typeof additional === 'object' &&
      'x-additionalPropertiesName' in additional &&
      typeof additional['x-additionalPropertiesName'] === 'string' &&
      additional['x-additionalPropertiesName'].trim().length > 0

    // Use propertyNames enum values as example keys when no custom name is set
    const propertyNamesEnum = hasCustomName ? undefined : getPropertyNamesEnumValues(schema)

    const additionalName = hasCustomName
      ? (additional as unknown as Record<string, string>)['x-additionalPropertiesName']!.trim()
      : DEFAULT_ADDITIONAL_PROPERTIES_NAME

    const additionalValue = isAnyType
      ? 'anything'
      : typeof additional === 'object'
        ? getExampleFromSchema(additional, options, {
            level: level + 1,
            schemaPath: [...schemaPath, additionalName],
            seen,
            dynamicScope: childScope,
          })
        : 'anything'

    if (propertyNamesEnum && propertyNamesEnum.length > 0) {
      // Use the first enum value as a realistic example key
      response[String(propertyNamesEnum[0])] = additionalValue
    } else {
      response[additionalName] = additionalValue
    }
  }

  const compositionKeyword = schema.oneOf ? 'oneOf' : schema.anyOf ? 'anyOf' : undefined
  const oneOfAnyOf = compositionKeyword ? schema[compositionKeyword] : undefined
  if (compositionKeyword && oneOfAnyOf?.length) {
    const index = getCompositionSelectionIndex(schemaPath, compositionKeyword, options, oneOfAnyOf.length) ?? 0
    const chosen = resolve.schema(oneOfAnyOf[index])
    if (chosen) {
      Object.assign(
        response,
        getExampleFromSchema(chosen, options, {
          level: level + 1,
          schemaPath,
          seen,
          dynamicScope: childScope,
        }),
      )
    }
  }
  // allOf
  else if (Array.isArray(schema.allOf) && schema.allOf.length > 0) {
    let merged: unknown = response
    for (const item of schema.allOf) {
      const ex = getExampleFromSchema(resolve.schema(item), options, {
        level: level + 1,
        parentSchema: schema,
        seen,
        dynamicScope: childScope,
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
    return cache(schema, wrapped, cacheKey, skipCache)
  }

  return cache(schema, response, cacheKey, skipCache)
}

/** Build an example for an array schema, including items, allOf, oneOf/anyOf, and XML wrapping */
const handleArraySchema = (
  schema: SchemaObject,
  options: Parameters<typeof getExampleFromSchema>[1],
  level: number,
  seen: WeakSet<object>,
  cacheKey: string,
  schemaPath: string[],
  dynamicScope: DynamicScope,
) => {
  const childScope = pushDynamicScope(dynamicScope, schema)
  const skipCache = dynamicScope.length > 0

  let items = 'items' in schema ? resolve.schema(schema.items) : undefined
  // Bind a dynamic item type (e.g. the generic `PaginatedResponse<T>` pattern) before inspecting it.
  if (items && isDynamicRef(items)) {
    items = resolveDynamicRef(items.$dynamicRef, childScope) ?? items
  }
  const itemsSchemaPath = [...schemaPath, 'items']
  const itemsXmlTagName = items && typeof items === 'object' && 'xml' in items ? items.xml?.name : undefined
  const wrapItems = !!(options?.xml && 'xml' in schema && schema.xml?.wrapped && itemsXmlTagName)

  if (schema.example !== undefined) {
    return cache(
      schema,
      wrapItems ? { [itemsXmlTagName as string]: schema.example } : schema.example,
      cacheKey,
      skipCache,
    )
  }

  if (items && typeof items === 'object') {
    if (Array.isArray(items.allOf) && items.allOf.length > 0) {
      const allOf = items.allOf.filter(isDefined)
      const first = resolve.schema(allOf[0])

      if (first && typeof first === 'object' && 'type' in first && first.type === 'object') {
        const combined: SchemaObject = { type: 'object', allOf }
        const merged = getExampleFromSchema(combined, options, {
          level: level + 1,
          parentSchema: schema,
          schemaPath: itemsSchemaPath,
          seen,
          dynamicScope: childScope,
        })
        return cache(schema, wrapItems ? [{ [itemsXmlTagName as string]: merged }] : [merged], cacheKey, skipCache)
      }

      const examples = allOf
        .map((s) =>
          getExampleFromSchema(resolve.schema(s), options, {
            level: level + 1,
            parentSchema: schema,
            schemaPath: itemsSchemaPath,
            seen,
            dynamicScope: childScope,
          }),
        )
        .filter(isDefined)
      return cache(
        schema,
        wrapItems ? (examples as unknown[]).map((e) => ({ [itemsXmlTagName as string]: e })) : examples,
        cacheKey,
        skipCache,
      )
    }

    const compositionKeyword = items.oneOf ? 'oneOf' : items.anyOf ? 'anyOf' : undefined
    const union = compositionKeyword ? items[compositionKeyword] : undefined
    if (compositionKeyword && union && union.length > 0) {
      const selectedIndex =
        getCompositionSelectionIndex(itemsSchemaPath, compositionKeyword, options, union.length) ?? 0
      const selected = union[selectedIndex]!
      const ex = getExampleFromSchema(resolve.schema(selected), options, {
        level: level + 1,
        parentSchema: schema,
        schemaPath: itemsSchemaPath,
        seen,
        dynamicScope: childScope,
      })
      return cache(schema, wrapItems ? [{ [itemsXmlTagName as string]: ex }] : [ex], cacheKey, skipCache)
    }
  }

  const isObject =
    items && typeof items === 'object' && (('type' in items && items.type === 'object') || 'properties' in items)
  const isArray =
    items && typeof items === 'object' && (('type' in items && items.type === 'array') || 'items' in items)

  if (items && typeof items === 'object' && (('type' in items && items.type) || isObject || isArray)) {
    const ex = getExampleFromSchema(items as SchemaObject, options, {
      level: level + 1,
      schemaPath: itemsSchemaPath,
      seen,
      dynamicScope: childScope,
    })
    return cache(schema, wrapItems ? [{ [itemsXmlTagName as string]: ex }] : [ex], cacheKey, skipCache)
  }

  return cache(schema, [], cacheKey, skipCache)
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

type GetExampleFromSchemaOptions = {
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
  /** Selected oneOf/anyOf variants keyed by schema path. */
  compositionSelection?: Record<string, number>
}

/** Create stable cache key from the options object */
const createOptionsCacheKey = (options: GetExampleFromSchemaOptions | undefined) =>
  JSON.stringify({
    emptyString: options?.emptyString,
    xml: options?.xml,
    mode: options?.mode,
    variables: options?.variables,
    omitEmptyAndOptionalProperties: options?.omitEmptyAndOptionalProperties,
    compositionSelection: options?.compositionSelection
      ? Object.entries(options.compositionSelection).sort(([a], [b]) => a.localeCompare(b))
      : undefined,
  })

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
  options?: GetExampleFromSchemaOptions,
  {
    level = 0,
    parentSchema,
    name,
    seen = new WeakSet(),
    schemaPath = [],
    dynamicScope = [],
  }: Partial<{
    level: number
    parentSchema: SchemaObject
    name: string
    seen: WeakSet<object>
    /** Internal traversal path used to resolve nested composition selections. */
    schemaPath: string[]
    /** Chain of schema resources entered so far, used to resolve `$dynamicRef` (JSON Schema 2020-12). */
    dynamicScope: DynamicScope
  }> = {},
): unknown => {
  // Resolve any $ref references to get the actual schema
  const _schema = resolve.schema(schema)
  if (!isDefined(_schema)) {
    return undefined
  }

  // Resolve a `$dynamicRef` against the active dynamic scope, then continue with the bound schema.
  // When nothing matches, fall through and render the reference as before (no regression).
  if (isDynamicRef(_schema)) {
    const resolvedDynamic = resolveDynamicRef(_schema.$dynamicRef, dynamicScope)
    if (resolvedDynamic) {
      return getExampleFromSchema(resolvedDynamic, options, {
        level: level + 1,
        parentSchema,
        name,
        seen,
        schemaPath,
        dynamicScope,
      })
    }
  }

  // Grow the scope with this schema so nested references can bind to its `$dynamicAnchor`s.
  const childScope = pushDynamicScope(dynamicScope, _schema)
  // The same shared node can resolve differently per scope, so skip the result cache under a scope.
  const skipCache = dynamicScope.length > 0

  // Unpack from all proxies to get the raw schema object for cycle detection
  const targetValue = getSchemaCacheTarget(_schema)
  if (seen.has(targetValue)) {
    return undefined
  }
  seen.add(targetValue)

  /** Make the cache key unique per options and schema path */
  const cacheKey = createOptionsCacheKey(options) + (schemaPath.length > 0 ? `:path:${schemaPath.join('.')}` : '')

  // Check cache first for performance - avoid recomputing the same schema (skipped under a dynamic scope)
  if (!skipCache) {
    const cached = resultCache.get(targetValue)?.get(cacheKey)
    if (typeof cached !== 'undefined') {
      seen.delete(targetValue)
      return cached
    }
  }

  // Prevent infinite recursion in circular references
  if (level > MAX_LEVELS_DEEP) {
    seen.delete(targetValue)
    return '[Max Depth Exceeded]'
  }

  // Determine if we should generate realistic example data
  const makeUpRandomData = !!options?.emptyString

  // Early exits for schemas that should not be included (deprecated, readOnly, writeOnly, omitEmptyAndOptionalProperties)
  if (shouldOmitProperty(_schema, parentSchema, name, options)) {
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
        return cache(_schema, Number(value), cacheKey, skipCache)
      }
      seen.delete(targetValue)
      return cache(_schema, value, cacheKey, skipCache)
    }
  }

  // Priority order: examples > example > default > const > enum
  if (Array.isArray(_schema.examples) && _schema.examples.length > 0) {
    seen.delete(targetValue)
    return cache(_schema, _schema.examples[0], cacheKey, skipCache)
  }
  if (_schema.example !== undefined) {
    seen.delete(targetValue)
    return cache(_schema, _schema.example, cacheKey, skipCache)
  }
  if (_schema.default !== undefined) {
    const normalizedDefault = normalizeSchemaDefault(_schema)

    if (normalizedDefault !== INVALID_DEFAULT) {
      seen.delete(targetValue)
      return cache(_schema, normalizedDefault, cacheKey, skipCache)
    }
  }
  if (_schema.const !== undefined) {
    seen.delete(targetValue)
    return cache(_schema, _schema.const, cacheKey, skipCache)
  }
  if (Array.isArray(_schema.enum) && _schema.enum.length > 0) {
    seen.delete(targetValue)
    return cache(_schema, _schema.enum[0], cacheKey, skipCache)
  }

  // Handle object types - check for properties to identify objects
  if ('properties' in _schema || ('type' in _schema && _schema.type === 'object')) {
    const result = handleObjectSchema(_schema, options, level, seen, cacheKey, schemaPath, dynamicScope)
    seen.delete(targetValue)
    return result
  }

  // Handle array types
  if (('type' in _schema && _schema.type === 'array') || 'items' in _schema) {
    const result = handleArraySchema(_schema, options, level, seen, cacheKey, schemaPath, dynamicScope)
    seen.delete(targetValue)
    return result
  }

  // Handle primitive types without allocating temporary objects
  const primitive = getPrimitiveValue(_schema, makeUpRandomData, options?.emptyString)
  if (primitive !== undefined) {
    seen.delete(targetValue)
    return cache(_schema, primitive, cacheKey, skipCache)
  }

  // Handle composition schemas (oneOf, anyOf)
  const compositionKeyword = _schema.oneOf ? 'oneOf' : _schema.anyOf ? 'anyOf' : undefined
  const discriminate = compositionKeyword ? _schema[compositionKeyword] : undefined
  if (compositionKeyword && Array.isArray(discriminate) && discriminate.length > 0) {
    const index = getCompositionSelectionIndex(schemaPath, compositionKeyword, options, discriminate.length)
    const candidate =
      index !== undefined
        ? discriminate[index]
        : discriminate.find((item) => {
            const resolved = resolve.schema(item)
            return resolved && (!('type' in resolved) || resolved.type !== 'null')
          })
    if (candidate) {
      const resolved = resolve.schema(candidate)
      if (resolved) {
        seen.delete(targetValue)
        return cache(
          _schema,
          getExampleFromSchema(resolved, options, {
            level: level + 1,
            schemaPath,
            seen,
            dynamicScope: childScope,
          }),
          cacheKey,
          skipCache,
        )
      }
    }
    seen.delete(targetValue)
    return cache(_schema, null, cacheKey, skipCache)
  }

  // Handle allOf at root level (non-object/array schemas)
  if (Array.isArray(_schema.allOf) && _schema.allOf.length > 0) {
    let merged: unknown = undefined
    const items = _schema.allOf
    for (const item of items) {
      const ex = getExampleFromSchema(item as SchemaObject, options, {
        level: level + 1,
        parentSchema: _schema,
        schemaPath,
        seen,
        dynamicScope: childScope,
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
    return cache(_schema, merged ?? null, cacheKey, skipCache)
  }

  // Handle union types (array of types)
  const unionPrimitive = getUnionPrimitiveValue(_schema, makeUpRandomData, options?.emptyString)
  if (unionPrimitive !== undefined) {
    seen.delete(targetValue)
    return cache(_schema, unionPrimitive, cacheKey, skipCache)
  }

  // Default fallback
  seen.delete(targetValue)
  return cache(_schema, null, cacheKey, skipCache)
}
