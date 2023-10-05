import axios from 'axios'
import { wrapper } from 'axios-cookiejar-support'
import { nanoid } from 'nanoid'
import { CookieJar } from 'tough-cookie'

import type { ClientResponse, RequestResult, SendRequestConfig } from '../types'
import {
  concatenateUrlAndPath,
  mapFromArray,
  normalizePath,
  normalizeRequestMethod,
  normalizeUrl,
  replaceVariables,
} from './'

const jar = new CookieJar()
const client = wrapper(axios.create({ jar }))

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
  const urlWithPath = concatenateUrlAndPath(url, path)
  const renderedUrl = replaceVariables(
    urlWithPath,
    mapFromArray(request.parameters ?? [], 'name', 'value'),
  )
  // TODO: No type-casting
  const queryString = new URLSearchParams(
    mapFromArray(request.query ?? [], 'name', 'value') as Record<
      string,
      string
    >,
  ).toString()

  const completeUrl = `${renderedUrl}${queryString ? '?' + queryString : ''}`

  /** TODO: Make dynamic */
  const auth = {
    type: 'none',
  }

  const startTime = Date.now()

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
    await client(config)
      .then((res) => {
        console.log(res.config.jar.toJSON().cookies)

        return {
          ...res.data,
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
