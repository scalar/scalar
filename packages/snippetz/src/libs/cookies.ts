import type { HarRequest } from '@scalar/types/snippetz'

/** Merge cookie headers case-insensitively, preserving already serialized header values. */
export const mergeCookieHeaders = (request: Partial<HarRequest>): HarRequest['headers'] => {
  const headers = request.headers ?? []
  const cookieHeaders = headers.filter(({ name }) => name.toLowerCase() === 'cookie')
  const serializedCookies = (request.cookies ?? []).map(
    ({ name, value }) => `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
  )

  return [
    ...headers.filter(({ name }) => name.toLowerCase() !== 'cookie'),
    ...(cookieHeaders.length || serializedCookies.length
      ? [
          {
            name: 'Cookie',
            value: [...cookieHeaders.map(({ value }) => value), ...serializedCookies]
              .filter((value) => value !== '')
              .join('; '),
          },
        ]
      : []),
  ]
}
