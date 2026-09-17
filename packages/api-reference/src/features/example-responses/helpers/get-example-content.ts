import { getResolvedRefDeep } from '@scalar/blocks/code-example'
import { isStreamingMediaType } from '@scalar/helpers/http/is-streaming-media-type'
import { prettyPrintJson } from '@scalar/helpers/json/pretty-print-json'
import { serializeStreamExample } from '@scalar/workspace-store/helpers/serialize-stream-example'
import { getExampleFromSchema } from '@scalar/workspace-store/request-example'
import type {
  ExampleObject,
  MediaTypeObject,
  SchemaObject,
} from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

/** Keep the displayed response and its clipboard action on the same resolved, formatted value. */
export const getExampleContent = (
  response: MediaTypeObject | undefined,
  example: ExampleObject | undefined,
  { contentType = '' }: { contentType?: string } = {},
): string | undefined => {
  if (example !== undefined) {
    const value = getResolvedRefDeep(example)?.value
    if (isStreamingMediaType(contentType)) {
      return value === undefined
        ? ''
        : typeof value === 'string'
          ? value
          : serializeStreamExample(value, contentType, false)
    }
    return prettyPrintJson(value ?? '')
  }

  const schema = response?.schema ?? response?.itemSchema
  if (schema) {
    const content = getExampleFromSchema(getResolvedRefDeep(schema) as SchemaObject, {
      emptyString: 'string',
      mode: 'read',
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
