import type { HarRequest } from '@scalar/types/snippetz'

import { collectHeaders } from './http'

/** Merge cookie headers case-insensitively, preserving already serialized header values. */
export const mergeCookieHeaders = (request: Partial<HarRequest>): HarRequest['headers'] => {
  const headers = request.headers ?? []
  const cookieHeaders = headers.filter(({ name }) => name.toLowerCase() === 'cookie')
  const serializedCookies = collectHeaders([], request.cookies)

  return [
    ...headers.filter(({ name }) => name.toLowerCase() !== 'cookie'),
    ...(cookieHeaders.length || serializedCookies.length
      ? [
          {
            name: 'Cookie',
            value: [...cookieHeaders, ...serializedCookies]
              .map(({ value }) => value)
              .filter((value) => value !== '')
              .join('; '),
          },
        ]
      : []),
  ]
}
