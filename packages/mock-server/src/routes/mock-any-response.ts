import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { getResolvedRefDeep } from '@scalar/workspace-store/helpers/get-resolved-ref-deep'
import { getExampleFromSchema } from '@scalar/workspace-store/request-example'
import type { Context } from 'hono'
import { accepts } from 'hono/accepts'
import { streamSSE } from 'hono/streaming'
import type { StatusCode } from 'hono/utils/http-status'

import { collectSseEvents, isEventStreamContentType } from '@/utils/collect-sse-events'
import { findPreferredResponseKey } from '@/utils/find-preferred-response-key'
import { normalizeResponseBody } from '@/utils/normalize-response-body'
import { parsePreferHeader } from '@/utils/parse-prefer-header'
import { selectResponseExample } from '@/utils/select-response-example'
import { serializeResponseBody } from '@/utils/serialize-response-body'

/**
 * Mock any response
 */
export function mockAnyResponse(c: Context, operation: OpenAPIV3_1.OperationObject) {
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
    const headerObject = getResolvedRef(headers[header])
    const value = headerObject?.schema
      ? (getExampleFromSchema(getResolvedRefDeep(headerObject.schema)) as string)
      : null
    if (value !== null) {
      c.header(header, value)
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
  const acceptedContentType = accepts(c, {
    header: 'Accept',
    supports: supportedContentTypes,
    default: supportedContentTypes.includes('application/json')
      ? 'application/json'
      : (supportedContentTypes[0] ?? 'text/plain;charset=UTF-8'),
  })

  c.header('Content-Type', acceptedContentType)

  const acceptedResponse = selectedResponse?.content?.[acceptedContentType]

  const responseSchema = acceptedResponse?.schema ? getResolvedRefDeep(acceptedResponse.schema) : undefined

  /** Generates the response body from the schema, or returns `undefined` when there is no schema. */
  const generateFromSchema = (): unknown =>
    responseSchema
      ? getExampleFromSchema(responseSchema, {
          emptyString: 'string',
          variables: c.req.param(),
          mode: 'read',
        })
      : undefined

  // Server-Sent Events are a framed, multi-event wire format, so they cannot go out as one buffered
  // body: a client reading the stream expects `data:` lines terminated by a blank line. Everything
  // else (JSON, XML, text) keeps taking the single-body path below.
  if (isEventStreamContentType(acceptedContentType)) {
    const events = collectSseEvents(acceptedResponse, {
      exampleName: prefer.example,
      generate: generateFromSchema,
    })

    c.status(statusCode)

    // `streamSSE` sets the transport headers itself (`Content-Type`, `Cache-Control`, `Connection`,
    // `Transfer-Encoding`), so those win over a value the document declared for the same header —
    // they are what makes the stream readable. Every other declared header set above survives.
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

  const body = selectedExample
    ? normalizeResponseBody(selectedExample.value, responseSchema)
    : responseSchema
      ? normalizeResponseBody(generateFromSchema(), responseSchema)
      : null

  c.status(statusCode)

  const serializedBody = serializeResponseBody(body, acceptedContentType, responseSchema)

  // `JSON.stringify` returns `undefined` for an `undefined` body, which is an empty response.
  if (serializedBody === undefined) {
    return c.body(null)
  }

  return c.body(serializedBody)
}
