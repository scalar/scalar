import { resolveSchemaWithAnnotations } from '@scalar/workspace-store/helpers/resolve-schema-with-annotations'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { isArraySchema, isStringSchema } from '@scalar/workspace-store/schemas/v3.2/strict/type-guards'

/** Recognize binary multipart fields, including repeated file parts and nullable strings. */
export const isFileSchema = (schema: SchemaObject): boolean => {
  const resolved = resolveSchemaWithAnnotations(schema)
  if (!resolved) {
    return false
  }
  if (isArraySchema(resolved)) {
    const item = resolveSchemaWithAnnotations(resolved.items)
    // Multipart file arrays describe each part with an item schema, not another array.
    return item !== undefined && !isArraySchema(item) && isFileSchema(item)
  }
  if (isStringSchema(resolved)) {
    return resolved.format === 'binary'
  }
  // OAS 3.1+ describes raw binary without a JSON type. Encoded strings are text inputs.
  return !('type' in resolved) && Boolean(resolved.contentMediaType) && !resolved.contentEncoding
}
