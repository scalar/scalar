import { describe, expect, it } from 'vitest'

import { redirectToProxy } from './redirectToProxy'

describe('redirectToProxy', () => {
  it('rewrites URLs', async () => {
    expect(
      redirectToProxy('https://proxy.scalar.com', 'https://example.com'),
    ).toBe('https://proxy.scalar.com/?scalar_url=https%3A%2F%2Fexample.com')
  })

  it('keeps query parameters', async () => {
    expect(
      redirectToProxy(
        'https://proxy.scalar.com?foo=bar',
        'https://example.com',
      ),
    ).toBe(
      'https://proxy.scalar.com/?foo=bar&scalar_url=https%3A%2F%2Fexample.com',
    )
  })

  it('skips the proxy if no proxy url is passed', async () => {
    expect(redirectToProxy('', 'https://example.com')).toBe(
      'https://example.com',
    )
  })

  it('skips the proxy for relative URLs starting with a slash', async () => {
    expect(redirectToProxy('https://proxy.scalar.com', '/api')).toBe('/api')
  })

  it('skips the proxy for relative URLs not starting with a slash', async () => {
    expect(redirectToProxy('https://proxy.scalar.com', 'api')).toBe('api')
  })
})
