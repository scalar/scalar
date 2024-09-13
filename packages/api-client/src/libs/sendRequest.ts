import { ERRORS } from '@/libs'
import { normalizeHeaders } from '@/libs/normalizeHeaders'
import { textMediaTypes } from '@/views/Request/consts'
import type { Cookie } from '@scalar/oas-utils/entities/workspace/cookie'
import type { SecurityScheme } from '@scalar/oas-utils/entities/workspace/security'
import type {
  FileType,
  Request,
  RequestExample,
  RequestExampleParameter,
  ResponseInstance,
} from '@scalar/oas-utils/entities/workspace/spec'
import {
  isValidUrl,
  redirectToProxy,
  shouldUseProxy,
} from '@scalar/oas-utils/helpers'
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

/** Take the response and decode it */
const parseFetchResponseData = async (response: Response) => {
  const buffer: ArrayBuffer = await response.arrayBuffer()

  const contentType =
    response.headers.get('Content-Type') ??
    response.headers.get('content-type') ??
    'text/plain;charset=UTF-8'

  return decodeBuffer(buffer, contentType)
}

/** Parse and format response headers into an object with cookie keys */
const parseResponseHeaders = (
  response: Response,
  removeProxyHeaders = false,
) => {
  // Convert to an object
  const responseHeaders = Array.from(response.headers.keys()).reduce<
    Record<string, string>
  >((prev, key) => {
    const value = response.headers.get(key)
    if (value) prev[key] = value
    return prev
  }, {})

  // Remove headers, that are added by the proxy
  if (removeProxyHeaders) {
    const headersToRemove = [
      'Access-Control-Allow-Headers',
      'Access-Control-Allow-Origin',
      'Access-Control-Allow-Methods',
      'Access-Control-Expose-Headers',
    ]

    headersToRemove
      .map((header) => header.toLowerCase())
      .forEach((header) => delete responseHeaders[header])
  }

  const cookieHeaderKeys = response.headers.getSetCookie()
  return { cookieHeaderKeys, responseHeaders }
}

/**
 * Execute the request
 * called from the send button as well as keyboard shortcuts
 */
export const sendRequest = async (
  request: Request,
  example: RequestExample,
  rawUrl: string,
  securitySchemes?: SecurityScheme[],
  proxyUrl?: string,
  workspaceCookies?: Record<string, Cookie>,
  abortSignal?: AbortSignal,
): Promise<{
  sentTime: number
  request: RequestExample
  response?: ResponseInstance
  error?: Error
}> => {
  let url = rawUrl

  // Replace path variables
  // Example: https://example.com/{path} -> https://example.com/example
  // TODO: This replaces variables in the URL, not just in the path
  example.parameters.path.forEach((parameter: RequestExampleParameter) => {
    if (!parameter.key || !parameter.value) {
      return
    }

    url = url.replace(`{${parameter.key}}`, parameter.value)
  })

  const headers = paramsReducer(
    example.parameters.headers.filter(({ enabled }) => enabled),
  )

  let data: FormData | string | FileType | null = null

  if (example.body.activeBody === 'binary' && example.body.binary) {
    if (example.body.binary.type) {
      headers['Content-Type'] = example.body.binary.type
    }
    headers['Content-Disposition'] =
      `attachment; filename="${example.body.binary.name}"`
    data = example.body.binary
  } else if (example.body.activeBody === 'raw' && example.body.raw.value) {
    data = example.body.raw.value
  } else if (example.body.activeBody === 'formData') {
    /**
     * The header has to look something like this:
     *
     * Content-Type: multipart/form-data; boundary=----formdata-undici-043007900459
     *
     * fetch() makes sure to generate this properly, we must make sure to delete it
     */
    delete headers['Content-Type']

    const bodyFormData = new FormData()

    if (example.body.formData.encoding === 'form-data') {
      example.body.formData.value.forEach(
        (formParam: {
          key: string
          value: string
          file?: FileType
          enabled: boolean
        }) => {
          // Add File to FormData
          if (formParam.key && formParam.enabled) {
            if (formParam.file) {
              bodyFormData.append(
                formParam.key,
                formParam.file,
                formParam.file.name,
              )
            } else if (formParam.value !== undefined) {
              bodyFormData.append(formParam.key, formParam.value)
            }
          }
        },
      )

      data = bodyFormData
    }
  }

  // Extract query parameters from the URL
  const queryParametersFromUrl: RequestExampleParameter[] = []
  const [urlWithoutQueryString, urlQueryString] = url.split('?')
  new URLSearchParams(urlQueryString ?? '').forEach((value, key) => {
    queryParametersFromUrl.push({
      key,
      value,
      enabled: true,
    })
  })

  const query: Record<string, string> = {
    ...paramsReducer(
      example.parameters.query
        .filter(({ enabled }) => enabled)
        .filter(({ value }) => value !== ''),
    ),
    ...paramsReducer(queryParametersFromUrl),
  }
  const cookies: Record<string, string> = {
    ...paramsReducer(
      (example.parameters.cookies ?? []).filter(({ enabled }) => enabled),
    ),
  }

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

  const config: RequestInit = {
    method: request.method,
    headers,
    signal: abortSignal,
  }

  if (data) {
    config.body = data
  }

  // Start timer to get response duration
  const startTime = Date.now()
  const shouldRemoveProxyHeaders = shouldUseProxy(proxyUrl, url)

  try {
    const response = await fetch(redirectToProxy(proxyUrl, url), config)
    if (!response.ok) throw response

    const { responseHeaders, cookieHeaderKeys } = parseResponseHeaders(
      response,
      shouldRemoveProxyHeaders,
    )
    const responseData = await parseFetchResponseData(response)

    return {
      sentTime: Date.now(),
      request: example,
      response: {
        ...response,
        headers: normalizeHeaders(responseHeaders),
        cookieHeaderKeys,
        data: responseData,
        duration: Date.now() - startTime,
      },
    }
  } catch (e) {
    const sentTime = Date.now()
    const payload = { sentTime, request: example }

    // We have a response from fetch
    if (e instanceof Response) {
      const responseData = await parseFetchResponseData(e)
      const { responseHeaders, cookieHeaderKeys } = parseResponseHeaders(
        e,
        shouldRemoveProxyHeaders,
      )

      return {
        ...payload,
        response: {
          ...e,
          headers: normalizeHeaders(responseHeaders),
          cookieHeaderKeys,
          data: responseData,
          duration: Date.now() - startTime,
        },
      }
    }

    // It broke somewhere else
    const error =
      e instanceof Error || e instanceof DOMException
        ? e
        : new Error('An unknown error has occurred')
    return { ...payload, error }
  }
}
