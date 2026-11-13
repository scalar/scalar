import { isJsonMediaType } from '@scalar/helpers/http/is-json-media-type'
import { isXmlMediaType } from '@scalar/helpers/http/is-xml-media-type'
import { parseMimeType } from '@scalar/helpers/http/mime-type'

import { resolveSchemaWithAnnotations } from '@/helpers/resolve-schema-with-annotations'
import type { SchemaObject } from '@/schemas/v3.2/strict/openapi-document'
import type { MaybeRefSchemaObject } from '@/schemas/v3.2/strict/schema'
import { isArraySchema, isStringSchema } from '@/schemas/v3.2/strict/type-guards'

/** Recognize binary multipart fields, including repeated file parts and nullable strings. */
export const isFileSchema = (schema: SchemaObject, allowUntyped = true, contentType?: string): boolean => {
  const seen = new Set<MaybeRefSchemaObject>()
  const visit = (
    input: MaybeRefSchemaObject | boolean | undefined,
    allowAlternatives = true,
    allowRawBinary = false,
  ): boolean => {
    if (!input || typeof input === 'boolean' || seen.has(input)) {
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
    // Encoded strings stay editable; raw binary media can override a string's text default.
    if (contentType && !resolved.contentEncoding && !('format' in resolved && resolved.format === 'byte')) {
      const binaryMedia = contentType.split(',').some((value) => {
        const { type } = parseMimeType(value.trim())
        return !['text', 'multipart'].includes(type) && !isJsonMediaType(value) && !isXmlMediaType(value)
      })
      if (binaryMedia) {
        return true
      }
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
