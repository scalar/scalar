import { ERRORS, type ErrorResponse, normalizeError } from '@/libs/errors'
import type { EventBus } from '@/libs/event-bus'
import { normalizeHeaders } from '@/libs/normalize-headers'
import { replaceTemplateVariables } from '@/libs/string-template'
import { textMediaTypes } from '@/views/Request/consts'
import type { Cookie } from '@scalar/oas-utils/entities/cookie'
import type {
  Request,
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
import type {
  Cookie as HarCookie,
  Header as HarHeader,
  QueryString as HarQueryString,
  Request as HarRequest,
} from '@scalar/types/external'
import Cookies from 'js-cookie'
import MimeTypeParser from 'whatwg-mimetype'

export type RequestStatus = 'start' | 'stop' | 'abort'

// TODO: This should return `unknown` to acknowledge we don’t know the type, shouldn’t it?
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
  proxy,
}: {
  example: RequestExample
  env: object
  globalCookies: Cookie[]
  domain: string
  proxy?: string
}) {
  let _domain: string | undefined

  try {
    _domain = new URL(proxy || domain).host
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
function addHttpProtocol(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  // Default to http if no protocol is specified
  return `http://${url}`
}

/**
 * Prepares a fetch request with authentication, security schemes, and environment variables
 */
export const createRequestOperation = ({
  request,
  example,
  server,
  securitySchemes,
  selectedSecuritySchemeUids = [],
  proxy,
  status,
  environment,
  globalCookies,
}: {
  request: Request
  example: RequestExample
  selectedSecuritySchemeUids?: string[]
  proxy?: string
  status?: EventBus<RequestStatus>
  environment: object | undefined
  server?: Server
  securitySchemes: Record<string, SecurityScheme>
  globalCookies: Cookie[]
}): ErrorResponse<{
  controller: AbortController
  sendRequest: () => SendRequestResponse
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
      proxy,
    })

    // Populate all forms of auth to the request segments
    selectedSecuritySchemeUids?.forEach((uid) => {
      const scheme = securitySchemes[uid]
      if (!scheme) return

      // Scheme type and example value type should always match
      if (scheme.type === 'apiKey') {
        const value = replaceTemplateVariables(scheme.value, env)
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

          headers['Authorization'] = `Basic ${btoa(value)}`
        } else {
          const value = replaceTemplateVariables(scheme.token, env)
          headers['Authorization'] = `Bearer ${value}`
        }
      }

      // For OAuth we take the token from the first flow
      if (scheme.type === 'oauth2') {
        const flows = Object.values(scheme.flows)
        const token = flows.find((f) => f.token)?.token
        if (!token) return

        headers['Authorization'] = `Bearer ${token}`
      }
    })

    /**
     * Create a URL by combining server URL, path, and query parameters
     */
    const createUrl = () => {
      // Extract and merge all query params
      if (url && (!isRelativePath(url) || typeof window !== 'undefined')) {
        /** Prefix the url with the origin if it is relative */
        const base = isRelativePath(url)
          ? concatenateUrlAndPath(window.location.origin, url)
          : addHttpProtocol(url)

        /** We create a separate server URL to snag any search params from the server */
        const serverUrl = new URL(base)
        /** We create a separate path URL to grab the path params */
        const pathUrl = new URL(pathString, serverUrl.origin)

        /** Finally we combine the two but make sure that we keep the path from server */
        const combinedURL = new URL(serverUrl)

        if (server?.url) {
          if (serverUrl.pathname === '/') combinedURL.pathname = pathString
          else combinedURL.pathname = serverUrl.pathname + pathString
        }

        // Combines all query params
        combinedURL.search = new URLSearchParams([
          ...serverUrl.searchParams,
          ...pathUrl.searchParams,
          ...urlParams,
        ]).toString()

        return combinedURL.toString()
      }

      return url
    }

    /**
     * Create fetch options including method, body and headers.
     * This is used to configure the actual fetch request that will be sent.
     */
    const createFetchOptions = () => {
      return {
        method: request.method.toUpperCase(),
        body,
        headers,
      }
    }

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
        const fullUrl = createUrl()
        const proxiedUrl = createProxiedUrl(fullUrl, proxy)
        const fetchOptions = createFetchOptions()

        const response = await fetch(proxiedUrl, {
          signal: controller.signal,
          ...fetchOptions,
        })

        status?.emit('stop')

        const responseHeaders = normalizeHeaders(
          response.headers,
          shouldUseProxy(proxy, fullUrl),
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
        sendRequest,
        controller,
      },
    ]
  } catch (e) {
    status?.emit('abort')
    return [normalizeError(e), null]
  }
}

/**
 * Convert a fetch request options object into a HAR request format
 */
export function convertFetchOptionsToHarRequest(
  url: string,
  options?: RequestInit,
): HarRequest {
  const headers: HarHeader[] = []
  const cookies: HarCookie[] = []
  const queryString: HarQueryString[] = []

  // Convert headers
  if (options?.headers) {
    if (options?.headers instanceof Headers) {
      options?.headers.forEach((value, name) => {
        headers.push({ name, value })
      })
    } else if (Array.isArray(options?.headers)) {
      options?.headers.forEach(([name, value]) => {
        headers.push({ name, value })
      })
    } else {
      Object.entries(options?.headers).forEach(([name, value]) => {
        headers.push({ name, value: String(value) })
      })
    }
  }

  return {
    method: options?.method || 'GET',
    url,
    httpVersion: 'HTTP/1.1',
    cookies,
    headers,
    queryString,
    headersSize: -1,
    bodySize: options?.body ? String(options?.body).length : 0,
  }
}

/**
 * Create a proxied URL by combining the proxy URL with the target URL.
 *
 * Returns the original URL, if the proxy is not provided or not needed.
 */
const createProxiedUrl = (url: string, proxy?: string) => {
  const proxyPath = new URLSearchParams([['scalar_url', url.toString()]])

  return shouldUseProxy(proxy, url) ? `${proxy}?${proxyPath.toString()}` : url
}
