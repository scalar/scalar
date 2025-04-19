import { getExampleFromSchema } from '@scalar/oas-utils/spec-getters'
import type { OpenAPI } from '@scalar/openapi-types'
import type { Context } from 'hono'
import { accepts } from 'hono/accepts'
import type { StatusCode } from 'hono/utils/http-status'
// @ts-expect-error Doesn’t come with types
import objectToXML from 'object-to-xml'

import type { MockServerOptions } from '@/types.ts'
import { findPreferredResponseKey } from '@/utils/findPreferredResponseKey.ts'

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

  const supportedContentTypes = Object.keys(preferredResponse?.content ?? {})

  // Headers
  const headers = preferredResponse?.headers ?? {}
  Object.keys(headers).forEach((header) => {
    const value = headers[header].schema ? getExampleFromSchema(headers[header].schema) : null
    if (value !== null) {
      c.header(header, value)
    }
  })

  // Content-Type
  const acceptedContentType = accepts(c, {
    header: 'Accept',
    supports: supportedContentTypes,
    default: supportedContentTypes.includes('application/json')
      ? 'application/json'
      : (supportedContentTypes[0] ?? 'text/plain;charset=UTF-8'),
  })

  c.header('Content-Type', acceptedContentType)

  const acceptedResponse = preferredResponse?.content?.[acceptedContentType]

  // Body
  const body = acceptedResponse?.example
    ? acceptedResponse.example
    : acceptedResponse?.schema
      ? getExampleFromSchema(acceptedResponse.schema, {
          emptyString: 'string',
          variables: c.req.param(),
          mode: 'read',
        })
      : null

  // Status code
  const statusCode = Number.parseInt(
    preferredResponseKey === 'default' ? '200' : (preferredResponseKey ?? '200'),
    10,
  ) as StatusCode

  c.status(statusCode)

  return c.body(
    typeof body === 'object'
      ? // XML
        acceptedContentType?.includes('xml')
        ? `<?xml version="1.0" encoding="UTF-8"?>${objectToXML(body)}`
        : // JSON
          JSON.stringify(body, null, 2)
      : // String
        body,
  )
}
