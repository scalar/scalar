import { isObject } from '@scalar/helpers/object/is-object'
import { getResolvedRef, mergeSiblingReferences } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { getExampleFromSchema } from '@scalar/workspace-store/request-example'
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
} & ({ value: unknown } | { externalValue: string } | { serializedValue: string })

/** Preserve supplied values; generate a fallback only when examples are not supplied. */
export const getMarkdownExamples = (
  source: ExampleSource,
  mediaType: string,
  mode?: 'read' | 'write',
  openapiVersion = '3.2.0',
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
        return [{ ...metadata, value: example.dataValue }]
      return []
    })
  }
  const schema = getResolvedRef<unknown>(source.schema)
  if (!isObject(schema)) return []
  const value = getExampleFromSchema(getResolvedRef(source.schema as SchemaObject, mergeSiblingReferences), {
    xml: mediaType.includes('xml'),
    mode,
  })
  return value === undefined ? [] : [{ value }]
}
