import { ERRORS } from '@/errors'
import { normalizeHeaders } from '@/libs/normalizeHeaders'
import { replaceTemplateVariables } from '@/libs/string-template'
import { textMediaTypes } from '@/views/Request/consts'
import type { Cookie } from '@scalar/oas-utils/entities/cookie'
import type {
  FetchRequest,
  Request,
  RequestExample,
  RequestExampleParameter,
  ResponseInstance,
  SecurityScheme,
  Server,
} from '@scalar/oas-utils/entities/spec'
import {
  isValidUrl,
  redirectToProxy,
  shouldUseProxy,
} from '@scalar/oas-utils/helpers'
import { safeJSON } from '@scalar/object-utils/parse'
import Cookies from 'js-cookie'
import MIMEType from 'whatwg-mimetype'

/**
 * Convert the parameters array to an object for axios to consume
 */
const paramsReducer = (params: RequestExampleParameter[] = []) =>
  params.reduce(
    (acc, param) => {
      if (!param.key) return acc
      acc[param.key] = param.value
      return acc
    },
    {} as Record<string, string>,
  )

const decodeBuffer = (buffer: ArrayBuffer, contentType: string) => {
  const type = new MIMEType(contentType)
  if (textMediaTypes.includes(type.essence)) {
    const decoder = new TextDecoder(type.parameters.get('charset'))
    const str = decoder.decode(buffer)

    if (type.subtype === 'json') return JSON.parse(str)
    else return str
  } else {
    return new Blob([buffer], { type: type.essence })
  }
}

/** Populate the headers from enabled parameters */
function createFetchHeaders(example: RequestExample, env: object) {
  const headers: NonNullable<RequestInit['headers']> = []

  example.parameters.headers.forEach((h) => {
    if (h.enabled) headers.push([h.key, replaceTemplateVariables(h.value, env)])
  })

  return headers
}

/** Populate the query parameters from the example  */
function createFetchQueryParams(example: RequestExample, env: object) {
  const params = new URLSearchParams()
  example.parameters.query.forEach((p) => {
    if (p.enabled) params.append(p.key, replaceTemplateVariables(p.value, env))
  })

  return params
}

function createFetchBody(example: RequestExample) {}

/**
 * Execute the request
 * called from the send button as well as keyboard shortcuts
 */
export async function createRequestOperation({
  request,
  example,
  server,
  securitySchemes,
  proxy,
  environment,
}: {
  request: Request
  example: RequestExample
  server: Server
  securitySchemes: Record<string, SecurityScheme>
  proxy: string
  environment: string
}) {
  const controller = new AbortController()

  // Parse the environment string
  const e = safeJSON.parse(environment)
  if (e.error) console.error('INVALID ENVIRONMENT!')
  const env = e.error || typeof e.data !== 'object' ? {} : e.data ?? {}

  // Initialize the base URL object from the active server
  const url = new URL(replaceTemplateVariables(server.url ?? '', env))

  // TODO: Should we be allow users to override path vars at a request level?
  // If so then env should be replaced with the key/value pairs from the example
  url.pathname = replaceTemplateVariables(request.path, env)
  url.search = createFetchQueryParams(example, env).toString()

  if (workspaceCookies) {
    if (!rawUrl) {
      throw new Error(ERRORS.URL_EMPTY)
    }

    try {
      new URL(rawUrl)
    } catch (error) {
      throw new Error(ERRORS.INVALID_URL)
    }

    const origin = new URL(rawUrl).host
    Object.keys(workspaceCookies).forEach((key) => {
      const c = workspaceCookies[key]
      if (!c.domain) return

      const cookieOrigin = isValidUrl(c.domain)
        ? new URL(c.domain).origin
        : c.domain

      if (cookieOrigin === origin) {
        cookies[c.name] = c.domain
      }
    })
  }

  // Add auth
  securitySchemes?.forEach((scheme) => {
    // apiKey
    if (scheme.type === 'apiKey' && scheme.value) {
      switch (scheme.in) {
        case 'cookie':
          cookies[scheme.name] = scheme.value
          break
        case 'query':
          query[scheme.name] = scheme.value
          break
        case 'header':
          headers[scheme.name] = scheme.value
          break
      }
    }
    // http
    else if (scheme.type === 'http' && scheme.value) {
      // Basic
      if (scheme.scheme === 'basic' && scheme.secondValue) {
        headers['Authorization'] =
          `Basic ${btoa(`${scheme.value}:${scheme.secondValue}`)}`
      }
      // Bearer
      else headers['Authorization'] = `Bearer ${scheme.value}`
    }
    // OAuth 2
    else if (scheme.type === 'oauth2' && scheme.flow.token)
      headers['Authorization'] = `Bearer ${scheme.flow.token}`
  })

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
   * Everything else is just ommitted.
   */
  Object.keys(cookies).forEach((key) => {
    Cookies.set(key, cookies[key], {
      // Means that the browser sends the cookie with both cross-site and same-site requests.
      sameSite: 'None',
      // The Secure attribute must also be set when setting SameSite=None.
      secure: true,
    })
  })

  // Create a new query string from the URL and given parameters
  const queryString = new URLSearchParams(query).toString()

  // Append new query string to the URL
  url = `${urlWithoutQueryString}${queryString ? '?' + queryString : ''}`

  const config: AxiosRequestConfig = {
    url: redirectToProxy(proxyUrl, url),
    method: request.method,
    responseType: 'arraybuffer',
    headers,
    signal: abortSignal,
  }

  if (data) config.data = data

  // Start timer to get response duration
  const startTime = Date.now()

  try {
    const response = await axios(config)

    if (shouldUseProxy(proxyUrl, url)) {
      // Remove headers, that are added by the proxy
      const headersToRemove = [
        'Access-Control-Allow-Headers',
        'Access-Control-Allow-Origin',
        'Access-Control-Allow-Methods',
        'Access-Control-Expose-Headers',
      ]

      headersToRemove
        .map((header) => header.toLowerCase())
        .forEach((header) => delete response.headers[header])
    }

    const buffer: ArrayBuffer = response.data

    const contentType =
      response.headers['Content-Type'] ??
      response.headers['content-type'] ??
      'text/plain;charset=UTF-8'

    const responseData = decodeBuffer(buffer, `${contentType}`)

    const responseHeaders = normalizeHeaders(response.headers)

    return {
      sentTime: Date.now(),
      request: example,
      response: {
        ...response,
        headers: responseHeaders,
        data: responseData,
        duration: Date.now() - startTime,
      },
    }
  } catch (error) {
    const axiosError = error as AxiosError
    const response = axiosError.response

    console.error('ERROR', error)

    return {
      sentTime: Date.now(),
      request: example,
      response: response
        ? {
            ...response,
            data: decodeBuffer(
              response.data as ArrayBuffer,
              'text/plain;charset=UTF-8',
            ),
            duration: Date.now() - startTime,
          }
        : undefined,
      error: axiosError,
    }
  }
}
