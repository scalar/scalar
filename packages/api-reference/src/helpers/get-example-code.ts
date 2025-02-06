import { convertToHarRequest } from '@/helpers/convert-to-har-request'
import { buildRequestSecurity } from '@scalar/api-client/libs/send-request'
import type {
  Operation,
  RequestExample,
  SecurityScheme,
  Server,
} from '@scalar/oas-utils/entities/spec'
import { type ClientId, type TargetId, snippetz } from '@scalar/snippetz'

const EMPTY_TOKEN_PLACEHOLDER = 'YOUR_SECRET_TOKEN'

/**
 * Returns a code example for given operation
 */
export function getExampleCode<T extends TargetId>(
  operation: Operation,
  example: RequestExample,
  target: TargetId | string,
  client: ClientId<T> | string,
  server: Server | undefined,
  securitySchemes: SecurityScheme[] = [],
) {
  // Grab the security headers, cookies and url params
  const security = buildRequestSecurity(
    securitySchemes,
    {},
    EMPTY_TOKEN_PLACEHOLDER,
  )

  // Merge the security headers, cookies and query with example parameters
  const headers = [
    ...example.parameters.headers,
    ...Object.entries(security.headers).map(([key, value]) => ({
      key,
      value,
      enabled: true,
    })),
  ]
  const cookies = [
    ...example.parameters.cookies,
    ...security.cookies.map((cookie) => ({
      key: cookie.name,
      value: cookie.value,
      enabled: true,
    })),
  ]

  const query = [
    ...example.parameters.query,
    ...Array.from(security.urlParams.entries()).map(([key, value]) => ({
      key,
      value,
      enabled: true,
    })),
  ]

  // Convert request to HarRequest
  const harRequest = convertToHarRequest({
    baseUrl: server?.url,
    method: operation.method,
    path: operation.path,
    body: example.body,
    cookies,
    headers,
    query,
  })

  // TODO: Fix this, use js (instead of javascript) everywhere
  const snippetzTargetKey = target?.replace('javascript', 'js') as TargetId

  if (snippetz().hasPlugin(snippetzTargetKey, client)) {
    return snippetz().print(
      snippetzTargetKey,
      client as ClientId<TargetId>,
      harRequest,
    )
  }

  // Prevent snippet generation if starting by a variable
  // TODO: how do I get to this state?
  // if (request.url.startsWith('__')) {
  //   return request.url
  // }

  return ''
}
