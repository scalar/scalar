import { getExampleValue } from '@scalar/workspace-store/helpers/get-example-value'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import {
  type HeaderObject,
  type SchemaObject,
  SchemaObjectSchema,
} from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

/** Resolve a response header schema and prefer its explicit examples over schema examples. */
export const getHeaderSchema = (header: HeaderObject): SchemaObject | undefined => {
  const content = 'content' in header ? getResolvedRef(Object.values(header.content ?? {})[0]) : undefined
  const schema = getResolvedRef('schema' in header && header.schema ? header.schema : content?.schema)

  // Header examples take precedence over media type examples, which in turn override the schema.
  const source =
    ('example' in header && header.example !== undefined) || ('examples' in header && header.examples)
      ? header
      : content

  const examples: { value: unknown }[] =
    source && 'example' in source && source.example !== undefined
      ? [{ value: source.example }]
      : Object.values(source && 'examples' in source ? (source.examples ?? {}) : {}).flatMap((entry) => {
          const example = getExampleValue(entry)
          // The schema renderer unwraps Example Objects once; retain a wrapper around object data.
          return example ? [{ value: example.value }] : []
        })

  if (!examples.length) {
    return schema
  }

  return { ...(schema ?? coerceValue(SchemaObjectSchema, {})), example: undefined, examples }
}
