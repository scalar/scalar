import { isXmlMediaType } from '@scalar/helpers/http/is-xml-media-type'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { getResolvedRefDeep } from '@scalar/workspace-store/helpers/get-resolved-ref-deep'
import { getXmlBodyExample } from '@scalar/workspace-store/request-example'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import type { Context } from 'hono'
import { streamSSE } from 'hono/streaming'
import type { StatusCode } from 'hono/utils/http-status'

import { collectSseEvents, isEventStreamContentType } from '@/utils/collect-sse-events'
import { findPreferredResponseKey } from '@/utils/find-preferred-response-key'
import { type ExampleGenerationContext, generateResponseExample } from '@/utils/generate-response-example'
import { getResponseHeaderExample, usesOpenApi32HeaderExamples } from '@/utils/get-response-header-example'
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
export function mockAnyResponse(
  c: Context,
  operation: OpenAPIV3_1.OperationObject,
  generationContext: ExampleGenerationContext = {},
) {
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
    const name = header.toLowerCase()
    // The body and transport determine these headers. Generated values can truncate a response or
    // make clients decode uncompressed data; OpenAPI also requires ignoring declared Content-Type.
    if (IGNORED_RESPONSE_HEADERS.has(name)) {
      return
    }

    try {
      const example = getResponseHeaderExample(headers[header], generationContext, name)
      // Passing undefined to Hono would delete a header already set by middleware such as cors().
      if (example === undefined) {
        return
      }
      // OpenAPI 3.2 models separate Set-Cookie fields as one cookie per line.
      const append = name === 'set-cookie' && usesOpenApi32HeaderExamples(generationContext)
      const values = Array.isArray(example) ? example : [example]
      const fields = append && typeof example === 'string' ? example.split(/\r?\n/).filter(Boolean) : values
      if (fields.length && fields.every((value) => isSettableResponseHeader(header, value))) {
        for (const value of fields) {
          c.header(header, value, { append })
        }
        return
      }
    } catch {
      // An authored value may fail serialization, for example if it shadows its own toString.
    }
    console.warn(`Skipping invalid response header ${JSON.stringify(header)} from the API description.`)
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
    ...generationContext,
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
    responseSchema ? generateResponseExample(responseSchema, pathParameters(c), generationContext) : undefined

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
      ...generationContext,
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
