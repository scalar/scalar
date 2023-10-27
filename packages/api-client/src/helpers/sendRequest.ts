import axios from 'axios'
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
    request.headers ?? [],
    'name',
    'value',
  )
  const url = normalizeUrl(request.url)
  const path = normalizePath(request.path)
  const [urlWithPath, ...urlQueryString] = concatenateUrlAndPath(
    url,
    path,
  ).split('?')

  const renderedUrl = replaceVariables(
    urlWithPath,
    mapFromArray(request.parameters ?? [], 'name', 'value'),
  )

  // Get query string from urlWithPath ("https://example.com?foo=bar")
  // and merge it with query parameters from the request

  const queryStringsFromUrl: Query[] = []

  urlQueryString.forEach((queryString) => {
    new URLSearchParams(queryString ?? '').forEach((value, name) => {
      queryStringsFromUrl.push({
        name,
        value,
      })
    })
  })

  const queryString = new URLSearchParams(
    // TODO: No type-casting
    mapFromArray(
      [...(request.query ?? []), ...queryStringsFromUrl],
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
  if (request.cookies) {
    const cookies = mapFromArray(request.cookies, 'name', 'value')

    headers.Cookie = Object.keys(cookies)
      .map((key) => `${key}=${cookies[key]}`)
      .join('; ')
  }

  const requestOptions = {
    method,
    url: completeUrl,
    auth,
    headers,
    data: request.body,
  }

  const config = proxyUrl
    ? {
        method: 'POST',
        url: proxyUrl,
        data: requestOptions,
      }
    : {
        method: requestOptions.method,
        url: requestOptions.url,
        headers: requestOptions.headers,
        data: requestOptions.data,
      }

  console.info(`${requestOptions.method} ${requestOptions.url}`)

  const response: (ClientResponse & { error: false }) | { error: true } =
    // @ts-ignore
    await axios(config)
      .then((res) => {
        return {
          ...(proxyUrl ? res.data : res),
          ...(!proxyUrl && { statusCode: res.status }),
          error: false,
        }
      })
      .catch((err) => {
        return {
          error: true,
          ...err?.response,
        }
      })

  return response.error
    ? null
    : {
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
