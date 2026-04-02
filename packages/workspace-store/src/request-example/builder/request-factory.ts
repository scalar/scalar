import { canMethodHaveBody } from '@scalar/helpers/http/can-method-have-body'
import { replacePathVariables } from '@scalar/helpers/regex/replace-variables'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { XScalarCookie } from '@scalar/workspace-store/schemas/extensions/general/x-scalar-cookies'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/operation'

import { getServerVariables } from '@/request-example/builder/helpers/get-server-variables'
import {
  type BuildRequestSecurityResult,
  buildRequestSecurity,
} from '@/request-example/builder/security/build-request-security'
import type { SecuritySchemeObjectSecret } from '@/request-example/builder/security/secret-types'
import type { RequestExampleMeta } from '@/request-example/types'

import { type RequestBody, buildRequestBody } from './body/build-request-body'
import { buildRequestParameters } from './header/build-request-parameters'

/**
 * Mutable description of an HTTP request before it is turned into a fetch `Request`.
 *
 * **Experimental:** This interface may change in minor releases; do not treat field names or nesting as stable semver.
 */
export type RequestFactory = {
  baseUrl: string
  path: {
    variables: Record<string, string>
    raw: string
  }
  method: string
  proxy: {
    proxyUrl: string
  }
  query: {
    params: URLSearchParams
  }
  headers: Headers
  body: RequestBody | null
  cookies: {
    list: XScalarCookie[]
  }
  cache: RequestCache
  security: BuildRequestSecurityResult[]
  allowedReservedQueryParameters?: Set<string>
  options?: {
    isElectron?: boolean
  }
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
  requestBodyCompositionSelection,
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
  /** The selected security schemes for the current operation */
  selectedSecuritySchemes: SecuritySchemeObjectSecret[]
  /** Selected anyOf/oneOf request-body variants keyed by schema path */
  requestBodyCompositionSelection?: Record<string, number>
}): {
  request: RequestFactory
} => {
  const requestBody = getResolvedRef(operation.requestBody)

  /** Build out the request parameters */
  const params = buildRequestParameters(operation.parameters ?? [], exampleName)
  const security = buildRequestSecurity(selectedSecuritySchemes)

  const headers = new Headers({ ...defaultHeaders, ...params.headers })

  // If the method can have a body, build the request body, otherwise set it to null
  const body = canMethodHaveBody(method)
    ? buildRequestBody(requestBody, exampleName, requestBodyCompositionSelection)
    : null

  // Delete the Content-Type header so the browser will set it automatically based on the request body
  if (body?.mode === 'formdata' || body?.mode === 'urlencoded') {
    headers.delete('Content-Type')
  }

  /** Combine the server url, path and url params into a single url */
  const serverVariables = getServerVariables(server)
  const baseUrl = replacePathVariables(server?.url ?? '', serverVariables)

  // If we are running in Electron, we need to add a custom header
  // that's then forwarded as a `User-Agent` header.
  const userAgentHeader = headers.get('User-Agent')
  if (isElectron && userAgentHeader) {
    headers.set('X-Scalar-User-Agent', userAgentHeader)
  }

  const globalCookieFilter = operation['x-scalar-disable-parameters']?.['global-cookies']?.[exampleName] ?? {}

  const cookiesList = [
    ...globalCookies.map((c) => ({
      ...c,
      isDisabled: (c.isDisabled || globalCookieFilter[c.name.toLowerCase()]) ?? false,
    })),
    ...params.cookies,
  ]

  const acceptHeader = headers.get('Accept')
  const isSseAcceptHeader = acceptHeader?.toLowerCase().includes('text/event-stream') ?? false
  const requestCacheMode: RequestCache = isSseAcceptHeader ? 'no-store' : 'default'

  if (isSseAcceptHeader) {
    headers.set('Cache-Control', 'no-cache')
    headers.set('Pragma', 'no-cache')
  }

  const request: RequestFactory = {
    baseUrl,
    proxy: {
      proxyUrl,
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
    cookies: {
      list: cookiesList,
    },
    cache: requestCacheMode,
    security,
    options: {
      isElectron,
    },
    allowedReservedQueryParameters: params.allowReservedQueryParameters,
  }

  return {
    request,
  }
}
