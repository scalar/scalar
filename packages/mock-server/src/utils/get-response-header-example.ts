import { getFirstMediaType } from '@scalar/helpers/http/get-first-media-type'
import { isJsonMediaType } from '@scalar/helpers/http/is-json-media-type'
import { isXmlMediaType } from '@scalar/helpers/http/is-xml-media-type'
import { parseMimeType } from '@scalar/helpers/http/mime-type'
import { isObject, isObjectLike } from '@scalar/helpers/object/is-object'
import type { OpenAPIV3_2 } from '@scalar/openapi-types'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { getResolvedRefDeep } from '@scalar/workspace-store/helpers/get-resolved-ref-deep'
import { serializeQuerystringParameter } from '@scalar/workspace-store/helpers/querystring-parameter'
import { getExampleFromSchema, getXmlBodyExample, serializeSimpleStyle } from '@scalar/workspace-store/request-example'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { EncodingObjectSchema } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

import type { ExampleGenerationContext, ExampleSchema } from './generate-response-example'
import { selectResponseExample } from './select-response-example'
import { serializeLinkset } from './serialize-linkset'
import { serializeResponseBody } from './serialize-response-body'

/** A reference chain can still end at an unresolved Media Type Object reference. */
const isResolvedMediaType = (
  value: OpenAPIV3_2.MediaTypeObject | OpenAPIV3_2.ReferenceObject | undefined,
): value is OpenAPIV3_2.MediaTypeObject => isObjectLike(value) && !('$ref' in value)

/** Header example rules depend on the authored version, even after document upgrading. */
export const usesOpenApi32HeaderExamples = (context: ExampleGenerationContext): boolean =>
  (context.originalOpenapiVersion ?? context.openapiVersion)?.startsWith('3.2.') ?? false

/** Form-based headers and whole query strings share the same URL encoding. */
const serializeFormHeader = (value: unknown, encoding: OpenAPIV3_2.MediaTypeObject['encoding']): string | undefined => {
  if (!isObject(value)) {
    return typeof value === 'string' ? value : undefined
  }

  return serializeQuerystringParameter(
    {
      value,
      kind: 'data',
      contentType: 'application/x-www-form-urlencoded',
      encoding:
        encoding &&
        Object.fromEntries(
          Object.entries(encoding).map(([key, options]) => [key, coerceValue(EncodingObjectSchema, options)]),
        ),
    },
    () => null,
  )
}

/**
 * Select and serialize a response header example before HTTP header validation.
 *
 * Header Object examples take precedence over media type examples. Both take precedence over
 * schema generation, and `serializedValue` already contains the text to send.
 * An exploded OpenAPI 3.2 cookie map returns one value per field.
 */
export const getResponseHeaderExample = (
  header: OpenAPIV3_2.HeaderObject | OpenAPIV3_2.ReferenceObject | undefined,
  generationContext: ExampleGenerationContext = {},
  normalizedName?: string,
): string | string[] | undefined => {
  const headerObject = getResolvedRef<OpenAPIV3_2.HeaderObject | undefined>(header)
  if (!isObjectLike(headerObject)) {
    return undefined
  }

  const [contentType, mediaReference] = getFirstMediaType(headerObject.content) ?? []
  const resolvedMedia = getResolvedRef(mediaReference)
  const media = isResolvedMediaType(resolvedMedia) ? resolvedMedia : undefined
  const example = selectResponseExample(headerObject) ?? selectResponseExample(media)
  const mediaType = parseMimeType(contentType).essence
  if (example?.serializedValue !== undefined) {
    return mediaType === 'application/linkset' ? serializeLinkset(example.serializedValue) : example.serializedValue
  }

  const authoredSchema = headerObject.schema ?? media?.schema
  if (isXmlMediaType(contentType)) {
    // The XML serializer uses the referenced component name as the default root element.
    return getXmlBodyExample(authoredSchema as ExampleSchema | undefined, example, {
      ...generationContext,
      mode: 'read',
      format: false,
      xmlDeclaration: false,
      escapeForHttpHeader: true,
    }).xml
  }

  const schema = contentType !== undefined || !example ? getResolvedRefDeep(authoredSchema) : undefined
  const value = !example && schema ? getExampleFromSchema(schema as ExampleSchema, generationContext) : example?.value
  if (value === undefined) {
    return undefined
  }
  if (contentType !== undefined) {
    if (mediaType === 'application/x-www-form-urlencoded') {
      return serializeFormHeader(value, media?.encoding)
    }
    if (mediaType === 'application/linkset') {
      return serializeLinkset(value)
    }
    const json = isJsonMediaType(contentType)
    const provenance =
      !example || (json && usesOpenApi32HeaderExamples(generationContext)) ? 'data' : example.provenance
    const text = serializeResponseBody(value, contentType, schema, provenance)
    // JSON escapes keep generated data ASCII on the wire, including surrogate pairs for astral characters.
    return json && text !== value
      ? text?.replace(/[\u007f-\uffff]/g, (unit) => `\\u${unit.charCodeAt(0).toString(16).padStart(4, '0')}`)
      : text
  }

  if (
    normalizedName === 'set-cookie' &&
    usesOpenApi32HeaderExamples(generationContext) &&
    headerObject.explode === true &&
    isObject(value)
  ) {
    // Commas inside a cookie (for example, in Expires) belong to that cookie's field value.
    return Object.entries(value).map(([cookie, attributes]) => `${cookie}=${String(attributes)}`)
  }
  if (value === null) {
    return undefined
  }
  return String(example?.provenance === 'data' ? serializeSimpleStyle(value, headerObject.explode ?? false) : value)
}
