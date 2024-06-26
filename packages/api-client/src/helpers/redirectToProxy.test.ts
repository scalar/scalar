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
})
