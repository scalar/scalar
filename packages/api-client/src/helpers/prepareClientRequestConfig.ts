import { isJsonString } from '@scalar/oas-utils'

import type { AuthState, ClientRequestConfig } from '../types'

/**
 * Before a request is sent to the server, we’ll do some final preparation.
 *
 * - Add authentication headers
 * - Add Content-Type header if request.body is JSON
 * - Parse request.body if it’s JSON
 * - Remove duplicate headers
 */
export const prepareClientRequestConfig = (configuration: {
  request: ClientRequestConfig
  authState: AuthState
}) => {
  const { authState, request } = configuration

  if (authState.type === 'basic' && authState.basic.active) {
    request.headers = [
      ...(request.headers ?? []),
      {
        name: 'Authorization',
        value: `Basic ${btoa(
          `${authState.basic.username}:${authState.basic.password}`,
        )}`,
        enabled: true,
      },
    ]
  } else if (authState.type === 'bearer' && authState.bearer.active) {
    request.headers = [
      ...(request.headers ?? []),
      {
        name: 'Authorization',
        value: `Bearer ${authState.bearer.token}`,
        enabled: true,
      },
    ]
  }

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
