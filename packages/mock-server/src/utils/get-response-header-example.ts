import { getFirstMediaType } from '@scalar/helpers/http/get-first-media-type'
import type { OpenAPIV3_2 } from '@scalar/openapi-types'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { getResolvedRefDeep } from '@scalar/workspace-store/helpers/get-resolved-ref-deep'
import { getExampleFromSchema, serializeSimpleStyle } from '@scalar/workspace-store/request-example'

import type { ExampleGenerationContext, ExampleSchema } from './generate-response-example'
import { selectResponseExample } from './select-response-example'
import { serializeResponseBody } from './serialize-response-body'

/** A reference chain can still end at an unresolved Media Type Object reference. */
const isResolvedMediaType = (
  value: OpenAPIV3_2.MediaTypeObject | OpenAPIV3_2.ReferenceObject | undefined,
): value is OpenAPIV3_2.MediaTypeObject => typeof value === 'object' && value !== null && !('$ref' in value)

/**
 * Select and serialize a response header example before HTTP header validation.
 *
 * Header Object examples take precedence over media type examples. Both take precedence over
 * schema generation, and `serializedValue` already contains the text to send.
 */
export const getResponseHeaderExample = (
  header: OpenAPIV3_2.HeaderObject | OpenAPIV3_2.ReferenceObject | undefined,
  generationContext: ExampleGenerationContext = {},
): string | undefined => {
  const headerObject = getResolvedRef<OpenAPIV3_2.HeaderObject | undefined>(header)
  if (!headerObject || typeof headerObject !== 'object') {
    return undefined
  }

  const [contentType, mediaReference] = getFirstMediaType(headerObject.content) ?? []
  const resolvedMedia = getResolvedRef(mediaReference)
  const media = isResolvedMediaType(resolvedMedia) ? resolvedMedia : undefined
  const example = selectResponseExample(headerObject) ?? selectResponseExample(media)
  if (example?.serializedValue !== undefined) {
    return example.serializedValue
  }

  const schema =
    contentType !== undefined || !example ? getResolvedRefDeep(headerObject.schema ?? media?.schema) : undefined
  // Pass the authored schema through directly so generation retains its original keywords.
  const value = !example && schema ? getExampleFromSchema(schema as ExampleSchema, generationContext) : example?.value
  if (value === undefined) {
    return undefined
  }
  if (contentType !== undefined) {
    return serializeResponseBody(value, contentType, schema, example?.provenance)
  }

  if (value === null) {
    return undefined
  }
  return String(example?.provenance === 'data' ? serializeSimpleStyle(value, headerObject.explode ?? false) : value)
}
