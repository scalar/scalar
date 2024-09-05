import { requestStatusBus } from '@/libs/event-busses'
import { normalizeHeaders } from '@/libs/normalizeHeaders'
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
import { canMethodHaveBody, shouldUseProxy } from '@scalar/oas-utils/helpers'
import Cookies from 'js-cookie'
import MIMEType from 'whatwg-mimetype'

/** Decode the buffer according to its content-type */
function decodeBuffer(buffer: ArrayBuffer, contentType: string) {
  const type = new MIMEType(contentType)
  if (textMediaTypes.includes(type.essence)) {
    const decoder = new TextDecoder(type.parameters.get('charset'))
    const str = decoder.decode(buffer)

    if (type.subtype === 'json') return JSON.parse(str)
    return str
  } else {
    return new Blob([buffer], { type: type.essence })
  }
}

/** Populate the headers from enabled parameters */
function createFetchHeaders(example: RequestExample, env: object) {
  const headers: NonNullable<RequestInit['headers']> = {}

  example.parameters.headers.forEach((h) => {
    if (h.enabled)
      headers[h.key.toLowerCase()] = replaceTemplateVariables(h.value, env)
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

/** Set all cookie params and workspace level cookies that are applicable */
function setRequestCookies({
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
  proxy: string
}) {
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
    domain: new URL(proxy).host,
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
        domain: proxy,
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
function createFetchBody(
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
    example.body.formData.value.forEach((entry) => {
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

/**
 * Execute the request
 * called from the send button as well as keyboard shortcuts
 */
export function createRequestOperation({
  request,
  example,
  server,
  securitySchemes,
  proxy,
  environment,
  globalCookies,
}: {
  request: Request
  example: RequestExample
  proxy: string
  environment: object | undefined
  server?: Server
  securitySchemes: Record<string, SecurityScheme>
  globalCookies: Cookie[]
}) {
  const env = environment ?? {}
  const controller = new AbortController()

  /** Parsed and evaluated values for path parameters */
  const pathVariables = example.parameters.path.reduce<Record<string, string>>(
    (vars, param) => {
      if (param.enabled)
        vars[param.key] = replaceTemplateVariables(param.value, env)

      return vars
    },
    {},
  )

  // Allow path only requests, mostly for quick testing in drafts
  const url = server?.url
    ? new URL(replaceTemplateVariables(server.url ?? '', env))
    : new URL(request.path)

  const pathname = replaceTemplateVariables(request.path, pathVariables)
  const urlParams = createFetchQueryParams(example, env)
  const headers = createFetchHeaders(example, env)
  const { body, contentType } = createFetchBody(request.method, example, env)
  const { cookieParams } = setRequestCookies({
    example,
    env,
    globalCookies,
    domain: url.hostname,
    proxy,
  })

  if (contentType && !headers['content-type'])
    headers['content-type'] = contentType

  // Populate all forms of auth to the request segments
  Object.keys(example.auth).forEach((k) => {
    const exampleAuth = example.auth[k]
    const scheme = securitySchemes[k]
    if (!exampleAuth || !scheme) return

    // Scheme type and example value type should always match
    if (scheme.type === 'apiKey' && exampleAuth.type === 'apiKey') {
      const value = replaceTemplateVariables(exampleAuth.value, env)
      if (scheme.in === 'header') headers[scheme.nameKey] = value
      if (scheme.in === 'query') urlParams.append(scheme.nameKey, value)
      if (scheme.in === 'cookie')
        Cookies.set(scheme.nameKey, value, cookieParams)
    }

    if (scheme.type === 'http' && exampleAuth.type === 'http') {
      if (scheme.scheme === 'basic') {
        const username = replaceTemplateVariables(exampleAuth.username, env)
        const password = replaceTemplateVariables(exampleAuth.password, env)
        const value = password ? `${username}:${password}` : username

        headers['Authorization'] = `Basic ${btoa(value)}`
      } else {
        const value = replaceTemplateVariables(exampleAuth.token, env)
        headers['Authorization'] = `Bearer ${value}`
      }
    }

    // For OAuth we just add the token that was previously generated
    if (
      scheme.type === 'oauth2' &&
      exampleAuth.type.includes('oauth') &&
      'token' in exampleAuth
    ) {
      if (!exampleAuth.token) console.error('OAuth token was not created')
      headers['Authorization'] = `Bearer ${exampleAuth.token}`
    }
  })

  const sendRequest = async (): Promise<{
    response: ResponseInstance
    request: RequestExample
    timestamp: number
  }> => {
    requestStatusBus.emit('start')

    // Start timer to get response duration
    const startTime = Date.now()

    url.search = urlParams.toString()
    // Only add the path if we aren't using the raw path aka we have a server
    if (server?.url) url.pathname = pathname
    const proxyPath = new URLSearchParams([['scalar_url', url.toString()]])

    const response = await fetch(`${proxy}?${proxyPath.toString()}`, {
      signal: controller.signal,
      method: request.method,
      body,
      headers,
    })

    console.log(response)
    requestStatusBus.emit('stop')

    const responseHeaders = normalizeHeaders(
      response.headers,
      shouldUseProxy(proxy, url.origin),
    )
    const responseType =
      response.headers.get('content-type') ?? 'text/plain;charset=UTF-8'

    const responseData = decodeBuffer(
      await response.arrayBuffer(),
      responseType,
    )

    return {
      timestamp: Date.now(),
      request: example,
      response: {
        ...response,
        headers: responseHeaders,
        cookieHeaderKeys: response.headers.getSetCookie(),
        data: responseData,
        duration: Date.now() - startTime,
      },
    }
  }

  return {
    sendRequest,
    controller,
  }
}
