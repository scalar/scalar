import type { Cookie } from '@scalar/oas-utils/entities/cookie'
import type { RequestExample } from '@scalar/oas-utils/entities/spec'
import { describe, expect, it } from 'vitest'

import { setRequestCookies } from './set-request-cookies'

describe('setRequestCookies', () => {
  it('should set local and global cookies', () => {
    // Local cookie
    const localCookieParameter = {
      key: 'localCookie',
      value: 'foo',
      enabled: true,
    }

    const example: RequestExample = createRequestExample({
      parameters: {
        cookies: [localCookieParameter],
        path: [],
        query: [],
        headers: [],
      },
    })

    // Global
    const globalCookies: Cookie[] = [createCookie('globalCookie', 'bar')]

    const { cookieParams } = setRequestCookies({
      example,
      env: {},
      globalCookies,
      serverUrl: 'https://example.com/v1',
    })

    expect(cookieParams).toMatchObject([
      {
        name: 'localCookie',
        value: 'foo',
      },
      {
        name: 'globalCookie',
        value: 'bar',
      },
    ])

    console.log(cookieParams)
  })
})

/**
 * Create a cookie with default values and optional overrides
 */
function createCookie(
  name: string,
  value: string,
  options: Partial<Exclude<Cookie, 'name' | 'value'>> = {},
): Cookie {
  return {
    name,
    value,
    domain: 'example.com',
    path: '/',
    // tomorrow
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: true,
    sameSite: 'None',
    uid: 'globalCookie',
    // overwrite (optional)
    ...options,
  }
}

function createRequestExample(
  example: Partial<RequestExample> = {},
): RequestExample {
  return {
    type: 'requestExample' as const,
    uid: 'example',
    name: 'Example',
    requestUid: 'request',
    parameters: {
      cookies: [],
      path: [],
      query: [],
      headers: [],
    },
    body: {
      activeBody: 'raw' as const,
      raw: {
        encoding: 'json',
        value: '',
      },
    },
    ...example,
  }
}
