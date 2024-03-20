import { isJsonString } from '@scalar/oas-utils'

import type { ClientRequestConfig } from '../types'

/**
 * Before a request is sent to the server, we’ll do some final preparation.
 *
 * - Add Content-Type header if request.body is JSON
 * - Parse request.body if it’s JSON
 * - Remove duplicate headers
 */
export const prepareClientRequestConfig = (configuration: {
  request: ClientRequestConfig
}) => {
  const { request } = configuration

  // Check if request.body contains JSON
  if (request.body && isJsonString(request.body)) {
    // Check whether the request already has a Content-Type header
    const hasContentTypeHeader = request.headers?.some(
      (header) => header.name.toLowerCase() === 'content-type',
    )

    // If not, add one.
    if (!hasContentTypeHeader) {
      request.headers = [
        ...(request.headers ?? []),
        {
          name: 'Content-Type',
          value: `application/json; charset=utf-8`,
          enabled: true,
        },
      ]
    }

    request.body = JSON.parse(request.body)
  }

  return {
    ...request,
  }
}
