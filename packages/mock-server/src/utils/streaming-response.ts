import { isStreamingMediaType } from '@scalar/helpers/http/is-streaming-media-type'
import type { OpenAPIV3_2 } from '@scalar/openapi-types'
import { getResolvedRefDeep } from '@scalar/workspace-store/helpers/get-resolved-ref-deep'
import { serializeStreamExample } from '@scalar/workspace-store/helpers/serialize-stream-example'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import type { Context } from 'hono'
import { stream } from 'hono/streaming'

import { generateResponseExample } from './generate-response-example'
import { selectResponseExample } from './select-response-example'

/** A finite mock stream, with its data-model value available to custom handlers. */
type StreamingResponse = {
  body: unknown
  chunks: string[]
  contentType: string
}

/**
 * Build a finite response for media types with an OpenAPI 3.2 itemSchema.
 * Explicit examples describe the whole response. Generated item-only streams contain three items,
 * keeping array-valued items intact. A complete schema controls the sequence when also present.
 */
export const getStreamingResponse = (
  mediaType:
    | (Omit<OpenAPIV3_2.MediaTypeObject, 'itemSchema'> & {
        itemSchema?: OpenAPIV3_2.MediaTypeObject['itemSchema'] | boolean
      })
    | undefined,
  contentType: string,
  options: { exampleName?: string; variables?: Record<string, unknown>; body?: unknown } = {},
): StreamingResponse | undefined => {
  if (mediaType?.itemSchema === undefined) {
    return undefined
  }
  if (!isStreamingMediaType(contentType)) {
    return undefined
  }

  const example =
    options.body !== undefined ? { value: options.body } : selectResponseExample(mediaType, options.exampleName)
  if (example && typeof example.value === 'string') {
    return { body: example.value, chunks: [example.value], contentType }
  }

  const itemSchema =
    typeof mediaType.itemSchema === 'boolean' ? mediaType.itemSchema : getResolvedRefDeep(mediaType.itemSchema)
  const completeSchema = typeof mediaType.schema === 'boolean' ? mediaType.schema : getResolvedRefDeep(mediaType.schema)
  const generateBody = (): unknown => {
    if (itemSchema === false || completeSchema === false) {
      return []
    }
    if (completeSchema === undefined) {
      return Array.from({ length: 3 }, () =>
        itemSchema === true
          ? null
          : generateResponseExample(coerceValue(SchemaObjectSchema, itemSchema), options.variables),
      )
    }
    if (typeof completeSchema === 'object' && 'type' in completeSchema && completeSchema.type === 'array') {
      return generateResponseExample(
        coerceValue(SchemaObjectSchema, {
          ...completeSchema,
          items: ('items' in completeSchema ? completeSchema.items : undefined) ?? itemSchema,
        }),
        options.variables,
      )
    }
    return generateResponseExample(coerceValue(SchemaObjectSchema, completeSchema), options.variables)
  }
  const body = example ? example.value : generateBody()
  const items = body === undefined ? [] : Array.isArray(body) ? body : [body]
  const chunks = items
    .filter((item) => item !== undefined)
    .map((item) => serializeStreamExample(item, contentType, true) ?? '')
  return { body, chunks, contentType }
}

/** Write each mocked item separately and close the stream when the finite sequence is exhausted. */
export const sendStreamingResponse = (c: Context, response: StreamingResponse): Response => {
  c.header('Content-Type', response.contentType)
  c.header('Cache-Control', 'no-cache')
  c.header('X-Accel-Buffering', 'no')
  return stream(c, async (writer) => {
    for (const chunk of response.chunks) {
      if (writer.aborted) {
        break
      }
      await writer.write(chunk)
    }
  })
}
