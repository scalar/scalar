import { canMethodHaveBody } from '@scalar/helpers/http/can-method-have-body'
import { shouldUseProxy } from '@scalar/helpers/url/redirect-to-proxy'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { XScalarCookie } from '@scalar/workspace-store/schemas/extensions/general/x-scalar-cookies'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/operation'

import {
  type BuildRequestSecurityResult,
  buildRequestSecurity,
} from '@/request-example/builder/security/build-request-security'
import type { SecuritySchemeObjectSecret } from '@/request-example/builder/security/secret-types'
import type { RequestExampleMeta, Result } from '@/request-example/types'

import { type RequestBody, buildRequestBody } from './body/build-request-body'
import { buildRequestCookieHeader } from './header/build-request-cookie-header'
import { buildRequestParameters } from './header/build-request-parameters'
import { getResolvedUrl } from './helpers/get-resolved-url'

export type RequestFactory = {
  url: string
  method: string
  proxy: {
    proxyUrl: string
    isUsingProxy: boolean
  }
  path: {
    variables: Record<string, string>
    raw: string
  }
  query: {
    params: URLSearchParams
  }
  headers: Headers
  body: RequestBody | null
  cookies: { name: string; value: string }[] | null
  cache: RequestCache
  security: BuildRequestSecurityResult[]
}

/**
 * Builds a request object fastory which can be used to build a request object.
 * @returns A request object factory
 */
export const requestFactory = ({
  exampleName,
  globalCookies,
  method,
  operation,
  path,
  proxyUrl,
  server,
  defaultHeaders,
  isElectron,
  selectedSecuritySchemes,
}: RequestExampleMeta & {
  /** The operation object */
  operation: OperationObject
  /** For environment variables in the inputs */
  environment: XScalarEnvironment
  /** Workspace + document cookies */
  globalCookies: XScalarCookie[]
  /** The proxy URL for cookie domain determination */
  proxyUrl: string
  /** The server object */
  server: ServerObject | null
  /** Default headers */
  defaultHeaders: Record<string, string>
  /** Whether the request is being made from an Electron environment */
  isElectron: boolean
  // /** The selected security schemes for the current operation */
  selectedSecuritySchemes: SecuritySchemeObjectSecret[]
}): Result<{
  request: RequestFactory
}> => {
  const requestBody = getResolvedRef(operation.requestBody)

  /** Build out the request parameters */
  const params = buildRequestParameters(operation.parameters ?? [], exampleName)
  const security = buildRequestSecurity(selectedSecuritySchemes)

  const headers = new Headers({ ...defaultHeaders, ...params.headers })

  // If the method can have a body, build the request body, otherwise set it to null
  const body = canMethodHaveBody(method) ? buildRequestBody(requestBody, exampleName) : null

  // Delete the Content-Type header so the browser will set it automatically based on the request body
  if (body?.mode === 'formdata' || body?.mode === 'urlencoded') {
    headers.delete('Content-Type')
  }

  // TODO: handle url params differently

  /** Combine the server url, path and url params into a single url */
  const url = getResolvedUrl({
    server,
    path,
    allowReservedQueryParameters: params.allowReservedQueryParameters,
  })

  // Return error for no url
  if (!url) {
    return { ok: false, error: 'URL is empty' }
  }

  const isUsingProxy = shouldUseProxy(proxyUrl, url)

  // If we are running in Electron, we need to add a custom header
  // that's then forwarded as a `User-Agent` header.
  const userAgentHeader = headers.get('User-Agent')
  if (isElectron && userAgentHeader) {
    headers.set('X-Scalar-User-Agent', userAgentHeader)
  }

  /** Build out the cookies header */
  const cookiesHeader = buildRequestCookieHeader({
    paramCookies: [
      ...params.cookies,
      ...security.filter((s) => s.in === 'cookie').map((s) => ({ name: s.name, value: s.value, path: '/' })),
    ],
    globalCookies,
    originalCookieHeader: headers.get('Cookie'),
    url,
    useCustomCookieHeader: isElectron || isUsingProxy,
    disabledGlobalCookies: operation['x-scalar-disable-parameters']?.['global-cookies']?.[exampleName] ?? {},
  })

  if (cookiesHeader) {
    headers.set(cookiesHeader.name, cookiesHeader.value)
  }

  const acceptHeader = headers.get('Accept')
  const isSseAcceptHeader = acceptHeader?.toLowerCase().includes('text/event-stream') ?? false
  const requestCacheMode: RequestCache = isSseAcceptHeader ? 'no-store' : 'default'

  if (isSseAcceptHeader) {
    headers.set('Cache-Control', 'no-cache')
    headers.set('Pragma', 'no-cache')
  }

  const request: RequestFactory = {
    url,
    proxy: {
      proxyUrl,
      isUsingProxy,
    },
    path: {
      variables: params.pathVariables,
      raw: path,
    },
    query: {
      params: params.urlParams,
    },
    method: method.toUpperCase(),
    headers,
    body,
    cookies: cookiesHeader ? [cookiesHeader] : null,
    cache: requestCacheMode,
    security,
  }

  return {
    ok: true,
    data: { request },
  }
}
