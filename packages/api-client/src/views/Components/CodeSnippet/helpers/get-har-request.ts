import { buildRequestSecurity } from '@/libs/send-request/build-request-security'
import type {
  Operation,
  RequestExample,
  SecurityScheme,
  Server,
} from '@scalar/oas-utils/entities/spec'
import type { HarRequest } from '@scalar/snippetz'

import { convertToHarRequest } from './convert-to-har-request'

const EMPTY_TOKEN_PLACEHOLDER = 'YOUR_SECRET_TOKEN'

/**
 * Creates a snippetz-compatible HarRequest from OpenAPI-like store entities
 */
export const getHarRequest = ({
  operation,
  example,
  server,
  securitySchemes = [],
}: {
  operation: Operation | undefined
  example: RequestExample | undefined
  server: Server | undefined
  securitySchemes?: SecurityScheme[]
}): HarRequest => {
  // Grab the security headers, cookies and url params
  const security = buildRequestSecurity(
    securitySchemes,
    {},
    EMPTY_TOKEN_PLACEHOLDER,
  )

  // Merge the security headers, cookies and query with example parameters
  const headers = [
    ...(example?.parameters.headers ?? []),
    ...Object.entries(security.headers).map(([key, value]) => ({
      key,
      value,
      enabled: true,
    })),
  ]
  const cookies = [
    ...(example?.parameters.cookies ?? []),
    ...security.cookies.map((cookie) => ({
      key: cookie.name,
      value: cookie.value,
      enabled: true,
    })),
  ]

  const query = [
    ...(example?.parameters.query ?? []),
    ...Array.from(security.urlParams.entries()).map(([key, value]) => ({
      key,
      value,
      enabled: true,
    })),
  ]

  // Converts it to a snippetz-compatible HarRequest
  return convertToHarRequest({
    baseUrl: server?.url,
    method: operation?.method ?? 'get',
    path: operation?.path ?? '/',
    body: example?.body,
    cookies,
    headers,
    query,
  })
}
