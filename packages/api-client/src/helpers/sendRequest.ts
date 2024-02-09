import axios, { type AxiosRequestConfig } from 'axios'
import { nanoid } from 'nanoid'

import type {
  ClientResponse,
  Query,
  RequestResult,
  SendRequestConfig,
} from '../types'
import {
  concatenateUrlAndPath,
  mapFromArray,
  normalizePath,
  normalizeRequestMethod,
  normalizeUrl,
  replaceVariables,
} from './'

/**
 * Send a request via the proxy
 */
export async function sendRequest(
  request: SendRequestConfig,
  proxyUrl?: string,
): Promise<RequestResult | null> {
  const method = normalizeRequestMethod(request.type)

  const headers: Record<string, string | number> = mapFromArray(
    (request.headers ?? []).filter((header) => header.enabled),
    'name',
    'value',
  ) as Record<string, string | number>
  const url = normalizeUrl(request.url)
  const path = normalizePath(request.path)
  const [urlWithPath, ...urlQueryString] = concatenateUrlAndPath(
    url,
    path,
  ).split('?')

  const renderedUrl = replaceVariables(
    urlWithPath,
    mapFromArray(
      (request.variables ?? []).filter((variable) => variable.enabled),
      'name',
      'value',
    ) as Record<string, string | number>,
  )

  // Get query string from urlWithPath ("https://example.com?foo=bar")
  // and merge it with query parameters from the request

  const queryStringsFromUrl: Query[] = []

  urlQueryString.forEach((queryString) => {
    new URLSearchParams(queryString ?? '').forEach((value, name) => {
      queryStringsFromUrl.push({
        name,
        value,
        enabled: true,
      })
    })
  })

  const queryString = new URLSearchParams(
    // TODO: No type-casting
    mapFromArray(
      [
        ...(request.query ?? []).filter((query) => query.enabled),
        ...queryStringsFromUrl,
      ],
      'name',
      'value',
    ) as Record<string, string>,
  ).toString()

  const completeUrl = `${renderedUrl}${queryString ? '?' + queryString : ''}`

  /** TODO: Make dynamic */
  const auth = {
    type: 'none',
  }

  const startTime = Date.now()

  // Add cookies to the headers
  if (request.cookies && request.cookies?.length > 0) {
    const cookies = mapFromArray(
      (request.cookies ?? []).filter((cookie) => cookie.enabled),
      'name',
      'value',
    )

    headers.Cookie = Object.keys(cookies)
      .map((key) => `${key}=${cookies[key]}`)
      .join('; ')
  }

  const requestConfig = {
    method,
    url: completeUrl,
    auth,
    headers,
    data: request.body,
  }

  const axiosRequestConfig: AxiosRequestConfig = proxyUrl
    ? {
        method: 'POST',
        url: proxyUrl,
        data: requestConfig,
      }
    : {
        method: requestConfig.method,
        url: requestConfig.url,
        headers: requestConfig.headers,
        data: requestConfig.data,
      }

  // if we have cookies, we need to pass withCredentials
  // to properly set cookies in the browser
  if (headers.cookies) {
    axiosRequestConfig.withCredentials = true
  }

  if (proxyUrl) {
    console.info(`${requestConfig.method} ${proxyUrl} → ${requestConfig.url}`)
  } else {
    console.info(`${requestConfig.method} ${requestConfig.url}`)
  }

  const response: ClientResponse = await axios(axiosRequestConfig)
    .then((result) => {
      // With proxy
      if (proxyUrl) {
        return {
          ...result.data,
          error: false,
        }
      }

      // Without proxy
      return {
        ...result,
        statusCode: result.status,
        data: JSON.stringify(result.data),
        error: false,
      }
    })
    .catch((error) => {
      const { response: errorResponse } = error

      // We add fallbacks where we set the code, status and header type so we can
      // float all errors now to the user
      return {
        headers: {
          'content-type': 'application/json; charset=utf-8',
        },
        ...errorResponse,
        statusCode: errorResponse?.status ?? 0,
        data: JSON.stringify(errorResponse?.data ?? { error: error.code }),
      }
    })

  return {
    sentTime: Date.now(),
    request: {
      ...request,
      type: method,
      url,
      path,
    },
    response: {
      ...response,
      duration: Date.now() - startTime,
    },
    responseId: nanoid(),
  }
}
