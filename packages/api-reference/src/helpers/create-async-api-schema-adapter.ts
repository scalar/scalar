import {
  type DiscriminatorSchema,
  inferDiscriminatorMappingComposition,
  schemaDialect,
  schemaDiscriminator,
} from '@scalar/blocks/schema'
import { escapeJsonPointer } from '@scalar/helpers/json/escape-json-pointer'
import { isObject } from '@scalar/helpers/object/is-object'
import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import { getBooleanSchema } from '@scalar/workspace-store/helpers/get-boolean-schema'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { unpackProxyShallow } from '@scalar/workspace-store/helpers/unpack-proxy'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

/** Adapts AsyncAPI inheritance for display without changing the source or inventing constraints. */
export const createAsyncApiSchemaAdapter = (
  document: AsyncApiDocument,
): ((input: unknown, name?: string) => SchemaObject | undefined) => {
  const components = getResolvedRef(document.components)
  const entries = Object.entries(components?.schemas ?? {})
  const byRef = new Map(entries.map(([name, schema]) => [`#/components/schemas/${escapeJsonPointer(name)}`, schema]))

  const resolveInput = (input: unknown, seen = new Set<unknown>()): unknown => {
    const value = getResolvedRef(input) ?? input
    if (!isObject(value) || seen.has(unpackProxyShallow(value))) return value
    seen.add(unpackProxyShallow(value))
    return typeof value.$ref === 'string' && byRef.has(value.$ref) ? resolveInput(byRef.get(value.$ref), seen) : value
  }
  const unwrap = (input: unknown): unknown => {
    const value = resolveInput(input)
    return isObject(value) && 'schemaFormat' in value ? resolveInput(value.schema) : value
  }
  const isForeignSchema = (input: unknown): boolean => {
    const value = resolveInput(input)
    if (!isObject(value) || typeof value.schemaFormat !== 'string') return false
    const mediaType = value.schemaFormat.split(';')[0]?.trim().toLowerCase()
    return mediaType !== 'application/vnd.aai.asyncapi+json' && mediaType !== 'application/vnd.aai.asyncapi+yaml'
  }
  const named = entries.flatMap(([name, input]) => {
    const schema = unwrap(input)
    return isObject(schema) && !isForeignSchema(input) ? [{ name, schema }] : []
  })

  const parents = (schema: Record<string, unknown>): Record<string, unknown>[] =>
    Array.isArray(schema.allOf) ? schema.allOf.map(unwrap).filter(isObject) : []

  const discriminatorName = (schema: Record<string, unknown>, seen = new Set<object>()): string | undefined => {
    if (seen.has(unpackProxyShallow(schema))) return undefined
    seen.add(unpackProxyShallow(schema))
    if (typeof schema.discriminator === 'string') return schema.discriminator
    return parents(schema)
      .map((parent) => discriminatorName(parent, seen))
      .find((name) => name !== undefined)
  }

  const inherits = (schema: Record<string, unknown>, base: object, seen = new Set<object>()): boolean => {
    if (unpackProxyShallow(schema) === unpackProxyShallow(base)) return true
    if (seen.has(unpackProxyShallow(schema))) return false
    seen.add(unpackProxyShallow(schema))
    return parents(schema).some((parent) => inherits(parent, base, seen))
  }

  const propertyValue = (
    schema: Record<string, unknown>,
    property: string,
    seen = new Set<object>(),
  ): string | undefined => {
    if (seen.has(unpackProxyShallow(schema))) return undefined
    seen.add(unpackProxyShallow(schema))
    const field = isObject(schema.properties) ? unwrap(schema.properties[property]) : undefined
    if (isObject(field)) {
      if (typeof field.const === 'string') return field.const
      if (Array.isArray(field.enum) && field.enum.length === 1 && typeof field.enum[0] === 'string')
        return field.enum[0]
    }
    // An inline allOf member refines the inherited model, independent of member order.
    const members = Array.isArray(schema.allOf) ? schema.allOf : []
    const ordered = [
      ...members.filter((member) => !isObject(member) || !('$ref' in member)),
      ...members.filter((member) => isObject(member) && '$ref' in member),
    ]
    return ordered
      .map(unwrap)
      .filter(isObject)
      .map((parent) => propertyValue(parent, property, seen))
      .find((value) => value !== undefined)
  }

  // A concrete variant and a selectable base need different views of the same source object.
  const selectable = new WeakMap<object, Map<string | undefined, DiscriminatorSchema>>()
  const concrete = new WeakMap<object, Map<string | undefined, DiscriminatorSchema>>()
  const adapt = (input: unknown, name?: string, suppressSelector = false): SchemaObject | undefined => {
    const source = unwrap(input)
    if (typeof source === 'boolean') return getBooleanSchema(source)
    if (!isObject(source)) return undefined
    // Other schema formats have their own discriminator semantics.
    if (isForeignSchema(input)) {
      const wrapper = resolveInput(input)
      if (
        !isObject(wrapper) ||
        !/^application\/schema\+(json|yaml);version=draft-07$/i.test(String(wrapper.schemaFormat))
      )
        return source as SchemaObject
    }
    const cache = suppressSelector ? concrete : selectable
    const referenceName =
      isObject(input) && typeof input.$ref === 'string'
        ? entries.find(([entryName]) => `#/components/schemas/${escapeJsonPointer(entryName)}` === input.$ref)?.[0]
        : undefined
    const schemaName =
      name ??
      referenceName ??
      named.find((entry) => unpackProxyShallow(entry.schema) === unpackProxyShallow(source))?.name
    const views = cache.get(unpackProxyShallow(source)) ?? new Map<string | undefined, DiscriminatorSchema>()
    const cached = views.get(schemaName)
    if (cached) return cached
    // AsyncAPI and OpenAPI share schema fields; the discriminator is normalized below.
    const result = { ...source } as DiscriminatorSchema
    if (['if', 'then', 'else', 'contains', 'dependencies', 'allOf', 'oneOf', 'anyOf'].some((key) => key in source)) {
      Object.assign(result, { [schemaDialect]: 'draft-07' })
    }
    views.set(schemaName, result)
    cache.set(unpackProxyShallow(source), views)
    const propertyName = discriminatorName(source)
    if (typeof source.discriminator === 'string') delete result.discriminator
    if (propertyName) result.discriminator = { propertyName }

    // Preserve reference identities for model links and the renderer's cycle guards.
    const child = (value: unknown, inherited = false): unknown => {
      const schema = adapt(value, undefined, inherited)
      return isObject(value) && typeof value.$ref === 'string' ? { $ref: value.$ref, '$ref-value': schema } : schema
    }

    // Only visit schema-bearing keywords: examples and defaults are user data, not schemas.
    for (const key of ['properties', 'patternProperties', '$defs', 'definitions'] as const) {
      if (isObject(source[key])) {
        Object.assign(result, {
          [key]: Object.fromEntries(Object.entries(source[key]).map(([key, value]) => [key, child(value)])),
        })
      }
    }
    for (const key of [
      'items',
      'additionalProperties',
      'propertyNames',
      'not',
      'contains',
      'if',
      'then',
      'else',
      'contentSchema',
    ] as const) {
      if (source[key] !== undefined) Object.assign(result, { [key]: child(source[key]) })
    }
    if (isObject(source.dependencies)) {
      Object.assign(result, {
        dependencies: Object.fromEntries(
          Object.entries(source.dependencies).map(([name, value]) => [
            name,
            Array.isArray(value) ? value : child(value),
          ]),
        ),
      })
    }
    for (const key of ['allOf', 'oneOf', 'anyOf', 'prefixItems'] as const) {
      const members = source[key]
      if (Array.isArray(members))
        Object.assign(result, { [key]: members.map((member) => child(member, key === 'allOf')) })
    }

    if (propertyName && schemaName) {
      const value = propertyValue(source, propertyName) ?? schemaName
      // Pass the effective value alongside the discriminator so allOf merging cannot
      // mistake the base schema's annotation for the selected subtype's value.
      Object.assign(result.discriminator ?? {}, { [schemaDiscriminator]: { value } })
    }

    if (
      propertyName &&
      !suppressSelector &&
      typeof source.discriminator === 'string' &&
      !source.oneOf &&
      !source.anyOf
    ) {
      const variants = named.filter((entry) => inherits(entry.schema, source))
      if (variants.length > 1) {
        const schemas = Object.fromEntries(
          variants.map((entry) => [entry.name, adapt(entry.schema, entry.name, true)!]),
        )
        const mapping = Object.fromEntries(
          variants.map((entry) => [
            propertyValue(entry.schema, propertyName) ?? entry.name,
            `#/components/schemas/${escapeJsonPointer(entry.name)}`,
          ]),
        )
        // Normalize AsyncAPI inheritance to the same mapping consumed by OpenAPI.
        // The shared helper resolves the concrete views, avoiding recursive selectors.
        const view = inferDiscriminatorMappingComposition(
          {
            type: 'object',
            title: typeof source.title === 'string' ? source.title : schemaName,
            description: typeof source.description === 'string' ? source.description : undefined,
            discriminator: { propertyName, mapping },
            [schemaDiscriminator]: { inheritedVariants: true },
          } as DiscriminatorSchema,
          { components: { schemas } },
          // Preserve component order and variants sharing a discriminator value.
          variants.map((entry) => `#/components/schemas/${escapeJsonPointer(entry.name)}`),
        )!
        Object.keys(result).forEach((key) => Reflect.deleteProperty(result, key))
        Object.assign(result, view)
      }
    }
    return result
  }
  return adapt
}
