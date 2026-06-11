import { json2xml } from '@scalar/helpers/file/json2xml'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { getResolvedRefDeep } from '@scalar/workspace-store/helpers/get-resolved-ref-deep'
import { getExampleFromSchema } from '@scalar/workspace-store/request-example'
import type { Context } from 'hono'
import { accepts } from 'hono/accepts'
import type { StatusCode } from 'hono/utils/http-status'

import { findPreferredResponseKey } from '@/utils/find-preferred-response-key'
import { parsePreferHeader } from '@/utils/parse-prefer-header'
import { selectResponseExample } from '@/utils/select-response-example'

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

  // Status code
  const statusCode = Number.parseInt(responseKey === 'default' ? '200' : (responseKey ?? '200'), 10) as StatusCode

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

  // Body: a named/singular/first example if one is defined, otherwise generate
  // a value from the schema. `Prefer: example=<name>` picks a named example.
  const selectedExample = selectResponseExample(acceptedResponse, prefer.example)

  const body = selectedExample
    ? selectedExample.value
    : acceptedResponse?.schema
      ? getExampleFromSchema(getResolvedRefDeep(acceptedResponse.schema), {
          emptyString: 'string',
          variables: c.req.param(),
          mode: 'read',
        })
      : null

  c.status(statusCode)

  return c.body(
    // `null` is `typeof 'object'` too, but it is not a valid XML/JSON object
    // root — serialize it (and any non-string primitive) with `JSON.stringify`
    // so a `null` example does not get fed into `json2xml`.
    body !== null && typeof body === 'object'
      ? // XML
        acceptedContentType?.includes('xml')
        ? json2xml(body as Record<string, unknown>)
        : // JSON
          JSON.stringify(body, null, 2)
      : typeof body === 'string'
        ? // String
          body
        : // null / number / boolean
          JSON.stringify(body),
  )
}
