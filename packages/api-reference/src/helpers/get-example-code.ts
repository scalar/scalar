import { buildRequestSecurity } from '@scalar/api-client/libs/send-request'
import { cookieSchema } from '@scalar/oas-utils/entities/cookie'
import type {
  Operation,
  RequestExample,
  SecurityScheme,
  Server,
} from '@scalar/oas-utils/entities/spec'
import {
  type ClientId as SnippetzClientId,
  type TargetId as SnippetzTargetId,
  snippetz,
} from '@scalar/snippetz'

import { convertToHarRequest } from './convert-to-har-request'

export type TargetId = SnippetzTargetId
export type ClientId<T extends SnippetzTargetId> = SnippetzClientId<T>

const EMPTY_TOKEN_PLACEHOLDER = 'YOUR_SECRET_TOKEN'

/**
 * Returns a code example for given operation
 */
export async function getExampleCode<T extends SnippetzTargetId>(
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
  const harRequest = await convertToHarRequest({
    baseUrl: server?.url,
    method: operation.method,
    path: operation.path,
    body: example.body,
    cookies,
    headers,
    query,
  })

  // TODO: Fix this, use js (instead of javascript) everywhere
  const snippetzTargetKey = target?.replace(
    'javascript',
    'js',
  ) as SnippetzTargetId

  if (snippetz().hasPlugin(snippetzTargetKey, client)) {
    return snippetz().print(
      snippetzTargetKey,
      client as SnippetzClientId<typeof target>,
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
