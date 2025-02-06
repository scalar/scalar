import { buildRequestSecurity } from '@/libs'
import { convertToHarRequest } from '@/libs/convert-to-har-request'
import type {
  Operation,
  RequestExample,
  SecurityScheme,
  Server,
} from '@scalar/oas-utils/entities/spec'
import type { HarRequest } from '@scalar/snippetz'

const EMPTY_TOKEN_PLACEHOLDER = 'YOUR_SECRET_TOKEN'

/**
 * Creates a snippetz-compatible HarRequest from OpenAPI-like store entities
 */
export function getHarRequest(props: {
  operation?: Operation
  example?: RequestExample
  server?: Server | undefined
  securitySchemes?: SecurityScheme[]
}): HarRequest {
  const { operation, example, server, securitySchemes = [] } = props

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
