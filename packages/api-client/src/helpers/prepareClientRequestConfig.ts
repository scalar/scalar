import type { AuthState, ClientRequestConfig } from '../types'

const isJson = (value: string) => {
  try {
    JSON.parse(value)
  } catch {
    return false
  }
  return true
}

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
  if (request.body && isJson(request.body)) {
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

  console.log(request)

  return {
    ...request,
  }
}
