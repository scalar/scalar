import { json2xml } from '@scalar/helpers/file/json2xml'
import { getExampleFromSchema } from '@scalar/oas-utils/spec-getters'
import type { OpenAPI, OpenAPIV3_1 } from '@scalar/openapi-types'
import type { Context } from 'hono'
import { accepts } from 'hono/accepts'
import type { StatusCode } from 'hono/utils/http-status'

import type { MockServerOptions } from '@/types'
import { findPreferredResponseKey } from '@/utils/find-preferred-response-key'

/**
 * Mock any response
 */
export function mockAnyResponse(c: Context, operation: OpenAPI.Operation, options: MockServerOptions) {
  // Call onRequest callback
  if (options?.onRequest) {
    options.onRequest({
      context: c,
      operation,
    })
  }

  // Response
  // default, 200, 201 …
  const preferredResponseKey = findPreferredResponseKey(Object.keys(operation.responses ?? {}))
  const preferredResponse = preferredResponseKey ? operation.responses?.[preferredResponseKey] : null

  if (!preferredResponse) {
    c.status(500)

    return c.json({ error: 'No response defined for this operation.' })
  }

  // Status code
  const statusCode = Number.parseInt(
    preferredResponseKey === 'default' ? '200' : (preferredResponseKey ?? '200'),
    10,
  ) as StatusCode

  // Headers
  const headers =
    typeof preferredResponse === 'object' && 'headers' in preferredResponse ? (preferredResponse.headers ?? {}) : {}
  Object.keys(headers).forEach((header) => {
    const value =
      typeof headers[header] === 'object' && 'schema' in headers[header]
        ? getExampleFromSchema(headers[header].schema as OpenAPIV3_1.SchemaObject)
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

  const supportedContentTypes =
    typeof preferredResponse === 'object' && 'content' in preferredResponse
      ? Object.keys(preferredResponse.content ?? {})
      : []

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

  const acceptedResponse =
    typeof preferredResponse === 'object' && 'content' in preferredResponse
      ? preferredResponse.content?.[acceptedContentType]
      : null

  const example =
    typeof acceptedResponse === 'object' && acceptedResponse && 'example' in acceptedResponse
      ? acceptedResponse?.example
      : null

  const schema =
    typeof acceptedResponse === 'object' && acceptedResponse && 'schema' in acceptedResponse
      ? acceptedResponse.schema
      : null

  // Body
  const body = example
    ? example
    : schema
      ? getExampleFromSchema(schema, {
          emptyString: 'string',
          variables: c.req.param(),
          mode: 'read',
        })
      : null

  c.status(statusCode)

  return c.body(
    typeof body === 'object'
      ? // XML
        acceptedContentType?.includes('xml')
        ? json2xml(body)
        : // JSON
          JSON.stringify(body, null, 2)
      : // String
        body,
  )
}
