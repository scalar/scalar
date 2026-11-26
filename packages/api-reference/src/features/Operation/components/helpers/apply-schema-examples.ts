import type { RenderedExample } from '@scalar/blocks/schema/helpers'
import { resolve } from '@scalar/workspace-store/resolve'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import {
  type SchemaObject,
  SchemaObjectSchema,
  type SchemaReferenceType,
} from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

/** Replace examples of the same value without changing examples of its properties or array items. */
export const applySchemaExamples = (
  schema: SchemaReferenceType<SchemaObject> | null | undefined,
  examples: RenderedExample[],
  seen = new WeakMap<object, SchemaObject>(),
): SchemaObject => {
  const source = schema ?? coerceValue(SchemaObjectSchema, {})
  const cached = seen.get(source)
  if (cached) {
    return cached
  }

  const result = { ...resolve.schema(source), example: undefined, examples }
  // Cache before descending so recursive compositions keep their identity and terminate.
  seen.set(source, result)
  for (const keyword of ['oneOf', 'anyOf', 'allOf'] as const) {
    if (result[keyword]) {
      result[keyword] = result[keyword].map((branch) => applySchemaExamples(branch, examples, seen))
    }
  }
  return result
}
