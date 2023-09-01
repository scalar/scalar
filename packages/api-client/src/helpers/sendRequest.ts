import axios, { type AxiosRequestHeaders } from 'axios'
import { nanoid } from 'nanoid'
import nunjucks from 'nunjucks'

import type {
  ClientRequestConfig,
  ClientResponse,
  RequestResult,
} from '../types'
import { mapFromArray } from './mapFromArray'

const templateEngine = nunjucks.configure({
  tags: {
    variableStart: '{',
    variableEnd: '}',
  },
})

const defaultHeaders = {
  'User-Agent': 'Scalar API Client',
}

/**
 * Send a request via the proxy
 */
export async function sendRequest(
  request: ClientRequestConfig,
  proxyUrl: string,
): Promise<RequestResult | null> {
  // Format complete URL
  const method = request.type.toUpperCase()
  const fullUrl = `${request.url}${request.path}`
  const headers: Record<string, string | number> = {
    ...defaultHeaders,
    ...mapFromArray(request.headers, 'name', 'value'),
  }
  /** TODO: Make dynamic */
  const auth = {
    type: 'none',
  }
  const variables = mapFromArray(request.parameters, 'name', 'value')
  const renderedURL = templateEngine.renderString(fullUrl, variables)
  /** TODO: Make dynamic */
  const proxy = true

  const startTime = Date.now()

  const requestOptions = {
    method,
    url: renderedURL,
    auth,
    headers,
    data: request.body,
  }

  const config = proxy
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
      .then((res) => ({
        ...res.data,
        error: false,
      }))
      .catch((err) => ({
        error: true,
        ...err?.response,
      }))

  return !response.error
    ? {
        sentTime: Date.now(),
        request,
        response: {
          ...response,
          duration: Date.now() - startTime,
        },
        responseId: nanoid(),
      }
    : null
}
