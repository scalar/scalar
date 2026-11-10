import { isXmlMediaType } from '@scalar/helpers/http/is-xml-media-type'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { getResolvedRefDeep } from '@scalar/workspace-store/helpers/get-resolved-ref-deep'
import { getExampleFromSchema, getXmlBodyExample } from '@scalar/workspace-store/request-example'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import type { Context } from 'hono'
import { streamSSE } from 'hono/streaming'
import type { StatusCode } from 'hono/utils/http-status'

import { collectSseEvents, isEventStreamContentType } from '@/utils/collect-sse-events'
import { findPreferredResponseKey } from '@/utils/find-preferred-response-key'
import { generateResponseExample } from '@/utils/generate-response-example'
import { isSettableResponseHeader } from '@/utils/is-settable-response-header'
import { negotiateContentType } from '@/utils/negotiate-content-type'
import { normalizeResponseBody } from '@/utils/normalize-response-body'
import { parsePreferHeader } from '@/utils/parse-prefer-header'
import { pathParameters } from '@/utils/path-parameters'
import { selectResponseExample } from '@/utils/select-response-example'
import { serializeResponseBody } from '@/utils/serialize-response-body'
import { getStreamingResponse, sendStreamingResponse } from '@/utils/streaming-response'

/** These fields are owned by the response serializer and transport, never the API description. */
const IGNORED_RESPONSE_HEADERS = new Set([
  'content-length',
  'content-encoding',
  'content-type',
  'transfer-encoding',
  'trailer',
  'connection',
  'keep-alive',
  'upgrade',
  'te',
  'proxy-connection',
])

/**
 * Mock any response
 */
export function mockAnyResponse(c: Context, operation: OpenAPIV3_1.OperationObject, openapiVersion?: string) {
  // Note: the `onRequest` callback runs as middleware (see `create-mock-server`) so it also fires
  // for requests rejected before reaching this handler.

  // Parse the Prefer header (RFC 7240) so clients can request a specific
  // response status (`code=`) and named example (`example=`).
  const prefer = parsePreferHeader(c.req.header('Prefer'))

  // Response selection:
  // 1. An explicit `Prefer: code=<status>` that matches a defined response
  // 2. Otherwise the preferred key (default, 200, 201 …)
  // An unknown `code=` is ignored and falls back to the preferred key.
  const preferredResponseKey = findPreferredResponseKey(Object.keys(operation.responses ?? {}))
  const responseKey = prefer.code && operation.responses?.[prefer.code] ? prefer.code : preferredResponseKey

  const selectedResponse = responseKey ? getResolvedRef(operation.responses?.[responseKey]) : null

  if (!selectedResponse) {
    c.status(500)

    return c.json({ error: 'No response defined for this operation.' })
  }

  // Status code. `default` and range patterns like `2XX` map to their lowest concrete code (e.g. 200).
  const statusCode = Number.parseInt(
    responseKey && responseKey !== 'default' ? responseKey.replace(/XX$/i, '00') : '200',
    10,
  ) as StatusCode

  // Headers
  const headers = selectedResponse?.headers ?? {}
  Object.keys(headers).forEach((header) => {
    // The body and transport determine these headers. Generated values can truncate a response or
    // make clients decode uncompressed data; OpenAPI also requires ignoring declared Content-Type.
    if (IGNORED_RESPONSE_HEADERS.has(header.toLowerCase())) {
      return
    }

    const headerObject = getResolvedRef(headers[header])
    // Headers use the generator defaults to preserve their declared values.
    const value = headerObject?.schema ? getExampleFromSchema(getResolvedRefDeep(headerObject.schema)) : null
    // Loose check on purpose: Hono *deletes* a header when handed `undefined`. This loop is the first
    // thing to set the declared headers, so in practice a delete removes a header set earlier by
    // middleware — `cors()` sets `Access-Control-Allow-Origin` before the handler runs.
    if (value != null) {
      try {
        const text = String(value)
        if (isSettableResponseHeader(header, text)) {
          c.header(header, text)
          return
        }
      } catch {
        // An authored object can also shadow toString and prevent string conversion.
      }
      console.warn(`Skipping invalid response header ${JSON.stringify(header)} from the API description.`)
    }
  })

  // For 204 No Content responses, we should not set Content-Type and should return null body
  if (statusCode === 204) {
    c.status(statusCode)
    return c.body(null)
  }

  const supportedContentTypes = Object.keys(selectedResponse?.content ?? {})

  // If no content types are defined, return the status with no body
  if (supportedContentTypes.length === 0) {
    c.status(statusCode)
    return c.body(null)
  }

  // Content-Type
  const acceptedContentType = negotiateContentType(c, selectedResponse.content)

  c.header('Content-Type', acceptedContentType)

  const acceptedResponse = selectedResponse?.content?.[acceptedContentType]

  const streamingResponse = getStreamingResponse(acceptedResponse, acceptedContentType, {
    exampleName: prefer.example,
    variables: pathParameters(c),
  })
  if (streamingResponse) {
    c.status(statusCode)
    return sendStreamingResponse(c, streamingResponse)
  }

  const responseSchema = acceptedResponse?.schema ? getResolvedRefDeep(acceptedResponse.schema) : undefined

  /** Generates the response body from the schema, or returns `undefined` when there is no schema. */
  const generateFromSchema = (): unknown =>
    responseSchema ? generateResponseExample(responseSchema, pathParameters(c)) : undefined

  // Server-Sent Events are a framed, multi-event wire format, so they cannot go out as one buffered
  // body: a client reading the stream expects `data:` lines terminated by a blank line. Everything
  // else (JSON, XML, text) keeps taking the single-body path below.
  if (isEventStreamContentType(acceptedContentType)) {
    const events = collectSseEvents(acceptedResponse, {
      exampleName: prefer.example,
      generate: generateFromSchema,
    })

    c.status(statusCode)

    // Transport headers are never copied from the API description. `streamSSE` adds the framing
    // and cache policy needed for an event stream; ordinary custom headers survive.
    return streamSSE(c, async (stream) => {
      for (const event of events) {
        if (event.framed) {
          await stream.write(event.text)
        } else {
          await stream.writeSSE({ data: event.text })
        }
      }
    })
  }

  // Body: a named/singular/first example if one is defined, otherwise generate
  // a value from the schema. `Prefer: example=<name>` picks a named example.
  const selectedExample = selectResponseExample(acceptedResponse, prefer.example)

  c.status(statusCode)

  if (isXmlMediaType(acceptedContentType)) {
    const result = getXmlBodyExample(acceptedResponse?.schema as SchemaObject | undefined, selectedExample, {
      openapiVersion,
      emptyString: 'string',
      variables: pathParameters(c),
      mode: 'read',
    })
    const error = result.diagnostics.find((diagnostic) => diagnostic.severity === 'error')
    if (error) {
      c.header('X-Scalar-XML-Error', error.code)
    }
    return result.xml === undefined ? c.body(null) : c.body(result.xml)
  }

  const provenance = selectedExample?.provenance
  const body = ((): unknown => {
    if (selectedExample) {
      return provenance ? selectedExample.value : normalizeResponseBody(selectedExample.value, responseSchema)
    }
    if (!responseSchema) {
      return null
    }
    const generated = generateFromSchema()
    // Schema-level examples are authored values too, so retain their array normalization.
    if (
      responseSchema.example !== undefined ||
      (Array.isArray(responseSchema.examples) && responseSchema.examples.length)
    ) {
      return normalizeResponseBody(generated, responseSchema)
    }
    // The generator already chooses the value shape, including root union branches.
    // Re-inferring it from sibling items would wrap a selected primitive in an array.
    return generated
  })()

  const serializedBody = serializeResponseBody(body, acceptedContentType, responseSchema, provenance)

  // `JSON.stringify` returns `undefined` for an `undefined` body, which is an empty response.
  if (serializedBody === undefined) {
    return c.body(null)
  }

  return c.body(serializedBody)
}
