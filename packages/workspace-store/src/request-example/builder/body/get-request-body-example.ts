import { isXmlMediaType } from '@scalar/helpers/http/is-xml-media-type'
import { parseMimeType } from '@scalar/helpers/http/mime-type'
import type {
  ExampleObject,
  RequestBodyObject,
  SchemaObject,
} from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

import { getExampleValue } from '@/helpers/get-example-value'
import { getResolvedRefDeep } from '@/helpers/get-resolved-ref-deep'
import { serializeStreamExample } from '@/helpers/serialize-stream-example'
import { getExample } from '@/request-example/builder/helpers/get-example'
import { getExampleFromSchema } from '@/request-example/builder/helpers/get-example-from-schema'
import { getXmlBodyExample } from '@/request-example/xml/get-xml-body-example'

/**
 * Generate a write-mode example directly from a request body's schema, ignoring any stored example.
 *
 * This is the schema-generation half of {@link getExampleFromBody}. It is exposed on its own so
 * callers that need to regenerate a body for a freshly selected composition branch (rather than the
 * edited example that would otherwise shadow it) produce the exact same value the initial example
 * does. Data generation deep-resolves nested `$ref` members. XML retains reference sites so node
 * naming and version-specific wrappers survive serialization.
 *
 * Returns `undefined` when there is no schema for the content type.
 */
export const getSchemaExampleFromBody = (
  requestBody: RequestBodyObject,
  contentType: string,
  requestBodyCompositionSelection?: Record<string, number>,
  openapiVersion?: string,
): unknown => {
  const mediaType = requestBody.content?.[contentType]
  const schema =
    mediaType?.schema ??
    (mediaType?.itemSchema && parseMimeType(contentType).type === 'multipart'
      ? { type: 'array' as const, items: mediaType.itemSchema }
      : mediaType?.itemSchema)
  if (isXmlMediaType(contentType)) {
    return getXmlBodyExample(mediaType?.schema as SchemaObject | undefined, undefined, {
      openapiVersion,
      mode: 'write',
      compositionSelection: requestBodyCompositionSelection,
      schemaPath: ['requestBody'],
    }).xml
  }
  if (!schema) {
    return undefined
  }

  const resolvedSchema = getResolvedRefDeep(schema) as SchemaObject

  const value = getExampleFromSchema(
    resolvedSchema,
    {
      mode: 'write',
      compositionSelection: requestBodyCompositionSelection,
    },
    {
      schemaPath: ['requestBody'],
    },
  )
  return serializeStreamExample(value, contentType, mediaType?.schema === undefined) ?? value
}

/**
 * Basically getExample + we generate an example from the schema if no example is found
 */
export const getExampleFromBody = (
  requestBody: RequestBodyObject,
  contentType: string,
  exampleName: string,
  requestBodyCompositionSelection?: Record<string, number>,
  openapiVersion?: string,
): ExampleObject | null => {
  // Return the existing example when it carries a usable value. An example that only has an
  // `externalValue` (not yet resolved to a `value`) is treated as missing, so we fall back to a
  // schema-generated example instead of building an empty request body.
  const example = getExample(requestBody, exampleName, contentType)
  if (isXmlMediaType(contentType)) {
    const result = getXmlBodyExample(requestBody.content?.[contentType]?.schema as SchemaObject | undefined, example, {
      openapiVersion,
      mode: 'write',
      compositionSelection: requestBodyCompositionSelection,
      schemaPath: ['requestBody'],
    })
    if (result.xml === undefined) return null
    // Consumers select dataValue before value, so retain the serialized result for editor and wire output.
    return example?.dataValue !== undefined
      ? { ...example, value: result.xml, serializedValue: result.xml }
      : { ...example, value: result.xml }
  }
  const selected = getExampleValue(example)
  if (example && selected) {
    const stream =
      typeof selected.value === 'string' ? undefined : serializeStreamExample(selected.value, contentType, false)
    if (stream !== undefined) {
      return selected.source === 'data'
        ? { ...example, value: stream, serializedValue: stream }
        : { ...example, value: stream }
    }
    return selected.source === 'value' ? example : { ...example, value: selected.value }
  }

  // Generate an example from the schema
  const schemaExample = getSchemaExampleFromBody(
    requestBody,
    contentType,
    requestBodyCompositionSelection,
    openapiVersion,
  )
  if (schemaExample === undefined || schemaExample === null) {
    return null
  }

  return { value: schemaExample }
}
