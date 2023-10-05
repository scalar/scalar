import type { ClientRequestConfig } from '../types'

export const prepareClientRequestConfig = (
  originalRequest: ClientRequestConfig,
) => {
  const request = { ...originalRequest }

  const { authentication } = request

  if (authentication.type === 'basic' && authentication.basic.active) {
    request.headers = [
      ...(request.headers ?? []),
      {
        name: 'Authorization',
        value: `Basic ${btoa(
          `${authentication.basic.username}:${authentication.basic.password}`,
        )}`,
      },
    ]
  } else if (authentication.type === 'bearer' && authentication.bearer.active) {
    request.headers = [
      ...(request.headers ?? []),
      {
        name: 'Authorization',
        value: `Bearer ${authentication.bearer.token}`,
      },
    ]
  }

  return {
    ...request,
  }
}
