import { ERRORS, type ErrorResponse, normalizeError } from '@/libs/errors'
import type { EventBus } from '@/libs/event-bus'
import { normalizeHeaders } from '@/libs/normalize-headers'
import { createFetchBody } from '@/libs/send-request/create-fetch-body'
import { createFetchHeaders } from '@/libs/send-request/create-fetch-headers'
import { createFetchQueryParams } from '@/libs/send-request/create-fetch-query-params'
import { decodeBuffer } from '@/libs/send-request/decode-buffer'
import { getCookieHeader, setRequestCookies } from '@/libs/send-request/set-request-cookies'
import { replaceTemplateVariables } from '@/libs/string-template'
import type { PluginManager } from '@/plugins'
import type { Cookie } from '@scalar/oas-utils/entities/cookie'
import type {
  Operation,
  RequestExample,
  ResponseInstance,
  SecurityScheme,
  Server,
} from '@scalar/oas-utils/entities/spec'

import { isElectron } from '@/libs/electron'
import { httpStatusCodes, isDefined, mergeUrls, redirectToProxy, shouldUseProxy } from '@scalar/oas-utils/helpers'
import { buildRequestSecurity } from './build-request-security'

export type RequestStatus = 'start' | 'stop' | 'abort'

/** Response from sendRequest hoisted so we can use it as the return type for createRequestOperation */
type SendRequestResponse = Promise<
  ErrorResponse<{
    response: ResponseInstance
    request: RequestExample
    timestamp: number
  }>
>

export type SendRequestResult = Awaited<SendRequestResponse>[1]

/** Execute the request */
export const createRequestOperation = ({
  environment,
  example,
  globalCookies,
  proxyUrl,
  request,
  securitySchemes,
  selectedSecuritySchemeUids = [],
  server,
  status,
  pluginManager,
}: {
  environment: object | undefined
  example: RequestExample
  globalCookies: Cookie[]
  proxyUrl: string | undefined
  request: Operation
  securitySchemes: Record<string, SecurityScheme>
  selectedSecuritySchemeUids?: Operation['selectedSecuritySchemeUids']
  server?: Server | undefined
  status?: EventBus<RequestStatus>
  pluginManager?: PluginManager
}): ErrorResponse<{
  controller: AbortController
  sendRequest: () => SendRequestResponse
  request: Request
}> => {
  try {
    const env = environment ?? {}
    const controller = new AbortController()

    /** Parsed and evaluated values for path parameters */
    const pathVariables = example.parameters.path.reduce<Record<string, string>>((vars, param) => {
      if (param.enabled) {
        vars[param.key] = replaceTemplateVariables(param.value, env)
      }

      return vars
    }, {})

    const serverString = replaceTemplateVariables(server?.url ?? '', env)
    // Replace environment variables, then path variables
    const pathString = replaceTemplateVariables(replaceTemplateVariables(request.path, env), pathVariables)

    /**
     * Start building the main URL, we cannot use the URL class yet as it does not work with relative servers
     * Also handles the case of no server with pathString
     */
    let url = serverString || pathString

    // Handle empty url
    if (!url) {
      throw ERRORS.URL_EMPTY
    }

    // lets set the server variables
    // for now we only support default values
    Object.entries(server?.variables ?? {}).forEach(([k, v]) => {
      url = replaceTemplateVariables(url, {
        [k]: pathVariables[k] || v.default,
      })
    })

    const _urlParams = createFetchQueryParams(example, env, request)
    const _headers = createFetchHeaders(example, env)
    const { body } = createFetchBody(request.method, example, env)
    const { cookieParams: _cookieParams } = setRequestCookies({
      example,
      env,
      globalCookies,
      serverUrl: url,
      proxyUrl,
    })

    // We flatten the array of arrays for complex auth
    const flatSelectedSecuritySchemeUids = selectedSecuritySchemeUids.flat()
    const selectedSecuritySchemes = flatSelectedSecuritySchemeUids.map((uid) => securitySchemes[uid]).filter(isDefined)

    // Grab the security headers, cookies and url params
    const security = buildRequestSecurity(selectedSecuritySchemes, env)

    // For securityheaders, we lowercase them so they can be uppercased later (in normalizeHeaders)
    const normalizedSecurityHeaders = Object.entries(security.headers).reduce<Record<string, string>>(
      (acc, [key, value]) => {
        acc[key.toLowerCase()] = value
        return acc
      },
      {},
    )

    // Populate all forms of auth to the request segments
    const headers = { ...normalizedSecurityHeaders, ..._headers }
    const cookieParams = [..._cookieParams, ...security.cookies]
    const urlParams = new URLSearchParams([..._urlParams, ...security.urlParams])

    // If we are running in Electron, we need to add a custom header
    // that's then forwarded as a `User-Agent` header.
    if (isElectron() && headers['user-agent']) {
      headers['X-Scalar-User-Agent'] = headers['user-agent']
    }

    // Combine the url with the path and server + query params
    url = mergeUrls(url, pathString, urlParams)

    /** Cookie header */
    const cookieHeader = replaceTemplateVariables(getCookieHeader(cookieParams, headers['Cookie']), env)

    if (cookieHeader) {
      /**
       * If we are running in Electron, we need to add a custom header
       * that's then forwarded as a `Cookie` header.
       */
      const useCustomCookieHeader = isElectron() || shouldUseProxy(proxyUrl, url)

      // Add a custom header for the proxy (that's then forwarded as `Cookie`)
      if (useCustomCookieHeader) {
        console.warn(
          "We're using a `X-Scalar-Cookie` custom header to the request. The proxy will forward this as a `Cookie` header. We do this to avoid the browser omitting the `Cookie` header for cross-origin requests for security reasons.",
        )

        headers['X-Scalar-Cookie'] = cookieHeader
      }
      // or stick to the original header (which might be removed by the browser)
      else {
        console.warn(
          `We're trying to add a Cookie header, but browsers often omit them for cross-origin requests for various security reasons. If it's not working, that's probably why. Here are the requirements for it to work:

          - The browser URL must be on the same domain as the server URL.
          - The connection must be made over HTTPS.
          `,
        )

        headers['Cookie'] = cookieHeader
      }
    }

    const proxiedUrl = redirectToProxy(proxyUrl, url)

    const proxiedRequest = new Request(proxiedUrl, {
      method: request.method.toUpperCase(),
      body: body ?? null,
      headers,
    })

    const sendRequest = async (): Promise<
      ErrorResponse<{
        response: ResponseInstance
        request: RequestExample
        timestamp: number
      }>
    > => {
      status?.emit('start')

      if (pluginManager) {
        pluginManager.executeHook('onBeforeRequest', { request: proxiedRequest })
      }

      // Start timer to get response duration
      const startTime = Date.now()

      try {
        const response = await fetch(proxiedRequest, {
          signal: controller.signal,
        })

        /**
         * Checks if the response is streaming
         * Unfortunately we cannot check the transfer-encoding header as it is not set by the browser so not quite sure how to test when
         * content-type === 'text/plain' and transfer-encoding === 'chunked'
         *
         * Currently we are only checking for server sent events. In OpenApi 3.2.0 streams will be added to the spec
         */
        const isStreaming = response.headers.get('content-type')?.startsWith('text/event-stream')
        status?.emit('stop')

        const duration = Date.now() - startTime

        // Clone the response before reading it
        const responseToRead = response.clone()

        const responseHeaders = normalizeHeaders(response.headers, shouldUseProxy(proxyUrl, url))
        const responseType = response.headers.get('content-type') ?? 'text/plain;charset=UTF-8'

        const arrayBuffer = await responseToRead.arrayBuffer()
        const responseData = decodeBuffer(arrayBuffer, responseType)

        // Create a new response with the statusText
        const clonedResponse = response.clone()

        // This is missing in HTTP/2 requests. But we need it for the post-clonedResponse scripts.
        const statusText = clonedResponse.statusText || httpStatusCodes[clonedResponse.status]?.name || ''

        // Skip the body when creating the normalized response if the status is 204, 205, 304
        const shouldSkipBody = [204, 205, 304].includes(clonedResponse.status)

        const normalizedResponse = new Response(!shouldSkipBody ? clonedResponse.body : null, {
          status: clonedResponse.status,
          statusText,
          headers: clonedResponse.headers,
        })

        if (pluginManager) {
          pluginManager.executeHook('onResponseReceived', { response: normalizedResponse, operation: request })
        }

        // Safely check for cookie headers
        // TODO: polyfill
        const cookieHeaderKeys =
          'getSetCookie' in normalizedResponse.headers && typeof normalizedResponse.headers.getSetCookie === 'function'
            ? normalizedResponse.headers.getSetCookie()
            : []

        // We want to return the response so that it can be streamed
        if (isStreaming && response.body) {
          return [
            null,
            {
              timestamp: Date.now(),
              request: example,
              response: {
                ...normalizedResponse,
                headers: responseHeaders,
                cookieHeaderKeys,
                reader: response.body?.getReader(),
                duration,
                method: request.method,
                path: pathString,
              },
            },
          ]
        }

        return [
          null,
          {
            timestamp: Date.now(),
            request: example,
            response: {
              ...response,
              headers: responseHeaders,
              cookieHeaderKeys,
              data: responseData,
              size: arrayBuffer.byteLength,
              duration: Date.now() - startTime,
              method: request.method,
              status: response.status,
              path: pathString,
            },
          },
        ]
      } catch (e) {
        status?.emit('abort')
        return [normalizeError(e, ERRORS.REQUEST_FAILED), null]
      }
    }

    return [
      null,
      {
        request: proxiedRequest,
        sendRequest,
        controller,
      },
    ]
  } catch (e) {
    console.error(e)
    status?.emit('abort')
    return [normalizeError(e), null]
  }
}
