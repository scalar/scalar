import { getResolvedRefDeep } from '@scalar/blocks/code-example'
import { isStreamingContentType } from '@scalar/helpers/http/is-streaming-content-type'
import { isXmlMediaType } from '@scalar/helpers/http/is-xml-media-type'
import { prettyPrintJson } from '@scalar/helpers/json/pretty-print-json'
import { getExampleValue, getExplicitExampleText } from '@scalar/workspace-store/helpers/get-example-value'
import { serializeStreamExample } from '@scalar/workspace-store/helpers/serialize-stream-example'
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

/** Keep the displayed response and its clipboard action on the same resolved, formatted value. */
export const getExampleContent = (
  response: MediaTypeObject | undefined,
  example: ExampleObject | undefined,
  {
    contentType = 'application/json',
    compositionSelection,
    openapiVersion,
    onDiagnostic,
  }: {
    onDiagnostic?: XmlExampleOptions['onDiagnostic']
    openapiVersion?: string
    contentType?: string
    compositionSelection?: Record<string, number>
  } = {},
): string | undefined => {
  if (isXmlMediaType(contentType)) {
    return getXmlBodyExample(response?.schema as SchemaObject | undefined, example, {
      mode: 'read',
      compositionSelection,
      emptyString: 'string',
      openapiVersion,
      onDiagnostic,
    }).xml
  }
  if (example !== undefined) {
    const selected = getExampleValue(getResolvedRefDeep(example))
    if (isStreamingContentType(contentType) && selected?.source !== 'serialized') {
      const value = selected?.value
      return value === undefined
        ? ''
        : typeof value === 'string'
          ? value
          : (serializeStreamExample(value, contentType, false) ?? JSON.stringify(value, null, 2))
    }
    const explicitText = getExplicitExampleText(selected, contentType, 2)
    if (explicitText !== undefined) {
      return explicitText
    }
    const value = selected?.value
    if (selected?.source === 'value') {
      // Keep the formatter's expansion budget for shared, resolved legacy examples.
      return prettyPrintJson((value === undefined ? '' : value) as Parameters<typeof prettyPrintJson>[0])
    }
    return typeof value === 'string' ? prettyPrintJson(value) : (JSON.stringify(value, null, 2) ?? '')
  }

  const contentSchema = response?.schema ?? response?.itemSchema
  if (contentSchema) {
    const schema = getResolvedRefDeep(contentSchema) as SchemaObject | undefined
    if (!schema) {
      return undefined
    }
    const content = getExampleFromSchema(schema, {
      emptyString: 'string',
      mode: 'read',
      compositionSelection,
    })
    if (content === undefined) {
      return undefined
    }
    // Schema generation returns unknown, but produces JSON values supported by the formatter.
    return (
      serializeStreamExample(content, contentType, response?.schema === undefined) ??
      prettyPrintJson(content as Parameters<typeof prettyPrintJson>[0])
    )
  }

  return undefined
}
