import { ERRORS, type ErrorResponse, normalizeError } from '@/libs/errors'
import type { EventBus } from '@/libs/event-bus'
import { normalizeHeaders } from '@/libs/normalize-headers'
import { replaceTemplateVariables } from '@/libs/string-template'
import { textMediaTypes } from '@/views/Request/consts'
import type { Cookie } from '@scalar/oas-utils/entities/cookie'
import type {
  /** Renamed due to conflict with the global Request class */
  Request as HarRequest,
  RequestExample,
  RequestMethod,
  ResponseInstance,
  SecurityScheme,
  Server,
} from '@scalar/oas-utils/entities/spec'
import {
  canMethodHaveBody,
  concatenateUrlAndPath,
  isRelativePath,
  shouldUseProxy,
} from '@scalar/oas-utils/helpers'
import Cookies from 'js-cookie'
import MimeTypeParser from 'whatwg-mimetype'

export type RequestStatus = 'start' | 'stop' | 'abort'

// TODO: This should return `unknown` to acknowledge we don’t know type, shouldn’t it?
/** Decode the buffer according to its content-type */
export function decodeBuffer(buffer: ArrayBuffer, contentType: string) {
  const mimeType = new MimeTypeParser(contentType)

  if (textMediaTypes.includes(mimeType.essence)) {
    const decoder = new TextDecoder(mimeType.parameters.get('charset'))
    const string = decoder.decode(buffer)

    // Text
    return string
  }

  // Binary
  return new Blob([buffer], { type: mimeType.essence })
}

/** Populate the headers from enabled parameters */
export function createFetchHeaders(
  example: Pick<RequestExample, 'parameters'>,
  env: object,
) {
  const headers: NonNullable<RequestInit['headers']> = {}

  example.parameters.headers.forEach((h) => {
    const lowerCaseKey = h.key.trim().toLowerCase()

    // Ensure we remove the mutlipart/form-data header so fetch can properly set boundaries
    if (
      h.enabled &&
      (lowerCaseKey !== 'content-type' || h.value !== 'multipart/form-data')
    )
      headers[lowerCaseKey] = replaceTemplateVariables(h.value, env)
  })

  return headers
}

/** Populate the query parameters from the example  */
export function createFetchQueryParams(
  example: Pick<RequestExample, 'parameters'>,
  env: object,
) {
  const params = new URLSearchParams()
  example.parameters.query.forEach((p) => {
    if (p.enabled && p.value)
      params.append(p.key, replaceTemplateVariables(p.value, env))
  })

  return params
}

/** Set all cookie params and workspace level cookies that are applicable */
export function setRequestCookies({
  example,
  env,
  globalCookies,
  domain,
  proxyUrl,
}: {
  example: RequestExample
  env: object
  globalCookies: Cookie[]
  domain: string
  proxyUrl?: string
}) {
  let _domain: string | undefined

  try {
    _domain = new URL(proxyUrl || domain).host
  } catch (e) {
    if (typeof window !== 'undefined') _domain = window.location.host
  }

  /**
   * Cross-origin cookies are hard.
   *
   * - Axios needs to have `withCredentials: true`
   * - We can only send cookies to the same domain (client.scalar.com -> proxy.scalar.com)
   * - Subdomains are okay.
   * - The target URL must have https.
   * - The proxy needs to have a few headers:
   *   1) Access-Control-Allow-Credentials: true
   *   2) Access-Control-Allow-Origin: client.scalar.com (not *)
   *
   * Everything else is just omitted.
   */
  const cookieParams = {
    // Must point all cookies to the proxy and let it sort them out
    domain: _domain,
    // Means that the browser sends the cookie with both cross-site and same-site requests.
    sameSite: 'None',
    // The Secure attribute must also be set when setting SameSite=None.
    secure: true,
  } as const

  const allCookies = Cookies.get()
  Object.keys(allCookies).forEach((c) => Cookies.remove(c))

  example.parameters.cookies.forEach((c) => {
    if (c.enabled) Cookies.set(c.key, replaceTemplateVariables(c.value, env))
  })

  globalCookies.forEach((c) => {
    const { name: key, value, ...params } = c

    // We only attach global cookies relevant to the current domain
    // Subdomains are matched as well
    const hasDomainMatch =
      params.domain === domain ||
      (params.domain?.startsWith('.') && domain.endsWith(params.domain ?? ''))

    if (hasDomainMatch) {
      Cookies.set(key, value, {
        /** Override the domain with the proxy value */
        domain: _domain,
        // TODO: path cookies probably don't worth with the proxy
        path: params.path,
        expires: params.expires ? new Date(params.expires) : undefined,
        httpOnly: params.httpOnly,
        secure: params.secure,
      })
    }
  })

  return {
    cookieParams,
  }
}

/**
 * Create the fetch request body from an example
 *
 * TODO: Should we be setting the content type headers here?
 * If so we must allow the user to override the content type header
 */
export function createFetchBody(
  method: RequestMethod,
  example: RequestExample,
  env: object,
) {
  if (!canMethodHaveBody(method))
    return { body: undefined, contentType: undefined }

  if (example.body.activeBody === 'formData' && example.body.formData) {
    const contentType =
      example.body.formData.encoding === 'form-data'
        ? 'multipart/form-data'
        : 'application/x-www-form-urlencoded'

    const form =
      example.body.formData.encoding === 'form-data'
        ? new FormData()
        : new URLSearchParams()

    // Build formData
    example.body.formData.value.forEach((entry) => {
      if (!entry.enabled || !entry.key) return

      // File upload
      if (entry.file && form instanceof FormData)
        form.append(entry.key, entry.file, entry.file.name)
      // Text input with variable replacement
      else if (entry.value !== undefined)
        form.append(entry.key, replaceTemplateVariables(entry.value, env))
    })
    return { body: form, contentType }
  }

  if (example.body.activeBody === 'raw') {
    return {
      body: replaceTemplateVariables(example.body.raw?.value ?? '', env),
      contentType: example.body.raw?.encoding,
    }
  }

  if (example.body.activeBody === 'binary') {
    return {
      body: example.body.binary,
      contentType: example.body.binary?.type,
    }
  }

  return {
    body: undefined,
    contentType: undefined,
  }
}

/** Response from sendRequest hoisted so we can use it as the return type for createRequestOperation */
type SendRequestResponse = Promise<
  ErrorResponse<{
    response: ResponseInstance
    request: RequestExample
    timestamp: number
  }>
>

/** Ensure URL has a protocol prefix */
function ensureProtocol(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  // Default to http if no protocol is specified
  return `http://${url}`
}

/** For the examples mostly */
const EMPTY_TOKEN_PLACEHOLDER = 'YOUR_SECRET_TOKEN'

/** Execute the request */
export const createRequestOperation = ({
  request,
  example,
  server,
  securitySchemes,
  selectedSecuritySchemeUids = [],
  proxyUrl,
  status,
  environment,
  globalCookies,
}: {
  request: HarRequest
  example: RequestExample
  selectedSecuritySchemeUids?: string[]
  proxyUrl?: string
  status?: EventBus<RequestStatus>
  environment: object | undefined
  server?: Server
  securitySchemes: Record<string, SecurityScheme>
  globalCookies: Cookie[]
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
      url = replaceTemplateVariables(url, { [k]: v.default })
    })

    const urlParams = createFetchQueryParams(example, env)
    const headers = createFetchHeaders(example, env)
    const { body } = createFetchBody(request.method, example, env)
    setRequestCookies({
      example,
      env,
      globalCookies,
      domain: url,
      proxyUrl,
    })

    // Populate all forms of auth to the request segments
    selectedSecuritySchemeUids?.forEach((uid) => {
      const scheme = securitySchemes[uid]
      if (!scheme) return

      // Scheme type and example value type should always match
      if (scheme.type === 'apiKey') {
        const value =
          replaceTemplateVariables(scheme.value, env) || EMPTY_TOKEN_PLACEHOLDER

        if (scheme.in === 'header') headers[scheme.name] = value
        if (scheme.in === 'query') urlParams.append(scheme.name, value)
        if (scheme.in === 'cookie') {
          Cookies.set(scheme.name, value)
          // Not sure if this one works yet
          // Cookies.set(exampleAuth.name, value, cookieParams)
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

    // Extract and merge all query params
    if (url && (!isRelativePath(url) || typeof window !== 'undefined')) {
      /** Prefix the url with the origin if it is relative */
      const base = isRelativePath(url)
        ? concatenateUrlAndPath(window.location.origin, url)
        : ensureProtocol(url)

      /** We create a separate server URL to snag any search params from the server */
      const serverURL = new URL(base)
      /** We create a separate path URL to grab the path params */
      const pathURL = new URL(pathString, serverURL.origin)

      /** Finally we combine the two but make sure that we keep the path from server */
      const combinedURL = new URL(serverURL)
      if (server?.url) {
        if (serverURL.pathname === '/') combinedURL.pathname = pathString
        else combinedURL.pathname = serverURL.pathname + pathString
      }

      // Combines all query params
      combinedURL.search = new URLSearchParams([
        ...serverURL.searchParams,
        ...pathURL.searchParams,
        ...urlParams,
      ]).toString()

      url = combinedURL.toString()
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
