import { type RenderedExample, normalizeRenderedExamples } from '@scalar/blocks/schema/helpers'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { resolve } from '@scalar/workspace-store/resolve'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import {
  type HeaderObject,
  type MediaTypeObject,
  type SchemaObject,
  SchemaObjectSchema,
  type SchemaReferenceType,
} from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

type HeaderExamples = RenderedExample[]

/** Preserve the source name and summary separately from the example payload. */
const getExamples = (source: HeaderObject | MediaTypeObject | undefined): HeaderExamples => {
  if (source && 'example' in source && source.example !== undefined) {
    return normalizeRenderedExamples([source.example])
  }
  return normalizeRenderedExamples(source && 'examples' in source ? source.examples : undefined)
}

/** Compositions describe the same header value; property and item schemas describe different values. */
const applyExamples = (
  schema: SchemaReferenceType<SchemaObject>,
  examples: HeaderExamples,
  seen: WeakMap<object, SchemaObject>,
): SchemaObject => {
  const cached = seen.get(schema)
  if (cached) {
    return cached
  }

  const result = { ...resolve.schema(schema), example: undefined, examples }
  // Cache before descending so recursive compositions keep their identity and terminate.
  seen.set(schema, result)
  for (const keyword of ['oneOf', 'anyOf', 'allOf'] as const) {
    if (result[keyword]) {
      result[keyword] = result[keyword].map((branch) => applyExamples(branch, examples, seen))
    }
  }
  return result
}

/** Resolve a response header schema and prefer its explicit examples over schema examples. */
export const getHeaderSchema = (header: HeaderObject): SchemaObject | undefined => {
  const content = 'content' in header ? getResolvedRef(Object.values(header.content ?? {})[0]) : undefined
  const schema = getResolvedRef('schema' in header && header.schema ? header.schema : content?.schema)

  // Empty or unresolved header examples must not hide usable media type examples.
  const headerExamples = getExamples(header)
  const examples = headerExamples.length ? headerExamples : getExamples(content)
  if (!examples.length) {
    return schema
  }

  return applyExamples(schema ?? coerceValue(SchemaObjectSchema, {}), examples, new WeakMap())
}
