import { isXmlMediaType } from '@scalar/helpers/http/is-xml-media-type'
import { parseMimeType } from '@scalar/helpers/http/mime-type'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { serializeXmlExample } from '@scalar/workspace-store/request-example'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

type Schema = NonNullable<OpenAPIV3_1.ComponentsObject['schemas']>[string]

/**
 * Whether a media type carries a single JSON document.
 *
 * Matched on the parsed subtype, so suffixed types (`application/problem+json`) and parameterized ones
 * (`application/json; charset=utf-8`) count, while a type that merely mentions JSON in a parameter does
 * not. Line-delimited relatives (`application/jsonl`, `application/x-ndjson`) are deliberately excluded:
 * their payload is a sequence of documents, so a string body already carries the framing. A missing
 * media type parses as `text/plain`, which is the safe answer here: the body is written as it is.
 */
const isJsonDocumentContentType = (contentType: string | undefined): boolean => {
  const { subtype } = parseMimeType(contentType)

  return subtype === 'json' || subtype.endsWith('+json')
}

/**
 * How the resolved response schema describes the body: as a string, as something else, or not at all.
 *
 * Composite schemas (`allOf`, an `enum` without a type) land on `unknown`, which is the honest answer:
 * they say nothing this decision can act on.
 */
const declaredBodyKind = (schema: Schema | undefined): 'string' | 'other' | 'unknown' => {
  if (!schema || typeof schema !== 'object' || !('type' in schema) || schema.type === undefined) {
    return 'unknown'
  }

  const { type } = schema

  if (Array.isArray(type)) {
    if (type.length === 0) {
      return 'unknown'
    }

    return type.includes('string') ? 'string' : 'other'
  }

  return type === 'string' ? 'string' : 'other'
}

/** Whether a string holds serialized JSON of any shape, a bare scalar included. */
const isSerializedJson = (value: string): boolean => {
  try {
    JSON.parse(value)

    return true
  } catch {
    return false
  }
}

/** Whether a string holds a serialized JSON object or array. */
const isSerializedJsonDocument = (value: string): boolean => {
  const trimmed = value.trim()

  return (trimmed.startsWith('{') || trimmed.startsWith('[')) && isSerializedJson(trimmed)
}

/**
 * Serializes a mocked response body for the negotiated media type.
 *
 * Returns `undefined` for an `undefined` body, mirroring `JSON.stringify`, so the caller can send an
 * empty body rather than the characters `undefined`.
 */
export const serializeResponseBody = (
  body: unknown,
  contentType: string | undefined,
  schema?: Schema,
  provenance?: 'data' | 'serialized',
): string | undefined => {
  if (provenance === 'serialized' && typeof body === 'string') {
    return body
  }
  if (provenance === 'data' && isJsonDocumentContentType(contentType)) {
    return JSON.stringify(body)
  }
  if (isXmlMediaType(contentType)) {
    return typeof body === 'string'
      ? body
      : serializeXmlExample(body, coerceValue(SchemaObjectSchema, schema ?? {}), { mode: 'read' }).xml
  }

  if (typeof body === 'string') {
    // Anywhere but a single JSON document, the characters are the payload: `text/plain`, `text/html`,
    // XML, `text/event-stream`, line-delimited JSON, and anything else the mock does not recognize.
    if (!isJsonDocumentContentType(contentType)) {
      return body
    }

    // Under a JSON media type a string has to be encoded, or a `type: string` response arrives as the
    // bare characters `string`, which no JSON client can parse. What survives unencoded is text that is
    // already the body the document describes: whatever parses when the schema declares a non-string
    // type, and an object or array when the schema says nothing, both of which are documents the author
    // serialized by hand. A quoted scalar without a schema behind it stays a string, since the author
    // quoting `'123'` is the only signal available about what they meant.
    const kind = declaredBodyKind(schema)

    if (kind === 'other' && isSerializedJson(body)) {
      return body
    }

    if (kind === 'unknown' && isSerializedJsonDocument(body)) {
      return body
    }
  }

  return JSON.stringify(body)
}
