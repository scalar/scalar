import type {
  SecurityScheme,
  SelectedSchemeOauth2,
} from '@scalar/oas-utils/entities/workspace/security'
import type {
  Request,
  RequestExample,
  RequestExampleParameter,
  ResponseInstance,
} from '@scalar/oas-utils/entities/workspace/spec'
import { redirectToProxy, shouldUseProxy } from '@scalar/oas-utils/helpers'
import axios, { type AxiosError, type AxiosRequestConfig } from 'axios'
import Cookies from 'js-cookie'

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

/**
 * Execute the request
 * called from the send button as well as keyboard shortcuts
 */
export const sendRequest = async (
  request: Request,
  example: RequestExample,
  rawUrl: string,
  securityScheme?: {
    scheme: SecurityScheme
    flow?: SelectedSchemeOauth2['flow']
  },
  proxyUrl?: string,
): Promise<{
  sentTime?: number
  request?: RequestExample
  response?: ResponseInstance
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

  let data: FormData | string | File | null = null

  if (example.body.activeBody === 'binary' && example.body.binary) {
    headers['Content-Type'] = example.body.binary.type
    headers['Content-Disposition'] =
      `attachment; filename="${example.body.binary.name}"`
    data = example.body.binary
  } else if (example.body.activeBody === 'raw') {
    data = example.body.raw.value
  } else if (example.body.activeBody === 'formData') {
    headers['Content-Type'] = 'multipart/form-data'

    const bodyFormData = new FormData()
    if (example.body.formData.encoding === 'form-data') {
      example.body.formData.value.forEach(
        (formParam: { key: string; value: string; file?: File }) => {
          if (formParam.key && formParam.value) {
            bodyFormData.append(formParam.key, formParam.value)
          } else if (formParam.file) {
            bodyFormData.append(formParam.file.name, formParam.file)
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

  // Add auth
  if (securityScheme?.scheme) {
    const { scheme } = securityScheme

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
      else {
        headers['Authorization'] = `Bearer ${scheme.value}`
      }
    }
    // OAuth 2
    else if (scheme.type === 'oauth2' && securityScheme.flow?.token) {
      headers['Authorization'] = `Bearer ${securityScheme.flow.token}`
    }
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
    headers,
    data,
  }

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

    return {
      sentTime: Date.now(),
      request: example,
      response: {
        ...response,
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
            duration: Date.now() - startTime,
          }
        : undefined,
    }
  }
}
