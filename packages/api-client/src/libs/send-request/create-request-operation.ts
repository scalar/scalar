import { ERRORS, type ErrorResponse, normalizeError } from '@/libs/errors'
import type { EventBus } from '@/libs/event-bus'
import { normalizeHeaders } from '@/libs/normalize-headers'
import { createFetchBody } from '@/libs/send-request/create-fetch-body'
import { createFetchHeaders } from '@/libs/send-request/create-fetch-headers'
import { createFetchQueryParams } from '@/libs/send-request/create-fetch-query-params'
import { decodeBuffer } from '@/libs/send-request/decode-buffer'
import {
  getCookieHeader,
  setRequestCookies,
} from '@/libs/send-request/set-request-cookies'
import { replaceTemplateVariables } from '@/libs/string-template'
import type { Cookie } from '@scalar/oas-utils/entities/cookie'
import type {
  Operation,
  RequestExample,
  ResponseInstance,
  SecurityScheme,
  Server,
} from '@scalar/oas-utils/entities/spec'
import { mergeUrls, shouldUseProxy } from '@scalar/oas-utils/helpers'

export type RequestStatus = 'start' | 'stop' | 'abort'

/** Response from sendRequest hoisted so we can use it as the return type for createRequestOperation */
type SendRequestResponse = Promise<
  ErrorResponse<{
    response: ResponseInstance
    request: RequestExample
    timestamp: number
  }>
>

/** For the examples mostly */
const EMPTY_TOKEN_PLACEHOLDER = 'YOUR_SECRET_TOKEN'

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
}: {
  environment: object | undefined
  example: RequestExample
  globalCookies: Cookie[]
  proxyUrl?: string
  request: Operation
  securitySchemes: Record<string, SecurityScheme>
  selectedSecuritySchemeUids?: Operation['selectedSecuritySchemeUids']
  server?: Server
  status?: EventBus<RequestStatus>
}): ErrorResponse<{
  controller: AbortController
  sendRequest: () => SendRequestResponse
  request: Request
}> => {
  try {
    const env = environment ?? {}
    const controller = new AbortController()

    /** Parsed and evaluated values for path parameters */
    const pathVariables = example.parameters.path.reduce<
      Record<string, string>
    >((vars, param) => {
      if (param.enabled)
        vars[param.key] = replaceTemplateVariables(param.value, env)

      return vars
    }, {})

    const serverString = replaceTemplateVariables(server?.url ?? '', env)
    const pathString = replaceTemplateVariables(request.path, pathVariables)

    /**
     * Start building the main URL, we cannot use the URL class yet as it does not work with relative servers
     * Also handles the case of no server with pathString
     */
    let url = serverString || pathString

    // Handle empty url
    if (!url) throw ERRORS.URL_EMPTY

    // lets set the server variables
    // for now we only support default values
    Object.entries(server?.variables ?? {}).forEach(([k, v]) => {
      url = replaceTemplateVariables(url, {
        [k]: pathVariables[k] || v.default,
      })
    })

    const urlParams = createFetchQueryParams(example, env)
    const headers = createFetchHeaders(example, env)
    const { body } = createFetchBody(request.method, example, env)
    const { cookieParams } = setRequestCookies({
      example,
      env,
      globalCookies,
      serverUrl: url,
      proxyUrl,
    })

    // We flatten the array of arrays for complex auth
    const flatSelectedSecuritySchemeUids = selectedSecuritySchemeUids.flat()

    // Populate all forms of auth to the request segments
    flatSelectedSecuritySchemeUids?.forEach((uid) => {
      const scheme = securitySchemes[uid]
      if (!scheme) return

      // Scheme type and example value type should always match
      if (scheme.type === 'apiKey') {
        const value =
          replaceTemplateVariables(scheme.value, env) || EMPTY_TOKEN_PLACEHOLDER

        if (scheme.in === 'header') headers[scheme.name] = value
        if (scheme.in === 'query') urlParams.append(scheme.name, value)
        if (scheme.in === 'cookie') {
          cookieParams.push({
            name: scheme.name,
            value,
            path: '/',
            uid: scheme.name,
          })
        }
      }

      if (scheme.type === 'http') {
        if (scheme.scheme === 'basic') {
          const username = replaceTemplateVariables(scheme.username, env)
          const password = replaceTemplateVariables(scheme.password, env)
          const value = `${username}:${password}`

          headers['Authorization'] =
            `Basic ${value === ':' ? 'username:password' : btoa(value)}`
        } else {
          const value = replaceTemplateVariables(scheme.token, env)
          headers['Authorization'] =
            `Bearer ${value || EMPTY_TOKEN_PLACEHOLDER}`
        }
      }

      // For OAuth we take the token from the first flow
      if (scheme.type === 'oauth2') {
        const flows = Object.values(scheme.flows)
        const token = flows.find((f) => f.token)?.token

        headers['Authorization'] = `Bearer ${token || EMPTY_TOKEN_PLACEHOLDER}`
      }
    })

    // Combine the url with the path and server + query params
    url = mergeUrls(url, pathString, urlParams)
    console.log('url', url)

    /** Cookie header */
    const cookieHeader = replaceTemplateVariables(
      getCookieHeader(cookieParams, headers['Cookie']),
      env,
    )

    if (cookieHeader) {
      // Add a custom header for the proxy (that’s then forwarded as `Cookie`)
      if (shouldUseProxy(proxyUrl, url)) {
        console.warn(
          'We’re using a `X-Scalar-Cookie` custom header to the request. The proxy will forward this as a `Cookie` header. We do this to avoid the browser omitting the `Cookie` header for cross-origin requests for security reasons.',
        )

        headers['X-Scalar-Cookie'] = cookieHeader
      }
      // or stick to the original header (which might be removed by the browser)
      else {
        console.warn(
          `We’re trying to add a Cookie header, but browsers often omit them for cross-origin requests for various security reasons. If it’s not working, that’s probably why. Here are the requirements for it to work:

          - The browser URL must be on the same domain as the server URL.
          - The connection must be made over HTTPS.
          `,
        )

        headers['Cookie'] = cookieHeader
      }
    }

    const proxyPath = new URLSearchParams([['scalar_url', url.toString()]])
    const proxiedUrl = shouldUseProxy(proxyUrl, url)
      ? `${proxyUrl}?${proxyPath.toString()}`
      : url

    const proxiedRequest = new Request(proxiedUrl, {
      method: request.method.toUpperCase(),
      body,
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

      // Start timer to get response duration
      const startTime = Date.now()

      try {
        const response = await fetch(proxiedRequest, {
          signal: controller.signal,
        })

        status?.emit('stop')

        const responseHeaders = normalizeHeaders(
          response.headers,
          shouldUseProxy(proxyUrl, url),
        )
        const responseType =
          response.headers.get('content-type') ?? 'text/plain;charset=UTF-8'

        const arrayBuffer = await response.arrayBuffer()
        const responseData = decodeBuffer(arrayBuffer, responseType)

        // Safely check for cookie headers
        // TODO: polyfill
        const cookieHeaderKeys =
          'getSetCookie' in response.headers &&
          typeof response.headers.getSetCookie === 'function'
            ? response.headers.getSetCookie()
            : []

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
