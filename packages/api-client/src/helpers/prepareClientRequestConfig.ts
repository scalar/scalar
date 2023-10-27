import type { AuthState, ClientRequestConfig } from '../types'
import { isJsonString } from './isJsonString'

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
      },
    ]
  } else if (authState.type === 'bearer' && authState.bearer.active) {
    request.headers = [
      ...(request.headers ?? []),
      {
        name: 'Authorization',
        value: `Bearer ${authState.bearer.token}`,
      },
    ]
  }

  // Check if request.body contains JSON
  if (request.body && isJsonString(request.body)) {
    // Add Content-Type header
    request.headers = [
      ...(request.headers ?? []),
      {
        name: 'Content-Type',
        value: `application/json; charset=utf-8`,
      },
    ]

    request.body = JSON.parse(request.body)
  }

  return {
    ...request,
  }
}
