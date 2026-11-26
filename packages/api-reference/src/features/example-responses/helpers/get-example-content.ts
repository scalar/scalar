import { getResolvedRefDeep } from '@scalar/blocks/code-example'
import { isStreamingContentType } from '@scalar/helpers/http/is-streaming-content-type'
import { isXmlMediaType } from '@scalar/helpers/http/is-xml-media-type'
import { prettyPrintJson } from '@scalar/helpers/json/pretty-print-json'
import { getExampleValue, getExplicitExampleText } from '@scalar/workspace-store/helpers/get-example-value'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { serializeStreamExample } from '@scalar/workspace-store/helpers/serialize-stream-example'
import { snapshotSchema } from '@scalar/workspace-store/helpers/snapshot-schema'
import {
  type XmlExampleOptions,
  getExampleFromSchema,
  getXmlBodyExample,
} from '@scalar/workspace-store/request-example'
import type {
  ExampleObject,
  MediaTypeObject,
  SchemaObject,
} from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

import { type ExampleLanguage, getExampleLanguage } from './get-example-language'

/** Keep the displayed response and its clipboard action on the same resolved, formatted value. */
export const getExampleContent = (
  response: MediaTypeObject | undefined,
  example: ExampleObject | undefined,
  {
    contentType = 'application/json',
    compositionSelection,
    openapiVersion,
    jsonSchemaDialect,
    onDiagnostic,
    onLanguage,
  }: {
    onDiagnostic?: XmlExampleOptions['onDiagnostic']
    openapiVersion?: string
    jsonSchemaDialect?: string
    contentType?: string
    compositionSelection?: Record<string, number>
    /** Report the rendered grammar when structured data falls back to JSON formatting. */
    onLanguage?: (language: ExampleLanguage) => void
  } = {},
): string | undefined => {
  const mediaLanguage = getExampleLanguage(contentType)
  onLanguage?.(mediaLanguage)
  // Non-JSON media types do not have a general-purpose serializer. When their
  // structured values are displayed as JSON, keep that representation's label.
  const reportStructuredLanguage = (value: unknown): void => {
    if (typeof value === 'object' && value !== null) {
      onLanguage?.('json')
    }
  }
  if (isXmlMediaType(contentType)) {
    return getXmlBodyExample(response?.schema as SchemaObject | undefined, example, {
      mode: 'read',
      compositionSelection,
      emptyString: 'string',
      openapiVersion,
      jsonSchemaDialect,
      onDiagnostic,
    }).xml
  }
  if (example !== undefined) {
    const selected = getExampleValue(getResolvedRefDeep(example))
    if (isStreamingContentType(contentType) && selected?.source !== 'serialized') {
      const value = selected?.value
      if (value === undefined) {
        return ''
      }
      if (typeof value === 'string') {
        return value
      }
      const stream = serializeStreamExample(value, contentType, false)
      if (stream !== undefined) {
        return stream
      }
      reportStructuredLanguage(value)
      return JSON.stringify(value, null, 2)
    }
    const explicitText = getExplicitExampleText(selected, contentType, 2)
    if (explicitText !== undefined) {
      return explicitText
    }
    const value = selected?.value
    if (typeof value === 'string' && mediaLanguage !== 'json') {
      return value
    }
    reportStructuredLanguage(value)
    if (selected?.source === 'value') {
      // Keep the formatter's expansion budget for shared, resolved legacy examples.
      return prettyPrintJson((value === undefined ? '' : value) as Parameters<typeof prettyPrintJson>[0])
    }
    return typeof value === 'string' ? prettyPrintJson(value) : (JSON.stringify(value, null, 2) ?? '')
  }

  const contentSchema = response?.schema ?? response?.itemSchema
  if (contentSchema && getResolvedRef(contentSchema) !== undefined) {
    // Let the generator resolve references so recursive schemas retain their type information.
    const content = getExampleFromSchema(snapshotSchema(contentSchema) as SchemaObject, {
      emptyString: 'string',
      mode: 'read',
      compositionSelection,
      openapiVersion,
      jsonSchemaDialect,
    })
    if (content === undefined) {
      return undefined
    }
    const stream = serializeStreamExample(content, contentType, response?.schema === undefined)
    if (stream !== undefined) {
      return stream
    }
    if (typeof content === 'string' && mediaLanguage !== 'json') {
      return content
    }
    reportStructuredLanguage(content)
    // Schema generation returns unknown, but produces JSON values supported by the formatter.
    return prettyPrintJson(content as Parameters<typeof prettyPrintJson>[0])
  }

  return undefined
}
