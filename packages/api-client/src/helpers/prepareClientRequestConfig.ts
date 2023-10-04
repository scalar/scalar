import type { AuthState, ClientRequestConfig } from '../types'

export const prepareClientRequestConfig = (configuration: {
  request: ClientRequestConfig
  authState: AuthState
}) => {
  const { authState, request } = configuration

  console.log(
    'basic auth',
    authState.type === 'basic' && authState.basic.active,
  )

  if (authState.type === 'basic' && authState.basic.active) {
    request.headers = [
      ...(request.headers ?? []),
      {
        name: 'Authorization',
        value: `Basic ${Buffer.from(
          `${authState.basic.userName}:${authState.basic.password}`,
        ).toString('base64')}`,
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

  return {
    ...request,
  }
}
