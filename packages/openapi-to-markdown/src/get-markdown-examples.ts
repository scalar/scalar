import { isXmlMediaType } from '@scalar/helpers/http/is-xml-media-type'
import { isObject } from '@scalar/helpers/object/is-object'
import { getResolvedRef, mergeSiblingReferences } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { getExampleFromSchema, getXmlBodyExample } from '@scalar/workspace-store/request-example'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

/** Example-bearing media types, parameters, and headers share the same precedence rules. */
export type ExampleSource = {
  schema?: unknown
  example?: unknown
  examples?: Record<string, unknown>
}

/** Named examples can contain a literal value or point to an external value. */
type MarkdownExample = {
  name?: string
  summary?: string
  description?: string
} & (
  | { value: unknown }
  | { externalValue: string }
  | { serializedValue: string }
  | { omitted: true }
  | { dataValue: unknown }
  | { error: string }
)

/** Mirrors the depth at which `getExampleFromSchema` stops following nested schemas. */
const EXAMPLE_DEPTH = 10

/**
 * Generated examples repeat every shared schema at each place it is used, up to ten levels deep.
 * A densely shared schema graph therefore produces billions of values, so larger examples are skipped.
 * The largest generated examples in the Stripe, GitHub, and Cloudflare descriptions have about 7,600 values.
 */
const MAX_GENERATED_EXAMPLE_VALUES = 10_000

/**
 * Estimate how many values an example generated from this schema contains, stopping just past the limit.
 * Counts are cached per schema and level, so this is linear in the size of the schema graph.
 */
export const countGeneratedExampleValues = (root: unknown, limit = MAX_GENERATED_EXAMPLE_VALUES): number => {
  const counts = new WeakMap<object, Map<number, number>>()
  const count = (input: unknown, level: number): number => {
    if (level > EXAMPLE_DEPTH || !isObject(input)) return 1
    const cached = counts.get(input)?.get(level)
    if (cached !== undefined) return cached
    const schema: unknown = getResolvedRef(input as SchemaObject, mergeSiblingReferences)
    if (!isObject(schema)) return 1
    // Supplied examples bypass schema expansion in the generator too.
    if (schema.example !== undefined || (Array.isArray(schema.examples) && schema.examples.length > 0)) return 1
    let total = 1
    const add = (child: unknown): void => {
      if (total <= limit) total += count(child, level + 1)
    }
    if (isObject(schema.properties)) Object.values(schema.properties).forEach(add)
    if (isObject(schema.patternProperties)) Object.values(schema.patternProperties).forEach(add)
    if (isObject(schema.additionalProperties)) add(schema.additionalProperties)
    if (schema.items !== undefined) add(schema.items)
    if (Array.isArray(schema.prefixItems)) schema.prefixItems.forEach(add)
    if (Array.isArray(schema.allOf)) schema.allOf.forEach(add)
    const variants = Array.isArray(schema.oneOf) ? schema.oneOf : Array.isArray(schema.anyOf) ? schema.anyOf : []
    // Object and array generation can use the first variant, while other unions skip null.
    // A discriminator can choose any variant, so bound the largest candidate in that case.
    const nonNull = variants.find((variant) => {
      const resolved = getResolvedRef(variant, mergeSiblingReferences)
      return isObject(resolved) && resolved.type !== 'null'
    })
    const candidates =
      isObject(schema.discriminator) && schema.discriminator.defaultMapping !== undefined
        ? variants
        : [variants[0], nonNull]
    let variantCount = 0
    for (const candidate of candidates) {
      if (candidate !== undefined && total <= limit && variantCount <= limit)
        variantCount = Math.max(variantCount, count(candidate, level + 1))
    }
    total += variantCount
    const levels = counts.get(input) ?? new Map<number, number>()
    levels.set(level, total)
    counts.set(input, levels)
    return total
  }
  return count(root, 0)
}

/** Preserve supplied values; generate a fallback only when examples are not supplied. */
export const getMarkdownExamples = (
  source: ExampleSource,
  mediaType: string,
  mode?: 'read' | 'write',
  openapiVersion = '3.2.0',
  // Schema metadata can be upgraded while example fields still follow the original version.
  schemaOpenapiVersion = openapiVersion,
): MarkdownExample[] => {
  if (source.example !== undefined) return [{ value: source.example }]
  if (source.examples && Object.keys(source.examples).length) {
    return Object.entries(source.examples).flatMap(([name, reference]): MarkdownExample[] => {
      const example = getResolvedRef<unknown>(reference)
      if (!isObject(example)) return []
      const metadata = {
        name,
        summary: typeof example.summary === 'string' ? example.summary : undefined,
        description: typeof example.description === 'string' ? example.description : undefined,
      }
      if (example.value !== undefined) return [{ ...metadata, value: example.value }]
      if (/^3\.2\./.test(openapiVersion) && typeof example.serializedValue === 'string')
        return [{ ...metadata, serializedValue: example.serializedValue }]
      if (typeof example.externalValue === 'string') return [{ ...metadata, externalValue: example.externalValue }]
      if (/^3\.2\./.test(openapiVersion) && example.dataValue !== undefined)
        return [{ ...metadata, dataValue: example.dataValue }]
      return []
    })
  }
  const schema = getResolvedRef<unknown>(source.schema)
  if (!isObject(schema)) return []
  if (countGeneratedExampleValues(source.schema) > MAX_GENERATED_EXAMPLE_VALUES) return [{ omitted: true }]
  if (isXmlMediaType(mediaType)) {
    const result = getXmlBodyExample(source.schema as SchemaObject, undefined, {
      mode,
      openapiVersion: schemaOpenapiVersion,
    })
    return [
      result.xml === undefined ? { error: 'Unable to generate an XML example.' } : { serializedValue: result.xml },
    ]
  }
  const value = getExampleFromSchema(getResolvedRef(source.schema as SchemaObject, mergeSiblingReferences), {
    mode,
  })
  return value === undefined ? [] : [{ value }]
}
