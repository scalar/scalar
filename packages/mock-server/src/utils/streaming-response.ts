import { parseMimeType } from '@scalar/helpers/http/mime-type'
import { isObject } from '@scalar/helpers/object/is-object'
import type { OpenAPIV3_1, OpenAPIV3_2 } from '@scalar/openapi-types'
import { getResolvedRefDeep } from '@scalar/workspace-store/helpers/get-resolved-ref-deep'
import type { Context } from 'hono'
import { stream } from 'hono/streaming'

import { type ExampleSchema, generateResponseExample } from './generate-response-example'
import { selectResponseExample } from './select-response-example'

/** A finite mock stream, with its data-model value available to custom handlers. */
type StreamingResponse = {
  body: unknown
  chunks: string[]
  contentType: string
}

/** Serialize the parsed SSE fields described by an OpenAPI 3.2 item schema. */
const serializeEvent = (item: unknown): string => {
  if (!isObject(item)) {
    return ''
  }
  const lines = ['event', 'id', 'retry', 'data'].flatMap((field) => {
    const value = item[field]
    if (field === 'retry') {
      return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? [`retry: ${value}`] : []
    }
    if (typeof value !== 'string' || (field === 'id' && value.includes('\0'))) {
      return []
    }
    if (field === 'data') {
      return value.split(/\r\n|\r|\n/).map((line) => `data: ${line}`)
    }
    return /[\r\n]/.test(value) ? [] : [`${field}: ${value}`]
  })
  return lines.length ? `${lines.join('\n')}\n\n` : ''
}

/**
 * Build a finite response for media types with an OpenAPI 3.2 itemSchema.
 * Explicit examples describe the whole response. Generated item-only streams contain three items,
 * keeping array-valued items intact. A complete schema controls the sequence when also present.
 */
export const getStreamingResponse = (
  mediaType:
    | (OpenAPIV3_1.MediaTypeObject & { itemSchema?: OpenAPIV3_2.MediaTypeObject['itemSchema'] | boolean })
    | undefined,
  contentType: string,
  options: { exampleName?: string; variables?: Record<string, unknown>; body?: unknown } = {},
): StreamingResponse | undefined => {
  if (mediaType?.itemSchema === undefined) {
    return undefined
  }
  const { essence, subtype } = parseMimeType(contentType)
  const isSse = essence === 'text/event-stream'
  const isJsonSequence = subtype === 'json-seq' || subtype.endsWith('+json-seq')
  if (!isSse && !isJsonSequence && essence !== 'application/jsonl' && essence !== 'application/x-ndjson') {
    return undefined
  }

  const example =
    options.body !== undefined ? { value: options.body } : selectResponseExample(mediaType, options.exampleName)
  if (example && typeof example.value === 'string') {
    return { body: example.value, chunks: [example.value], contentType }
  }

  const itemSchema = getResolvedRefDeep(mediaType.itemSchema) as ExampleSchema | boolean
  const completeSchema =
    mediaType.schema === undefined ? undefined : (getResolvedRefDeep(mediaType.schema) as ExampleSchema | boolean)
  const generateBody = (): unknown => {
    if (itemSchema === false || completeSchema === false) {
      return []
    }
    if (completeSchema === undefined) {
      return Array.from({ length: 3 }, () => generateResponseExample(itemSchema as ExampleSchema, options.variables))
    }
    if (typeof completeSchema === 'object' && 'type' in completeSchema && completeSchema.type === 'array') {
      return generateResponseExample(
        {
          ...completeSchema,
          items: ('items' in completeSchema ? completeSchema.items : undefined) ?? itemSchema,
        } as ExampleSchema,
        options.variables,
      )
    }
    return generateResponseExample(completeSchema as ExampleSchema, options.variables)
  }
  const body = example ? example.value : generateBody()
  const items = body === undefined ? [] : Array.isArray(body) ? body : [body]
  const chunks = items
    .filter((item) => item !== undefined)
    .map((item) => (isSse ? serializeEvent(item) : `${isJsonSequence ? '\u001e' : ''}${JSON.stringify(item)}\n`))
  return { body, chunks, contentType }
}

/** Write each mocked item separately and close the stream when the finite sequence is exhausted. */
export const sendStreamingResponse = (c: Context, response: StreamingResponse): Response => {
  c.header('Content-Type', response.contentType)
  c.header('Cache-Control', 'no-cache')
  return stream(c, async (writer) => {
    for (const chunk of response.chunks) {
      if (writer.aborted) {
        break
      }
      await writer.write(chunk)
    }
  })
}
