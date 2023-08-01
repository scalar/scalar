import axios, { type AxiosRequestHeaders } from 'axios'
import { nanoid } from 'nanoid'
import nunjucks from 'nunjucks'

import type {
  ClientRequestConfig,
  ClientResponse,
  Header,
  RequestResult,
} from '../types'
import { mapFromArray } from './mapFromArray'

const templateEngine = nunjucks.configure({
  tags: {
    variableStart: '{',
    variableEnd: '}',
  },
})

/**
 * Send a request via the proxy
 */
export async function sendRequest(
  request: ClientRequestConfig,
  proxyUrl: string,
): Promise<RequestResult | null> {
  // Format complete URL
  const fullUrl = `${request.url}${request.path}`
  const method = request.type.toUpperCase()
  const headers: Header[] = []
  const auth = {
    type: 'none',
  }
  const variables = mapFromArray(request.parameters, 'name', 'value')

  const renderedURL = templateEngine.renderString(fullUrl, variables)
  const proxy = true

  const startTime = Date.now()

  const axiosHeaders = headers as unknown as AxiosRequestHeaders
  const requestOptions = {
    method,
    url: renderedURL,
    auth,
    headers: axiosHeaders,
    data: null,
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

  const response: (ClientResponse & { error: false }) | { error: true } =
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
