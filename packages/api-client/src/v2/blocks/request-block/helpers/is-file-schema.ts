import { resolveSchemaWithAnnotations } from '@scalar/workspace-store/helpers/resolve-schema-with-annotations'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import type { MaybeRefSchemaObject } from '@scalar/workspace-store/schemas/v3.2/strict/schema'
import { isArraySchema, isStringSchema } from '@scalar/workspace-store/schemas/v3.2/strict/type-guards'

/** Recognize binary multipart fields, including repeated file parts and nullable strings. */
export const isFileSchema = (schema: SchemaObject, allowUntyped = true): boolean => {
  const seen = new Set<MaybeRefSchemaObject>()
  const visit = (
    input: MaybeRefSchemaObject | undefined,
    allowAlternatives = true,
    allowRawBinary = false,
  ): boolean => {
    if (!input || seen.has(input)) {
      return false
    }
    seen.add(input)
    const resolved = resolveSchemaWithAnnotations(input)
    if (!resolved) {
      return false
    }

    if (isArraySchema(resolved)) {
      return visit(resolved.items, true, allowRawBinary)
    }
    if ('type' in resolved && !isStringSchema(resolved)) {
      return false
    }
    if ('format' in resolved && resolved.format !== undefined) {
      return resolved.format === 'binary'
    }
    // Intersections may declare the type and binary format in separate members.
    if (resolved.allOf?.some((member) => visit(member, allowAlternatives && !('type' in resolved)))) {
      return true
    }
    // The form projection keeps alternatives alongside the selected type. Do not let an
    // unselected binary alternative turn a selected ordinary string into a file input.
    if ('type' in resolved) {
      return false
    }
    if (allowAlternatives && (resolved.oneOf || resolved.anyOf)) {
      return (resolved.oneOf ?? resolved.anyOf)?.some((member) => visit(member)) ?? false
    }
    // OAS 3.1+ describes raw binary without a JSON type. Encoded strings are text inputs.
    return (allowRawBinary || Boolean(resolved.contentMediaType)) && !resolved.contentEncoding
  }
  return visit(schema, true, allowUntyped)
}
