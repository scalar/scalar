import { canMethodHaveBody } from '@scalar/helpers/http/can-method-have-body'
import { replaceEnvVariables } from '@scalar/helpers/regex/replace-variables'
import { mergeUrls } from '@scalar/helpers/url/merge-urls'
import { redirectToProxy, shouldUseProxy } from '@scalar/helpers/url/redirect-to-proxy'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { XScalarCookie } from '@scalar/workspace-store/schemas/extensions/general/x-scalar-cookies'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/operation'
import { encode } from 'js-base64'

import {
  type BuildRequestSecurityResult,
  buildRequestSecurity,
} from '@/request-example/builder/security/build-request-security'
import type { SecuritySchemeObjectSecret } from '@/request-example/builder/security/secret-types'
import type { RequestExampleMeta, Result } from '@/request-example/types'

import { type RequestBody, buildRequestBody } from './body/build-request-body'
import { buildRequestCookieHeader } from './header/build-request-cookie-header'
import { buildRequestParameters } from './header/build-request-parameters'

type RequestFactory = {
  url: string
  method: string
  proxy: {
    proxiedUrl: string
    isUsingProxy: boolean
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
export const requestFactoryBuilder = ({
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

  const headers = new Headers({ ...defaultHeaders, ...params.headers }) // ...security.headers

  // If the method can have a body, build the request body, otherwise set it to null
  const body = canMethodHaveBody(method) ? buildRequestBody(requestBody, exampleName) : null

  // Delete the Content-Type header so the browser will set it automatically based on the request body
  if (body?.mode === 'formdata' || body?.mode === 'urlencoded') {
    headers.delete('Content-Type')
  }

  /** Combine the server url, path and url params into a single url */
  // const url = getResolvedUrl({ environment, server, path, pathVariables: params.pathVariables, urlParams })

  const url = mergeUrls(server?.url ?? '', path, params.urlParams)

  // Return error for no url
  if (!url) {
    return { ok: false, error: 'URL is empty' }
  }

  const isUsingProxy = shouldUseProxy(proxyUrl, url)
  const proxiedUrl = redirectToProxy(proxyUrl, url)

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
      ...security.filter((s) => s.in === 'cookie').map((s) => ({ name: s.name, value: s.value })),
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
      proxiedUrl,
      isUsingProxy,
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

export const getRequestFromBuilder = (
  request: RequestFactory,
  options: {
    envVariables: Record<string, string>
    serverVariables: Record<string, string>
  },
) => {
  const controller = new AbortController()

  const requestUrl = (() => {
    const variables = { ...options.envVariables, ...options.serverVariables }
    if (request.proxy.isUsingProxy) {
      return replaceEnvVariables(request.proxy.proxiedUrl, variables)
    }
    return replaceEnvVariables(request.url, variables)
  })()

  const headers = (() => {
    const variables = { ...options.envVariables }

    const headersObject = Object.fromEntries(
      Object.entries(request.headers).map(([key, value]) => [
        replaceEnvVariables(key, variables),
        replaceEnvVariables(value, variables),
      ]),
    )

    return new Headers(headersObject)
  })()

  const body: BodyInit | null = (() => {
    const variables = { ...options.envVariables }
    if (request.body?.mode === 'raw') {
      if (typeof request.body.value === 'string') {
        return replaceEnvVariables(request.body.value, variables)
      }
      return request.body.value
    }

    if (request.body?.mode === 'formdata') {
      const form = new FormData()

      request.body.value.forEach((item) => {
        if (item.type === 'text') {
          form.append(replaceEnvVariables(item.key, variables), replaceEnvVariables(item.value, variables))
          return
        }
        form.append(replaceEnvVariables(item.key, variables), item.value)
      })
      return form
    }

    if (request.body?.mode === 'urlencoded') {
      return new URLSearchParams(
        request.body.value.map((item) => [
          replaceEnvVariables(item.key, variables),
          replaceEnvVariables(item.value, variables),
        ]),
      )
    }

    return null
  })()

  const urlParams = new URLSearchParams()

  // Build the request security
  request.security.forEach((security) => {
    if (security.in === 'header') {
      // Build the value for the header
      const value = (() => {
        if (security.type === 'basic') {
          return `Basic ${encode(security.value)}`
        }

        if (security.type === 'bearer') {
          return `Bearer ${security.value}`
        }

        return security.value
      })()

      // Set the header
      headers.set(security.name, value)
      return
    }

    if (security.in === 'query') {
      urlParams.append(security.name, security.value)
      return
    }

    if (security.in === 'cookie') {
      // Skip the cookie header, should already be set in the request object header
      return
    }
  })

  return new Request(requestUrl, {
    /**
     * Ensure that all methods are uppercased (though only needed for patch)
     *
     * @see https://github.com/whatwg/fetch/issues/50
     */
    method: request.method.toUpperCase(),
    headers,
    body,
    cache: request.cache,
    signal: controller.signal,
  })
}
