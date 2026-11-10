import { isDefined } from '@scalar/helpers/array/is-defined'
import { isJsonMediaType } from '@scalar/helpers/http/is-json-media-type'
import { escapeJsonPointer } from '@scalar/helpers/json/escape-json-pointer'
import { unescapeJsonPointer } from '@scalar/helpers/json/unescape-json-pointer'
import { isObject } from '@scalar/helpers/object/is-object'

import { type DynamicScope, isDynamicRef, pushDynamicScope, resolveDynamicRef } from '@/helpers/dynamic-ref'
import { isFileSchema } from '@/helpers/is-file-schema'
import { resolveFormSchema } from '@/helpers/resolve-form-schema'
import { unpackProxyObject } from '@/helpers/unpack-proxy'
import { resolve } from '@/resolve'
import type { SchemaObject } from '@/schemas/v3.2/strict/openapi-document'

import { EXAMPLE_EVALUATION, type ExampleEvaluation, type ExampleEvaluationState } from './example-evaluation'

/** Maximum recursion depth to prevent infinite loops in circular references */
const MAX_LEVELS_DEEP = 10

/** Default name used for additional properties when no custom name is provided */
const DEFAULT_ADDITIONAL_PROPERTIES_NAME = 'additionalProperty'

/**
 * Mapping of OpenAPI string formats to example values.
 * Used to generate realistic examples for different string formats.
 */
const genericExampleValues: Record<string, string> = {
  'duration': 'P1D',
  'email': 'hello@example.com',
  'hostname': 'example.com',
  // https://tools.ietf.org/html/rfc6531#section-3.3
  'idn-email': 'jane.doe@example.com',
  // https://tools.ietf.org/html/rfc5890#section-2.3.2.3
  'idn-hostname': 'example.com',
  'ipv4': '192.0.2.1',
  'ipv6': '2001:db8::1',
  'iri-reference': '/entity/1',
  // https://tools.ietf.org/html/rfc3987
  'iri': 'https://example.com/entity/123',
  'json-pointer': '/nested/objects',
  'password': 'super-secret',
  'regex': '[a-z]',
  // https://tools.ietf.org/html/draft-handrews-relative-json-pointer-01
  'relative-json-pointer': '1/nested/objects',
  // either a URI or relative-reference https://tools.ietf.org/html/rfc3986#section-4.1
  'uri-reference': '../folder',
  'uri-template': 'https://example.com/{id}',
  'uri': 'https://example.com',
  'uuid': '123e4567-e89b-12d3-a456-426614174000',
  // Keep the version and variant bits consistent with each requested UUID format.
  'uuid1': 'c232ab00-9414-11ec-b3c8-9f6bdeced846',
  'uuid2': '000003e8-9414-21ec-b300-9f6bdeced846',
  'uuid3': '5df41881-3aed-3515-88a7-2f4a814cf09e',
  'uuid4': '919108f7-52d1-4320-9bac-f847db4148a8',
  'uuid5': '2ed6657d-e927-568b-95e1-2665a8aea6a2',
  'uuid6': '1ec9414c-232a-6b00-b3c8-9f6bdeced846',
  'uuid7': '017f22e2-79b0-7cc3-98c4-dc0c0c07398f',
  'uuid8': '2489e9ad-2ee2-8e00-8ec9-32d5f69181c0',
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
 * Binary examples use filename placeholders unless the caller requests File objects.
 */
const guessFromFormat = (
  schema: SchemaObject,
  makeUpRandomData: boolean = false,
  fallback: string = '',
): string | File => {
  // Binary filename placeholders are converted to File objects only for multipart callers.
  if (isFileSchema(schema, false)) {
    return '@filename'
  }

  if ('format' in schema && ['date', 'date-time', 'time'].includes(schema.format ?? '')) {
    // Do not persist enclosing objects or arrays with generated clock-dependent values.
    generatedCurrentTime = true
    const iso = new Date().toISOString()
    if (schema.format === 'date') {
      return iso.split('T')[0]!
    }
    if (schema.format === 'time') {
      return iso.split('T')[1]!
    }
    return iso
  }

  if ('format' in schema && schema.format && Object.hasOwn(genericExampleValues, schema.format)) {
    // Password and object-id retain their opt-in placeholders; other known formats need valid syntax.
    if (schema.format === 'password' || schema.format === 'object-id') {
      return makeUpRandomData ? genericExampleValues[schema.format]! : fallback
    }

    return genericExampleValues[schema.format]!
  }

  return fallback
}

/**
 * WeakMap cache for memoizing resolved example results.
 * Uses the resolved schema object as the key for efficient lookups.
 */
const resultCache = new WeakMap<object, Map<string, unknown>>()

/**
 * Set once the depth cap has truncated something in the current top-level call.
 *
 * A truncated value only holds at the level it was produced at, but `resultCache` keys carry no level,
 * so a value assembled around one must not be stored. Composition reaches that case: an `allOf` member
 * climbs a level without growing `schemaPath`, so a schema rendered just above the cap in one chain
 * shares its key with the same schema used at the top of a document, and the shallow use is served the
 * truncated result. Widening the key would cost the cache its hits everywhere, so storing simply stops
 * for the rest of the call instead. The walk is synchronous, so resetting at level 0 scopes this to one
 * top-level call.
 */
let truncated = false

/** Prevent cached containers from retaining generated dates and times across calls. */
let generatedCurrentTime = false

/** Cache required property names per parent schema for O(1) membership checks */
const requiredNamesCache = new WeakMap<object, ReadonlySet<string>>()

/** Normalize schema identity for cache and cycle tracking */
const getSchemaCacheTarget = (schema: SchemaObject): object => unpackProxyObject(schema, { depth: 1 })

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
  if (skip || truncated || generatedCurrentTime || typeof result !== 'object' || result === null) {
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
  isRequiredProperty = false,
): boolean => {
  // Early exits for schemas that should not be included (readOnly, writeOnly)
  if ((options?.mode === 'write' && schema.readOnly) || (options?.mode === 'read' && schema.writeOnly)) {
    return true
  }

  if (isRequiredProperty || options?.omitEmptyAndOptionalProperties !== true) {
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
  // A null/undefined contribution (e.g. a constraint-only allOf member such as
  // `not` or `if/then/else`, which produce no example) must not wipe what we have.
  if (newValue === undefined || newValue === null) {
    return baseValue
  }
  if (baseValue === undefined || baseValue === null) {
    return newValue
  }
  if (Array.isArray(baseValue) && Array.isArray(newValue)) {
    return [...baseValue, ...newValue]
  }
  // Files are scalar payloads; spreading them would erase their filename and bytes.
  if (baseValue instanceof File || newValue instanceof File) {
    return newValue
  }
  if (baseValue && typeof baseValue === 'object' && newValue && typeof newValue === 'object') {
    return { ...baseValue, ...newValue }
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

/** A choice applies once at its path; a union inside the chosen branch makes its own choice. */
const consumeCompositionSelection = (
  options: GetExampleFromSchemaOptions | undefined,
  schemaPath: string[],
  composition: CompositionKeyword,
): GetExampleFromSchemaOptions | undefined => {
  const key = getCompositionSelectionKey(schemaPath, composition)
  if (options?.compositionSelection?.[key] === undefined) {
    return options
  }
  const { [key]: _selection, ...compositionSelection } = options.compositionSelection
  return { ...options, compositionSelection }
}

/** Select a composition branch once for both generated values and supplied example metadata. */
export const selectExampleComposition = (
  schema: SchemaObject,
  schemaPath: string[],
  options?: GetExampleFromSchemaOptions,
  arrayItem = false,
  value?: Record<string, unknown>,
): SchemaObject | undefined => {
  const anyOfKeyword = schema.anyOf ? 'anyOf' : undefined
  const keyword = schema.oneOf ? 'oneOf' : anyOfKeyword
  const members = keyword ? schema[keyword] : undefined
  if (!keyword || !members?.length) {
    return undefined
  }
  const index =
    getCompositionSelectionIndex(schemaPath, keyword, options, members.length) ??
    getDiscriminatorSelectionIndex(schema, members, options, value)
  const isObject = 'properties' in schema || ('type' in schema && schema.type === 'object')
  const candidate =
    index !== undefined || isObject || arrayItem
      ? members[index ?? 0]
      : members.find((item) => {
          const resolved = resolve.schema(item)
          return resolved && (!('type' in resolved) || resolved.type !== 'null')
        })
  // The generator resolves the value at its entry point; serializers also need the reference site.
  return candidate as SchemaObject | undefined
}

/**
 * Use the discriminator as a generation hint. Only referenced variants have
 * implicit names; inline titles are display labels, not discriminator mappings.
 */
const getDiscriminatorSelectionIndex = (
  schema: SchemaObject,
  variants: NonNullable<SchemaObject['oneOf']>,
  options: GetExampleFromSchemaOptions | undefined,
  value?: Record<string, unknown>,
): number | undefined => {
  const discriminator = schema.discriminator
  if (discriminator?.defaultMapping === undefined) {
    return undefined
  }

  const property = 'properties' in schema ? schema.properties?.[discriminator.propertyName] : undefined
  const resolvedProperty = property ? resolve.schema(property) : undefined
  const propertyName =
    options?.xml && resolvedProperty && 'xml' in resolvedProperty
      ? (resolvedProperty.xml?.name ?? discriminator.propertyName)
      : discriminator.propertyName
  const variableValue = resolvedProperty?.['x-variable']
    ? options?.variables?.[resolvedProperty['x-variable']]
    : undefined
  const declaredValue = resolvedProperty ? getDeclaredValue(resolvedProperty) : undefined
  const schemaValue = variableValue !== undefined ? variableValue : declaredValue
  const tag = value ? value[propertyName] : schemaValue
  const findReference = (reference: string): number =>
    variants.findIndex((variant) => '$ref' in variant && variant.$ref === reference)
  const findComponent = (name: string): number => findReference(`#/components/schemas/${escapeJsonPointer(name)}`)
  const findTarget = (target: string): number => {
    // Prefer a component name when the same string could also be a relative URI.
    const componentIndex = findComponent(target)
    return componentIndex >= 0 ? componentIndex : findReference(target)
  }

  if (typeof tag === 'string') {
    const explicit =
      discriminator.mapping && Object.hasOwn(discriminator.mapping, tag) ? discriminator.mapping[tag] : undefined
    const mappedIndex = explicit === undefined ? findComponent(tag) : findTarget(explicit)
    // A broken explicit mapping must not silently select the fallback.
    if (explicit !== undefined || mappedIndex >= 0) {
      return mappedIndex >= 0 ? mappedIndex : undefined
    }
  }

  const fallbackIndex = findTarget(discriminator.defaultMapping)
  return fallbackIndex >= 0 ? fallbackIndex : undefined
}

const COMPONENT_SCHEMA_PREFIX = '#/components/schemas/'

/**
 * Find the discriminator value that selects `variant`: the explicit mapping key that targets it,
 * or the component name, which is the implicit mapping.
 */
const getDiscriminatorTag = (
  discriminator: NonNullable<SchemaObject['discriminator']>,
  variant: NonNullable<SchemaObject['oneOf']>[number],
): string | undefined => {
  if (!('$ref' in variant) || typeof variant.$ref !== 'string') {
    return undefined
  }
  const reference = variant.$ref
  const componentName = reference.startsWith(COMPONENT_SCHEMA_PREFIX)
    ? unescapeJsonPointer(reference.slice(COMPONENT_SCHEMA_PREFIX.length))
    : undefined
  const mapped = Object.entries(discriminator.mapping ?? {}).find(
    ([, target]) => target === reference || target === componentName,
  )
  return mapped?.[0] ?? componentName
}

/** Preserve authored or intentionally omitted values while following the same composition choices as generation. */
const hasPreservedDiscriminatorValue = (
  schema: NonNullable<SchemaObject['oneOf']>[number] | undefined,
  propertyName: string | undefined,
  options: GetExampleFromSchemaOptions | undefined,
  schemaPath: string[],
  seen: Set<object> = new Set(),
  level: number = 0,
): boolean => {
  const resolved = schema && resolve.schema(schema)
  if (!resolved || level > MAX_LEVELS_DEEP) {
    return false
  }
  if (propertyName === undefined && shouldOmitProperty(resolved, undefined, undefined, { mode: options?.mode })) {
    return true
  }
  const target = getSchemaCacheTarget(resolved)
  if (seen.has(target)) {
    return false
  }
  const nextSeen = new Set(seen).add(target)
  const variable = resolved['x-variable']
  const value =
    variable && options?.variables?.[variable] !== undefined ? options.variables[variable] : getDeclaredValue(resolved)
  if (value !== undefined) {
    return (
      propertyName === undefined || (value !== null && typeof value === 'object' && Object.hasOwn(value, propertyName))
    )
  }
  if (propertyName !== undefined && 'properties' in resolved) {
    const property = resolved.properties?.[propertyName]
    const resolvedProperty = property && resolve.schema(property)
    if (resolvedProperty && shouldOmitProperty(resolvedProperty, resolved, propertyName, options)) {
      return true
    }
    if (
      hasPreservedDiscriminatorValue(property, undefined, options, [...schemaPath, propertyName], nextSeen, level + 1)
    ) {
      return true
    }
  }
  const anyOfKeyword = resolved.anyOf ? 'anyOf' : undefined
  const keyword = resolved.oneOf ? 'oneOf' : anyOfKeyword
  if (keyword) {
    const selected = selectExampleComposition(resolved, schemaPath, options)
    return hasPreservedDiscriminatorValue(
      selected,
      propertyName,
      consumeCompositionSelection(options, schemaPath, keyword),
      schemaPath,
      nextSeen,
      level + 1,
    )
  }
  let choiceIndex = 0
  return (
    resolved.allOf?.some((member) => {
      const resolvedMember = resolve.schema(member)
      const isChoice = !!resolvedMember && !!(resolvedMember.oneOf || resolvedMember.anyOf)
      const memberPath = isChoice ? [...schemaPath, String(choiceIndex++)] : schemaPath
      return hasPreservedDiscriminatorValue(member, propertyName, options, memberPath, nextSeen, level + 1)
    }) ?? false
  )
}

/**
 * Write the selected variant's discriminator value into the example. Without it the example
 * carries an empty tag and a server cannot tell which variant it is. Declared values win, and a
 * `defaultMapping` means the property may be omitted, so selection alone decides the variant there.
 */
const withDiscriminatorTag = (
  schema: SchemaObject,
  variant: NonNullable<SchemaObject['oneOf']>[number] | undefined,
  example: unknown,
  options: GetExampleFromSchemaOptions | undefined,
  schemaPath: string[],
): unknown => {
  const discriminator = schema.discriminator
  if (
    !discriminator ||
    discriminator.defaultMapping !== undefined ||
    !variant ||
    options?.xml ||
    !example ||
    typeof example !== 'object' ||
    Array.isArray(example)
  ) {
    return example
  }
  if (hasPreservedDiscriminatorValue(schema, discriminator.propertyName, options, schemaPath)) {
    return example
  }
  const tag = getDiscriminatorTag(discriminator, variant)
  return tag === undefined ? example : { ...example, [discriminator.propertyName]: tag }
}

/**
 * Read the numeric `x-order` extension value from a raw property entry, if present.
 * The entry may be a schema or a `$ref` object, so we check membership before reading.
 */
const getXOrder = (property: unknown): number | undefined => {
  if (property && typeof property === 'object' && 'x-order' in property) {
    const order = Number(property['x-order'])
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
  requiredScope: ReadonlySet<string> | undefined,
): unknown => {
  const response: Record<string, unknown> = {}
  // Children are evaluated with this schema added to the dynamic scope so nested `$dynamicRef`s bind here.
  const childScope = pushDynamicScope(dynamicScope, schema)
  const skipCache = dynamicScope.length > 0 || !!options?.[EXAMPLE_EVALUATION]
  // Carry requirements through composition wrappers before they cross the cap. Property children
  // start their own scope, since their required names belong to a different object.
  const memberRequiredScope =
    requiredScope ??
    (isComposed(schema)
      ? getCompositionRequiredNames(schema, options, schemaPath, level, seen, dynamicScope)
      : undefined)
  // Past the cap only the properties the object requires are rendered: optional ones are what the cap
  // exists to stop descending into. Composition members share the names of the object they belong to.
  const required =
    level > MAX_LEVELS_DEEP
      ? (memberRequiredScope ?? getCompositionRequiredNames(schema, options, schemaPath, level, seen, dynamicScope))
      : undefined

  if ('properties' in schema && schema.properties) {
    const properties = schema.properties
    const propertyNames = sortPropertyNamesByXOrder(properties)
    const limit = propertyNames.length

    for (let i = 0; i < limit; i++) {
      const propertyName = propertyNames[i]!
      const propertySchema = resolve.schema(properties[propertyName])
      if (!propertySchema || (required && !required.has(propertyName))) {
        continue
      }

      const propertyXmlName = options?.xml && 'xml' in propertySchema ? propertySchema.xml?.name : undefined
      const discriminatorExample =
        schema.discriminator?.defaultMapping !== undefined && schema.discriminator.propertyName === propertyName
          ? evaluateDiscriminator(schema, options, {
              level,
              schemaPath,
              seen,
              dynamicScope,
              isRequiredProperty: !!required,
            })
          : undefined
      if (discriminatorExample?.evaluation) {
        options?.[EXAMPLE_EVALUATION]?.stack.at(-1)?.children.push(discriminatorExample.evaluation)
      }
      const value = discriminatorExample
        ? discriminatorExample.value
        : getExampleFromSchema(propertySchema, options, {
            level: level + 1,
            parentSchema: schema,
            name: propertyName,
            isRequiredProperty: !!required,
            schemaPath: [...schemaPath, propertyName],
            seen,
            dynamicScope: childScope,
          })

      if (typeof value !== 'undefined') {
        response[propertyXmlName ?? propertyName] = value
      }
    }
  }

  if (!required && 'patternProperties' in schema && schema.patternProperties) {
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

  if (!required && 'additionalProperties' in schema && schema.additionalProperties) {
    const additional =
      typeof schema.additionalProperties === 'boolean'
        ? schema.additionalProperties
        : resolve.schema(schema.additionalProperties)
    const isAnyType =
      schema.additionalProperties === true ||
      (typeof schema.additionalProperties === 'object' && Object.keys(schema.additionalProperties).length === 0)

    // Check for explicit x-additionalPropertiesName first
    const customName =
      typeof additional === 'object' && 'x-additionalPropertiesName' in additional
        ? additional['x-additionalPropertiesName']
        : undefined
    const hasCustomName = typeof customName === 'string' && customName.trim().length > 0

    // Use propertyNames enum values as example keys when no custom name is set
    const propertyNamesEnum = hasCustomName ? undefined : getPropertyNamesEnumValues(schema)

    const additionalName = hasCustomName ? customName.trim() : DEFAULT_ADDITIONAL_PROPERTIES_NAME

    const additionalValue =
      !isAnyType && typeof additional === 'object'
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

  const anyOfKeyword = schema.anyOf ? 'anyOf' : undefined

  const compositionKeyword = schema.oneOf ? 'oneOf' : anyOfKeyword
  const oneOfAnyOf = compositionKeyword ? schema[compositionKeyword] : undefined
  if (compositionKeyword && oneOfAnyOf?.length) {
    const chosen = selectExampleComposition(schema, schemaPath, options, false, response)
    if (chosen) {
      Object.assign(
        response,
        getExampleFromSchema(chosen, consumeCompositionSelection(options, schemaPath, compositionKeyword), {
          level: level + 1,
          schemaPath,
          seen,
          dynamicScope: childScope,
          requiredScope: memberRequiredScope,
        }),
      )
      Object.assign(response, withDiscriminatorTag(schema, chosen, response, options, schemaPath))
    }
  }
  // allOf — thread a choice-ordinal into schemaPath for each direct oneOf/anyOf
  // member so multiple mutually-exclusive groups get distinct composition-selection
  // keys that match the per-group pickers. Object members keep the parent path so
  // their property-nested compositions still resolve by property name.
  else if (Array.isArray(schema.allOf) && schema.allOf.length > 0) {
    let merged: unknown = response
    let choiceIndex = 0
    for (const item of schema.allOf) {
      const resolvedItem = resolve.schema(item)
      const isChoiceMember = !!resolvedItem && (Array.isArray(resolvedItem.oneOf) || Array.isArray(resolvedItem.anyOf))
      const memberSchemaPath = isChoiceMember ? [...schemaPath, String(choiceIndex++)] : schemaPath
      const ex = getExampleFromSchema(resolvedItem, options, {
        level: level + 1,
        parentSchema: schema,
        seen,
        dynamicScope: childScope,
        schemaPath: memberSchemaPath,
        requiredScope: memberRequiredScope,
      })
      merged = mergeExamples(merged, ex)
    }
    if (merged && typeof merged === 'object') {
      Object.assign(response, merged)
    }
  }

  if (options?.xml && 'xml' in schema && schema.xml?.name && level === 0) {
    const wrapped: Record<string, unknown> = {}
    wrapped[schema.xml.name] = response
    return cache(schema, wrapped, cacheKey, skipCache)
  }

  return cache(schema, response, cacheKey, skipCache)
}

/** Bound the serialized expansion from padding nested arrays, including repeated references. */
const MAX_ARRAY_PADDING_NODES = 1_000

const countExampleNodes = (value: unknown, limit: number): number => {
  if (limit <= 1 || value === null || typeof value !== 'object') {
    return 1
  }

  let count = 1
  for (const child of Array.isArray(value) ? value : Object.values(value)) {
    count += countExampleNodes(child, limit - count)
    if (count >= limit) {
      break
    }
  }
  return count
}

/** Ignore malformed bounds from unvalidated descriptions. */
const readArrayLengthBound = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : fallback

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
  const skipCache = dynamicScope.length > 0 || !!options?.[EXAMPLE_EVALUATION]

  const maxItems = readArrayLengthBound('maxItems' in schema ? schema.maxItems : undefined, Number.POSITIVE_INFINITY)
  const minItems = Math.min(
    readArrayLengthBound('minItems' in schema ? schema.minItems : undefined, 0),
    maxItems,
    MAX_ARRAY_PADDING_NODES,
  )

  if (maxItems === 0) {
    return cache(schema, [], cacheKey, skipCache)
  }

  const prefixes = 'prefixItems' in schema && Array.isArray(schema.prefixItems) ? schema.prefixItems : undefined
  const values =
    prefixes?.slice(0, maxItems).map((item, index) =>
      getExampleFromSchema(item as SchemaObject, options, {
        level: level + 1,
        schemaPath: [...schemaPath, 'prefixItems', String(index)],
        seen,
        dynamicScope: childScope,
      }),
    ) ?? []

  if (prefixes && values.length >= minItems) {
    return cache(schema, values, cacheKey, skipCache)
  }

  const itemSchema = 'items' in schema ? (schema.items as typeof schema.items | boolean) : undefined
  if (itemSchema === false) {
    return cache(schema, values, cacheKey, skipCache)
  }

  let items = resolve.schema(itemSchema)
  // Bind a dynamic item type (e.g. the generic `PaginatedResponse<T>` pattern) before inspecting it.
  // Crossing a `$dynamicRef` leaves the static schema graph, so the cycle guard built up by the outer
  // walk no longer applies to the bound type. Restart `seen` for the item recursion so recursive trees
  // (e.g. a category whose children reference the same anchor) render their nested levels instead of
  // tripping the shared guard. Depth stays bounded by `MAX_LEVELS_DEEP`.
  let itemsSeen = seen
  if (items && isDynamicRef(items)) {
    const resolvedDynamic = resolveDynamicRef(items.$dynamicRef, childScope)
    if (resolvedDynamic) {
      items = resolvedDynamic
      itemsSeen = new WeakSet()
    }
  }
  const itemsSchemaPath = [...schemaPath, 'items']
  const itemsXmlTagName = items && typeof items === 'object' && 'xml' in items ? items.xml?.name : undefined
  const wrapItems = !!(options?.xml && 'xml' in schema && schema.xml?.wrapped && itemsXmlTagName)

  if (schema.example !== undefined) {
    return cache(schema, wrapItems ? { [itemsXmlTagName]: schema.example } : schema.example, cacheKey, skipCache)
  }

  const completeArrayExample = (examples: unknown[], sample: unknown = examples[0]): unknown => {
    for (const example of examples) {
      if (values.length >= maxItems || (prefixes && values.length >= minItems)) {
        break
      }
      values.push(wrapItems ? { [itemsXmlTagName]: example } : example)
    }

    // Repeating the same value cannot satisfy uniqueItems.
    if (sample !== undefined && values.length < minItems && !('uniqueItems' in schema && schema.uniqueItems)) {
      const value = wrapItems ? { [itemsXmlTagName]: sample } : sample
      const remaining = MAX_ARRAY_PADDING_NODES - countExampleNodes(values, MAX_ARRAY_PADDING_NODES)
      const size = countExampleNodes(value, MAX_ARRAY_PADDING_NODES)
      const copies = Math.min(minItems - values.length, Math.floor(remaining / size))
      for (let index = 0; index < copies; index++) {
        values.push(value)
      }
    }

    return cache(schema, values, cacheKey, skipCache)
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
          seen: itemsSeen,
          dynamicScope: childScope,
        })
        return completeArrayExample(isDefined(merged) ? [merged] : [])
      }

      const examples = allOf
        .map((s) =>
          getExampleFromSchema(resolve.schema(s), options, {
            level: level + 1,
            parentSchema: schema,
            schemaPath: itemsSchemaPath,
            seen: itemsSeen,
            dynamicScope: childScope,
          }),
        )
        .filter(isDefined)
      // Let generation resolve references, declarations and union selections before deciding whether
      // the members describe one object. A primitive contribution keeps the existing per-member result.
      const result =
        examples.length > 0 && examples.every(isObject) ? [examples.reduce<unknown>(mergeExamples, {})] : examples
      return completeArrayExample(result)
    }

    const anyOfKeyword = items.anyOf ? 'anyOf' : undefined

    const compositionKeyword = items.oneOf ? 'oneOf' : anyOfKeyword
    const union = compositionKeyword ? items[compositionKeyword] : undefined
    if (compositionKeyword && union && union.length > 0) {
      const selectedIndex =
        getCompositionSelectionIndex(itemsSchemaPath, compositionKeyword, options, union.length) ??
        getDiscriminatorSelectionIndex(items, union, options) ??
        0
      const selected = union[selectedIndex]!
      const ex = getExampleFromSchema(
        resolve.schema(selected),
        consumeCompositionSelection(options, itemsSchemaPath, compositionKeyword),
        {
          level: level + 1,
          parentSchema: schema,
          schemaPath: itemsSchemaPath,
          seen: itemsSeen,
          dynamicScope: childScope,
        },
      )
      if (ex === undefined) {
        return undefined
      }
      const tagged = withDiscriminatorTag(items, selected, ex, options, itemsSchemaPath)
      return completeArrayExample([tagged])
    }
  }

  const isObjectItems =
    items && typeof items === 'object' && (('type' in items && items.type === 'object') || 'properties' in items)
  const isArray =
    items && typeof items === 'object' && (('type' in items && items.type === 'array') || 'items' in items)

  const hasDeclaredItem = values.length < minItems && items && getDeclaredValue(items) !== undefined
  if (items && (('type' in items && items.type) || isObjectItems || isArray || hasDeclaredItem)) {
    const ex = getExampleFromSchema(items, options, {
      level: level + 1,
      schemaPath: itemsSchemaPath,
      seen: itemsSeen,
      dynamicScope: childScope,
    })
    // Propagate an omitted recursive item so optional arrays do not serialize it as null.
    if (ex === undefined) {
      return undefined
    }
    return completeArrayExample([ex])
  }

  const unrestricted = itemSchema === undefined || itemSchema === true || Object.keys(itemSchema).length === 0
  return completeArrayExample([], unrestricted ? null : undefined)
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

/** Options shared by data generation and schema-aware serializers. */
export type GetExampleFromSchemaOptions = {
  /** Internal provenance capture, excluded from persistent result caches. */
  [EXAMPLE_EVALUATION]?: ExampleEvaluationState
  /** Preserve binary filename examples as File objects for multipart serializers. */
  binaryAsFile?: boolean
  /** Fallback string for empty string values. */
  emptyString?: string
  /** @deprecated Use getXmlExampleFromSchema for schema-aware XML serialization. */
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
    binaryAsFile: options?.binaryAsFile,
    emptyString: options?.emptyString,
    xml: options?.xml,
    mode: options?.mode,
    variables: options?.variables,
    omitEmptyAndOptionalProperties: options?.omitEmptyAndOptionalProperties,
    compositionSelection: options?.compositionSelection
      ? Object.entries(options.compositionSelection).sort(([a], [b]) => a.localeCompare(b))
      : undefined,
  })

/** Sentinel for "nothing memoized yet", since `undefined` is itself a valid options value. */
const NO_OPTIONS = Symbol('NO_OPTIONS')

/** The options object `lastOptionsKey` was built from. */
let lastOptions: GetExampleFromSchemaOptions | undefined | typeof NO_OPTIONS = NO_OPTIONS
let lastOptionsKey = ''

/**
 * The options half of the result-cache key, built once per top-level call instead of once per node.
 *
 * `createOptionsCacheKey` serializes the whole options object, and every schema the walk enters needs
 * the same string. The walk is synchronous and passes the same `options` object down, so rebuilding at
 * level 0, or whenever the identity changes, is enough: a caller that mutates its options object in
 * place still gets a fresh key on its next top-level call, exactly as before.
 */
const getOptionsCacheKey = (options: GetExampleFromSchemaOptions | undefined, level: number): string => {
  if (level === 0 || options !== lastOptions) {
    lastOptionsKey = createOptionsCacheKey(options)
    lastOptions = options
  }

  return lastOptionsKey
}

/** Stand-in for a truncated schema whose shape cannot be read off the document. */
const MAX_DEPTH_EXCEEDED = '[Max Depth Exceeded]'

/** How long a chain of composition wrappers may be unwrapped before the stack becomes the concern. */
const MAX_COMPOSITION_DEPTH = MAX_LEVELS_DEEP * 5

/**
 * How deep the walk keeps going past `MAX_LEVELS_DEEP` to fill the properties a truncated object requires.
 *
 * Past the cap the walk still renders objects, but only their required properties, so a strict decoder
 * reading the example finds every key it insists on. This level bounds that, well below the XML
 * serializer's depth limit of 50 (which discards the whole body when crossed), and past it objects
 * stand in empty again.
 */
const MAX_REQUIRED_LEVELS_DEEP = MAX_LEVELS_DEEP * 2

/**
 * How many schemas the walk may enter past `MAX_LEVELS_DEEP` in one top-level call.
 *
 * Cycle guards stop a schema that requires itself, but not a chain of distinct schemas that each point
 * at the next one twice, through two required properties or an `allOf` that lists the same member
 * twice: the work doubles with every link. Once the budget is spent, objects stand in empty.
 */
const MAX_REQUIRED_STEPS = 10_000

/** Schemas the walk may still enter past `MAX_LEVELS_DEEP` in the current top-level call. */
let requiredSteps = MAX_REQUIRED_STEPS

/** Cache requirements within one walk; generated discriminator values may select a new branch next time. */
let compositionRequiredNamesCache = new WeakMap<object, Map<string, ReadonlySet<string>>>()

/** The value and optional XML provenance of a discriminator evaluated during requirement collection. */
type DiscriminatorExample = { value: unknown; evaluation?: ExampleEvaluation }

/** Values are reused only within one call; generated dates and traversal contexts must not leak across calls. */
let discriminatorExamples = new WeakMap<object, Map<string, DiscriminatorExample>>()

/** Evaluate the discriminator through the same path as any other property, before choosing its branch. */
const evaluateDiscriminator = (
  schema: SchemaObject,
  options: GetExampleFromSchemaOptions | undefined,
  context: {
    level: number
    schemaPath: string[]
    seen: WeakSet<object>
    dynamicScope: DynamicScope
    isRequiredProperty: boolean
  },
): DiscriminatorExample => {
  const { level, schemaPath, seen, dynamicScope, isRequiredProperty } = context
  const name = schema.discriminator?.propertyName
  const property = name !== undefined && 'properties' in schema ? resolve.schema(schema.properties?.[name]) : undefined
  if (name === undefined || !property) {
    return { value: undefined }
  }
  const target = getSchemaCacheTarget(schema)
  const key = JSON.stringify([schemaPath, createOptionsCacheKey(options), level, isRequiredProperty])
  const cached = discriminatorExamples.get(target)?.get(key)
  if (cached && dynamicScope.length === 0) {
    return cached
  }
  const capture: ExampleEvaluationState | undefined = options?.[EXAMPLE_EVALUATION] ? { stack: [] } : undefined
  // A composition member may not yet be on the main walk's path when collecting its requirements.
  const alreadySeen = seen.has(target)
  seen.add(target)
  try {
    const value = getExampleFromSchema(
      property,
      { ...options, [EXAMPLE_EVALUATION]: capture },
      {
        level: level + 1,
        parentSchema: schema,
        name,
        schemaPath: [...schemaPath, name],
        seen,
        dynamicScope: pushDynamicScope(dynamicScope, schema),
        isRequiredProperty,
      },
    )
    const example: DiscriminatorExample = { value, evaluation: capture?.root }
    if (dynamicScope.length === 0) {
      const entries = discriminatorExamples.get(target) ?? new Map<string, DiscriminatorExample>()
      entries.set(key, example)
      discriminatorExamples.set(target, entries)
    }
    return example
  } finally {
    if (!alreadySeen) {
      seen.delete(target)
    }
  }
}

/**
 * Gather requirements across allOf members and the selected alternatives only. A name required by an
 * unselected alternative may be optional in the chosen one, and emitting it can match both oneOf branches.
 */
const getCompositionRequiredNames = (
  schema: SchemaObject,
  options: GetExampleFromSchemaOptions | undefined,
  schemaPath: string[],
  level: number,
  seen: WeakSet<object>,
  dynamicScope: DynamicScope,
): ReadonlySet<string> => {
  const root = getSchemaCacheTarget(schema)
  const cacheKey = JSON.stringify([schemaPath, createOptionsCacheKey(options), level])
  const cached = compositionRequiredNamesCache.get(root)?.get(cacheKey)
  if (cached && dynamicScope.length === 0) {
    return cached
  }

  const names = new Set<string>()
  const visited = new Map<object, Set<string>>()
  const scopeResourceIds = new Map<object, number>()
  const pending = [{ schema, options, schemaPath, dynamicScope, depth: 0 }]
  // A cycle can change its selection path, so identity and path caching alone cannot bound this walk.
  let steps = MAX_REQUIRED_STEPS
  while (pending.length > 0 && steps-- > 0) {
    const current = pending.pop()!
    const target = getSchemaCacheTarget(current.schema)
    // A shared template can require different fields under each binding. Include the ordered scope
    // identities so visiting it in one branch does not suppress another branch's requirements.
    const scopeKey = current.dynamicScope.map((resource): number => {
      const identity = getSchemaCacheTarget(resource)
      const existing = scopeResourceIds.get(identity)
      if (existing !== undefined) {
        return existing
      }
      const id = scopeResourceIds.size
      scopeResourceIds.set(identity, id)
      return id
    })
    const key = JSON.stringify([current.schemaPath, createOptionsCacheKey(current.options), current.depth, scopeKey])
    const contexts = visited.get(target) ?? new Set<string>()
    if (contexts.has(key) || current.depth > MAX_COMPOSITION_DEPTH) {
      continue
    }
    contexts.add(key)
    visited.set(target, contexts)

    // Requirements behind a dynamic reference constrain the same instance as its composition siblings.
    // Follow the same binding as the example walk, within this collector's existing depth and step bounds.
    if (isDynamicRef(current.schema)) {
      const resolved = resolveDynamicRef(current.schema.$dynamicRef, current.dynamicScope)
      if (resolved) {
        pending.push({ ...current, schema: resolved, depth: current.depth + 1 })
        continue
      }
    }

    // An omitted member cannot make a sibling's otherwise optional fields required for this example.
    if (shouldOmitProperty(current.schema, undefined, undefined, { mode: current.options?.mode })) {
      continue
    }

    if ('required' in current.schema && Array.isArray(current.schema.required)) {
      for (const name of current.schema.required) {
        names.add(name)
      }
    }

    const keyword = current.schema.oneOf ? 'oneOf' : current.schema.anyOf ? 'anyOf' : undefined
    if (keyword) {
      const discriminator = current.schema.discriminator
      const requiredOnly = level + current.depth > MAX_LEVELS_DEEP
      const omittedDiscriminator =
        requiredOnly &&
        discriminator?.defaultMapping !== undefined &&
        // The negative level gathers shared requirements without evaluating discriminator values.
        !getCompositionRequiredNames(schema, options, schemaPath, -MAX_COMPOSITION_DEPTH, seen, dynamicScope).has(
          discriminator.propertyName,
        )
      // Evaluate once using the ordinary property walk. Rendering reuses both the value and its XML
      // provenance, so mode omissions, generated strings and composed tags cannot change branches.
      const evaluated =
        level >= 0 && discriminator?.defaultMapping !== undefined && !omittedDiscriminator
          ? evaluateDiscriminator(current.schema, current.options, {
              level: level + current.depth,
              schemaPath: current.schemaPath,
              seen,
              dynamicScope: current.dynamicScope,
              isRequiredProperty: requiredOnly,
            })
          : undefined
      const property =
        discriminator && 'properties' in current.schema
          ? resolve.schema(current.schema.properties?.[discriminator.propertyName])
          : undefined
      const propertyName =
        current.options?.xml && property && 'xml' in property
          ? (property.xml?.name ?? discriminator?.propertyName)
          : discriminator?.propertyName
      const discriminatorValue =
        evaluated && propertyName !== undefined ? { [propertyName]: evaluated.value } : undefined
      const selected = selectExampleComposition(
        current.schema,
        current.schemaPath,
        current.options,
        false,
        omittedDiscriminator ? {} : discriminatorValue,
      )
      const resolved = selected ? resolve.schema(selected) : undefined
      if (resolved) {
        pending.push({
          schema: resolved,
          options: consumeCompositionSelection(current.options, current.schemaPath, keyword),
          schemaPath: current.schemaPath,
          dynamicScope: pushDynamicScope(current.dynamicScope, current.schema),
          depth: current.depth + 1,
        })
      }
      continue
    }

    let choiceIndex = 0
    for (const member of current.schema.allOf ?? []) {
      const resolved = resolve.schema(member)
      if (resolved) {
        const isChoiceMember = Array.isArray(resolved.oneOf) || Array.isArray(resolved.anyOf)
        pending.push({
          schema: resolved,
          options: current.options,
          schemaPath: isChoiceMember ? [...current.schemaPath, String(choiceIndex++)] : current.schemaPath,
          dynamicScope: pushDynamicScope(current.dynamicScope, current.schema),
          depth: current.depth + 1,
        })
      }
    }
  }

  if (dynamicScope.length === 0) {
    const contexts = compositionRequiredNamesCache.get(root) ?? new Map<string, ReadonlySet<string>>()
    contexts.set(cacheKey, names)
    compositionRequiredNamesCache.set(root, contexts)
  }
  return names
}

/**
 * Whether the walk keeps rendering a schema past `MAX_LEVELS_DEEP` to fill its required properties.
 *
 * Only an object or composition with a property marked `required` qualifies, either somewhere in its
 * own compositions or, for a composition member, in the object it belongs to (`requiredScope`):
 * anything else has nothing a decoder insists on, and keeps its usual stand-in. Arrays always stand in
 * empty, because their items are what the cap exists to stop descending into.
 */
const fillsRequiredProperties = (
  schema: SchemaObject,
  requiredScope: ReadonlySet<string> | undefined,
  options: GetExampleFromSchemaOptions | undefined,
  schemaPath: string[],
  level: number,
  seen: WeakSet<object>,
  dynamicScope: DynamicScope,
): boolean =>
  !getDeclaredTypes(schema).includes('array') &&
  !Array.isArray(getEmptyContainer(schema)) &&
  ('properties' in schema || ('type' in schema && schema.type === 'object') || isComposed(schema)) &&
  (requiredScope ?? getCompositionRequiredNames(schema, options, schemaPath, level, seen, dynamicScope)).size > 0

/** Read a schema's declared types as a list, so `type: 'object'` and `type: ['object']` behave alike. */
const getDeclaredTypes = (schema: SchemaObject): readonly SchemaPrimitiveType[] => {
  if (!('type' in schema) || !schema.type) {
    return []
  }
  return Array.isArray(schema.type) ? schema.type : [schema.type]
}

/** Return the empty container a schema declares, or `undefined` when it declares neither. */
const getEmptyContainer = (schema: SchemaObject): Record<string, never> | never[] | undefined => {
  const types = getDeclaredTypes(schema)

  if ('properties' in schema || types.includes('object')) {
    return {}
  }
  if ('items' in schema || 'prefixItems' in schema || types.includes('array')) {
    return []
  }
  return undefined
}

/** Pick the `oneOf`/`anyOf` variant the walk itself would have rendered, honoring an explicit selection. */
const getSelectedVariant = (
  schema: SchemaObject,
  options: GetExampleFromSchemaOptions | undefined,
  schemaPath: string[],
): SchemaObject | undefined => {
  const anyOfKeyword = schema.anyOf ? 'anyOf' : undefined
  const compositionKeyword = schema.oneOf ? 'oneOf' : anyOfKeyword
  const variants = compositionKeyword ? schema[compositionKeyword] : undefined
  if (!compositionKeyword || !Array.isArray(variants) || variants.length === 0) {
    return undefined
  }

  const index =
    getCompositionSelectionIndex(schemaPath, compositionKeyword, options, variants.length) ??
    getDiscriminatorSelectionIndex(schema, variants, options)
  const candidate =
    index !== undefined
      ? variants[index]
      : variants.find((variant) => {
          const resolved = resolve.schema(variant)
          return resolved && (!('type' in resolved) || resolved.type !== 'null')
        })

  return candidate ? resolve.schema(candidate) : undefined
}

/**
 * Return the value a schema states outright, in the order the walk prefers them.
 *
 * The walk applies this before the cap, so a truncated schema has already had its turn — but a
 * composition member reached from below the cap has not, and answering an `allOf`-wrapped enum with an
 * empty string hands back a value that very schema forbids.
 */
const getDeclaredValue = (schema: SchemaObject): unknown => {
  if (Array.isArray(schema.examples) && schema.examples.length > 0) {
    return schema.examples[0]
  }
  if (schema.example !== undefined) {
    return schema.example
  }
  if (schema.default !== undefined) {
    const normalizedDefault = normalizeSchemaDefault(schema)
    if (normalizedDefault !== INVALID_DEFAULT) {
      return normalizedDefault
    }
  }
  if (schema.const !== undefined) {
    return schema.const
  }
  if (Array.isArray(schema.enum) && schema.enum.length > 0) {
    return schema.enum[0]
  }
  return undefined
}

/**
 * Describe a composed schema by the member the walk itself would have rendered.
 * Returns `undefined` when no member describes a shape.
 */
const describeComposition = (
  schema: SchemaObject,
  options: GetExampleFromSchemaOptions | undefined,
  schemaPath: string[],
  seen: Set<object>,
  emptySchemaValue: string | null,
): unknown => {
  const variant = getSelectedVariant(schema, options, schemaPath)
  if (variant) {
    return getMaxDepthValue(variant, options, schemaPath, seen, emptySchemaValue)
  }

  if (!Array.isArray(schema.allOf) || schema.allOf.length === 0) {
    return undefined
  }

  // `allOf` merges every member, so merge their truncated values the same way. Members that describe
  // nothing contribute nothing rather than clobbering the ones that do.
  let merged: unknown = undefined
  let choiceIndex = 0
  for (const member of schema.allOf) {
    const resolved = resolve.schema(member)
    // Each direct choice member gets its own ordinal in the path, the same way the walk keys them, so
    // an explicit selection on an `allOf`-wrapped `oneOf` still resolves here.
    const isChoiceMember = !!resolved && (Array.isArray(resolved.oneOf) || Array.isArray(resolved.anyOf))
    const memberSchemaPath = isChoiceMember ? [...schemaPath, String(choiceIndex++)] : schemaPath
    const value = resolved ? getMaxDepthValue(resolved, options, memberSchemaPath, seen) : undefined
    if (value !== undefined && value !== MAX_DEPTH_EXCEEDED) {
      merged = mergeExamples(merged, value)
    }
  }

  return merged
}

/**
 * Build the value that stands in for a schema the recursion depth cap cut off.
 *
 * The stand-in is still read as an example of the schema it replaced, so a plain string makes the
 * example contradict its own type: a mock server answering a `type: object` field with
 * `[Max Depth Exceeded]` hands a strict SDK decoder a body it cannot parse. Describe the declared
 * type instead, dispatching in the order the walk does, so a truncated value differs from a full render
 * in having no children. A schema that describes no shape at all keeps the sentinel, which is then the
 * only signal that truncation happened.
 *
 * Two deliberate departures from the walk, both answering with the declared container where the walk
 * answers `null`: a container spelled as a list (`type: ['object']`, or `['object', 'null']`) is read
 * here as the container it names, where the walk's strict comparison misses it.
 *
 * The value is empty rather than complete: satisfying `required` or `minItems` means descending
 * again, which is exactly what the cap exists to prevent.
 */
const getMaxDepthValue = (
  schema: SchemaObject,
  options: GetExampleFromSchemaOptions | undefined,
  schemaPath: string[],
  seen: Set<object> = new Set(),
  emptySchemaValue: string | null = MAX_DEPTH_EXCEEDED,
): unknown => {
  // A stated value beats any stand-in, and matches what a full render would have produced.
  const declared = getDeclaredValue(schema)
  if (declared !== undefined) {
    return declared
  }

  const container = getEmptyContainer(schema)
  if (container !== undefined) {
    // Children were dropped here, so anything assembled around this value is level-bound too.
    truncated = true
    return container
  }

  // A schema with no children renders the same at every level, so nothing is lost and the cache stays
  // usable for the rest of the call.
  const makeUpRandomData = !!options?.emptyString
  const primitive = getPrimitiveValue(schema, makeUpRandomData, options?.emptyString)
  if (primitive !== undefined) {
    return primitive
  }

  // A wrapper such as `allOf: [$ref]` declares no type of its own, so describe its members instead.
  // Unwrapping runs outside the walk's own cycle guard, so it carries one: refusing to re-enter a
  // wrapper already on the path terminates a self-reference without capping how long a legitimate
  // inheritance chain may be. `seen` holds exactly the path, so its size bounds the stack against a
  // pathological chain, the way `schemaAllowsValue` bounds its own recursion.
  const target = getSchemaCacheTarget(schema)
  // The step budget bounds a wrapper whose members repeat one another (`allOf: [next, next]`), which
  // the path guard alone lets double with every link.
  if (!seen.has(target) && seen.size < MAX_COMPOSITION_DEPTH && requiredSteps-- > 0) {
    seen.add(target)
    const composed = describeComposition(schema, options, schemaPath, seen, emptySchemaValue)
    seen.delete(target)

    if (composed !== undefined) {
      return composed
    }
  } else {
    // A description declined is never the value a full render would have produced.
    truncated = true
  }

  const unionPrimitive = getUnionPrimitiveValue(schema, makeUpRandomData, options?.emptyString)
  if (unionPrimitive !== undefined) {
    return unionPrimitive
  }

  // A schema that declares `null` has exactly one valid value, which is what the walk falls back to.
  if (getDeclaredTypes(schema).includes('null')) {
    return null
  }

  // A composition or a negative constraint none of the above could describe still says something about
  // the value, and the walk answers both with `null` rather than a value of no particular type.
  if (isComposed(schema) || 'not' in schema) {
    return null
  }

  truncated = true
  return emptySchemaValue
}

const hasUnencodedJsonContent = (schema: SchemaObject): boolean => {
  if (!('contentSchema' in schema) || !isJsonMediaType(schema.contentMediaType)) return false
  if ('contentEncoding' in schema) return false
  return !('type' in schema) || getDeclaredTypes(schema).includes('string')
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
const generateExampleFromSchema = (
  schema: SchemaObject,
  options?: GetExampleFromSchemaOptions,
  {
    level = 0,
    parentSchema,
    name,
    seen = new WeakSet(),
    schemaPath = [],
    dynamicScope = [],
    requiredScope,
    isRequiredProperty = false,
  }: Partial<{
    level: number
    parentSchema: SchemaObject
    name: string
    seen: WeakSet<object>
    /** Internal traversal path used to resolve nested composition selections. */
    schemaPath: string[]
    /** Chain of schema resources entered so far, used to resolve `$dynamicRef` (JSON Schema 2020-12). */
    dynamicScope: DynamicScope
    /** Past the depth cap, the required names of the object a composition member belongs to. */
    requiredScope: ReadonlySet<string>
    /** Use null for an unconstrained required property without confusing explicit values with the depth marker. */
    isRequiredProperty: boolean
  }> = {},
): unknown => {
  // Cache restrictions only apply to the current traversal, so every top-level call starts clean.
  if (level === 0) {
    truncated = false
    generatedCurrentTime = false
    requiredSteps = MAX_REQUIRED_STEPS
    compositionRequiredNamesCache = new WeakMap()
    discriminatorExamples = new WeakMap()
  }

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
      // The `seen` set guards against cycles in the static schema graph, but a `$dynamicRef` is resolved
      // per evaluation path and intentionally points outside that graph. Re-entering the bound type with a
      // fresh `seen` lets recursive examples (e.g. a category tree) render their nested levels instead of
      // bailing out on the shared cycle guard. Depth stays bounded by `MAX_LEVELS_DEEP`.
      return getExampleFromSchema(resolvedDynamic, options, {
        level: level + 1,
        parentSchema,
        name,
        seen: new WeakSet(),
        schemaPath,
        dynamicScope,
        requiredScope,
        isRequiredProperty,
      })
    }
  }

  // Grow the scope with this schema so nested references can bind to its `$dynamicAnchor`s.
  const childScope = pushDynamicScope(dynamicScope, _schema)
  // The same shared node can resolve differently per scope, so skip the result cache under a scope.
  const skipCache = dynamicScope.length > 0 || !!options?.[EXAMPLE_EVALUATION]

  // Unpack from all proxies to get the raw schema object for cycle detection
  const targetValue = getSchemaCacheTarget(_schema)
  if (seen.has(targetValue)) {
    return undefined
  }
  seen.add(targetValue)

  /** Make the cache key unique per options and schema path */
  const cacheKey = getOptionsCacheKey(options, level) + (schemaPath.length > 0 ? `:path:${schemaPath.join('.')}` : '')

  // Check cache first for performance - avoid recomputing the same schema (skipped under a dynamic scope)
  if (!skipCache) {
    const cached = resultCache.get(targetValue)?.get(cacheKey)
    if (typeof cached !== 'undefined') {
      seen.delete(targetValue)
      return cached
    }
  }

  // Determine if we should generate realistic example data
  const makeUpRandomData = !!options?.emptyString

  // Early exits for schemas that should not be included (readOnly, writeOnly, omitEmptyAndOptionalProperties)
  if (shouldOmitProperty(_schema, parentSchema, name, options, isRequiredProperty)) {
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

  // Stop descending once the walk is too deep to keep going, which also breaks circular references.
  // Everything above still applied, so an explicit example, `const` or `enum` wins here as it would at
  // any other level; only the children are given up on.
  //
  // An object still renders its required properties for a while past the cap, through this same walk, so
  // every rule that applies at a shallower level (read/write omission, composition selection, variables,
  // binary files) applies to them too. Required primitive compositions use the same walk so their
  // members retain those rules as well; arrays and anything past the bounds still stand in.
  if (level > MAX_LEVELS_DEEP) {
    if (
      (!(isRequiredProperty && getEmptyContainer(_schema) === undefined) &&
        !fillsRequiredProperties(_schema, requiredScope, options, schemaPath, level, seen, dynamicScope)) ||
      level > MAX_REQUIRED_LEVELS_DEEP ||
      requiredSteps <= 0
    ) {
      seen.delete(targetValue)

      // Deliberately not cached: the value holds only at this level, and the cache key carries none.
      // Constraint-only composition members must not replace a sibling's required fields with the depth marker.
      const fallback = isRequiredProperty || requiredScope?.size ? null : MAX_DEPTH_EXCEEDED
      return getMaxDepthValue(_schema, options, schemaPath, undefined, fallback)
    }
    requiredSteps--
    // The rendered value omits optional properties, so it holds only at this level and must not be cached.
    truncated = true
  }

  // A composition can start above the cap and cross it in a nested member. Keep the shared
  // requirements available throughout that descent, without filtering properties above the cap.
  const memberRequiredScope =
    requiredScope ??
    (isComposed(_schema)
      ? getCompositionRequiredNames(_schema, options, schemaPath, level, seen, dynamicScope)
      : undefined)

  // Resolve non-object unions before type dispatch so shared root keywords do not
  // hide the selected member. Use the same selection and discriminator rules as other unions.
  const selectedAnyOf = _schema.anyOf ? 'anyOf' : undefined
  const selectedComposition = _schema.oneOf ? 'oneOf' : selectedAnyOf
  const selectedVariant = getSelectedVariant(_schema, options, schemaPath)
  if (selectedComposition && selectedVariant) {
    const rootType = 'type' in _schema ? _schema.type : undefined
    const variantType = 'type' in selectedVariant ? selectedVariant.type : undefined
    const selectedType =
      variantType ??
      rootType ??
      (hasUnencodedJsonContent(_schema)
        ? 'string'
        : 'items' in _schema && !('properties' in _schema)
          ? 'array'
          : undefined)
    if (selectedType !== undefined && selectedType !== 'object') {
      const { oneOf: _oneOf, anyOf: _anyOf, ...base } = _schema
      const selectedSchema = { ...base, ...selectedVariant }
      if (selectedType === 'array') {
        // The selected branch and the surrounding schema both constrain the array.
        if ('minItems' in selectedSchema && 'minItems' in _schema && 'minItems' in selectedVariant) {
          selectedSchema.minItems = Math.max(
            readArrayLengthBound(_schema.minItems, 0),
            readArrayLengthBound(selectedVariant.minItems, 0),
          )
        }
        if ('maxItems' in selectedSchema && 'maxItems' in _schema && 'maxItems' in selectedVariant) {
          selectedSchema.maxItems = Math.min(
            readArrayLengthBound(_schema.maxItems, Number.POSITIVE_INFINITY),
            readArrayLengthBound(selectedVariant.maxItems, Number.POSITIVE_INFINITY),
          )
        }
      }
      // These keywords only constrain their own types, but also drive our type inference.
      if ('properties' in selectedSchema) {
        delete selectedSchema.properties
      }
      if (selectedType !== 'array' && 'items' in selectedSchema) {
        delete selectedSchema.items
      }
      const result = getExampleFromSchema(
        selectedSchema as SchemaObject,
        consumeCompositionSelection(options, schemaPath, selectedComposition),
        {
          level: level + 1,
          parentSchema,
          name,
          schemaPath,
          seen,
          dynamicScope: childScope,
          isRequiredProperty,
        },
      )
      seen.delete(targetValue)
      return cache(_schema, result, cacheKey, skipCache)
    }
  }

  if (hasUnencodedJsonContent(_schema)) {
    const contentSchema = resolve.schema(_schema.contentSchema)
    if (contentSchema) {
      // JSON content preserves strings and property names regardless of the enclosing wire format.
      const content = getExampleFromSchema(
        contentSchema,
        { ...options, xml: false, binaryAsFile: false },
        {
          level: level + 1,
          // The decoded value inherits the field requirement, not the string wrapper as a parent.
          parentSchema,
          name,
          schemaPath: [...schemaPath, 'contentSchema'],
          seen,
          dynamicScope: childScope,
          isRequiredProperty,
        },
      )
      if (content !== undefined) {
        seen.delete(targetValue)
        return cache(_schema, JSON.stringify(content), cacheKey, skipCache)
      }
    }
  }

  // Handle object types - check for properties to identify objects
  if ('properties' in _schema || ('type' in _schema && _schema.type === 'object')) {
    const result = handleObjectSchema(_schema, options, level, seen, cacheKey, schemaPath, dynamicScope, requiredScope)
    seen.delete(targetValue)
    return result
  }

  // Handle array types
  if (('type' in _schema && _schema.type === 'array') || 'items' in _schema || 'prefixItems' in _schema) {
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
  const anyOfKeyword = _schema.anyOf ? 'anyOf' : undefined
  const compositionKeyword = _schema.oneOf ? 'oneOf' : anyOfKeyword
  const discriminate = compositionKeyword ? _schema[compositionKeyword] : undefined
  if (compositionKeyword && Array.isArray(discriminate) && discriminate.length > 0) {
    const candidate = selectExampleComposition(_schema, schemaPath, options)
    if (candidate) {
      const resolved = resolve.schema(candidate)
      if (resolved) {
        seen.delete(targetValue)
        return cache(
          _schema,
          withDiscriminatorTag(
            _schema,
            candidate,
            getExampleFromSchema(resolved, consumeCompositionSelection(options, schemaPath, compositionKeyword), {
              level: level + 1,
              schemaPath,
              seen,
              dynamicScope: childScope,
              requiredScope: memberRequiredScope,
              isRequiredProperty,
            }),
            options,
            schemaPath,
          ),
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
    let choiceIndex = 0
    for (const item of items) {
      const resolvedItem = resolve.schema(item)
      const isChoiceMember = !!resolvedItem && (Array.isArray(resolvedItem.oneOf) || Array.isArray(resolvedItem.anyOf))
      const memberSchemaPath = isChoiceMember ? [...schemaPath, String(choiceIndex++)] : schemaPath
      const ex = getExampleFromSchema(item as SchemaObject, options, {
        level: level + 1,
        parentSchema: _schema,
        schemaPath: memberSchemaPath,
        seen,
        dynamicScope: childScope,
        requiredScope: memberRequiredScope,
        isRequiredProperty,
      })
      if (merged === undefined) {
        merged = ex
      } else if (merged && typeof merged === 'object' && ex && typeof ex === 'object') {
        merged = mergeExamples(merged, ex)
      } else if (ex !== undefined && ex !== null) {
        // Prefer the latest defined primitive value (but a null contribution —
        // e.g. a constraint-only `not`/`if-then-else` member — must not clobber).
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

/** Keep binary provenance for multipart callers without resolving schemas on the default data path. */
const asBinaryFile = (
  schema: SchemaObject,
  value: unknown,
  options?: GetExampleFromSchemaOptions,
  schemaPath: string[] = [],
): unknown => {
  if (!options?.binaryAsFile || typeof value !== 'string' || !value.startsWith('@')) {
    return value
  }
  if (isFileSchema(resolveFormSchema(schema, options.compositionSelection, schemaPath) ?? schema)) {
    return new File([], value.slice(1), { lastModified: 0 })
  }
  return value
}

/** Generate data, optionally retaining the exact schema decisions for another output format. */
export const getExampleFromSchema = (
  schema: SchemaObject,
  options?: GetExampleFromSchemaOptions,
  context: Parameters<typeof generateExampleFromSchema>[2] = {},
): unknown => {
  const capture = options?.[EXAMPLE_EVALUATION]
  if (!capture) {
    const value = generateExampleFromSchema(schema, options, context)
    return asBinaryFile(schema, value, options, context.schemaPath)
  }
  const node: ExampleEvaluation = {
    schema,
    value: undefined,
    path: context.schemaPath ?? [],
    name: context.name,
    dynamicScope: context.dynamicScope ?? [],
    children: [],
  }
  const parent = capture.stack.at(-1)
  if (parent) {
    parent.children.push(node)
  } else {
    capture.root = node
  }
  capture.stack.push(node)
  try {
    node.value = asBinaryFile(schema, generateExampleFromSchema(schema, options, context), options, context.schemaPath)
    return node.value
  } finally {
    capture.stack.pop()
  }
}
