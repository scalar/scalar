import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { OPENID_SCOPE, fetchOpenIDConnectDiscovery } from './fetch-openid-connect-discovery'

const mockRedirectToProxy = vi.fn((proxyUrl: string, targetUrl: string) =>
  proxyUrl ? `${proxyUrl}?scalar_url=${encodeURIComponent(targetUrl)}` : targetUrl,
)

vi.mock('@scalar/helpers/url/redirect-to-proxy', () => ({
  redirectToProxy: (...args: unknown[]) => mockRedirectToProxy(...args),
}))

describe('fetch-openid-connect-discovery', () => {
  const originalFetch = globalThis.fetch
  const mockFetch = vi.fn()

  beforeEach(() => {
    mockFetch.mockReset()
    mockRedirectToProxy.mockClear()
    globalThis.fetch = mockFetch as unknown as typeof fetch
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('exports the required OpenID scope constant', () => {
    expect(OPENID_SCOPE).toBe('openid')
  })

  it('returns an error for empty urls', async () => {
    const [error, data] = await fetchOpenIDConnectDiscovery('   ', '')

    expect(error?.message).toBe('URL cannot be empty')
    expect(data).toBeNull()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('appends the well-known endpoint for issuer urls', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        authorization_endpoint: 'https://issuer.example.com/authorize',
      }),
    })

    const [error, data] = await fetchOpenIDConnectDiscovery('https://issuer.example.com/', 'https://proxy.example.com')

    expect(error).toBeNull()
    expect(data?.authorization_endpoint).toBe('https://issuer.example.com/authorize')
    expect(mockRedirectToProxy).toHaveBeenCalledWith(
      'https://proxy.example.com',
      'https://issuer.example.com/.well-known/openid-configuration',
    )
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('does not append the well-known endpoint when already present', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        token_endpoint: 'https://issuer.example.com/token',
      }),
    })

    const [error, data] = await fetchOpenIDConnectDiscovery(
      'https://issuer.example.com/.well-known/openid-configuration',
      '',
    )

    expect(error).toBeNull()
    expect(data?.token_endpoint).toBe('https://issuer.example.com/token')
    expect(mockRedirectToProxy).toHaveBeenCalledWith('', 'https://issuer.example.com/.well-known/openid-configuration')
  })

  it('returns an error when the response is not ok', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    })

    const [error, data] = await fetchOpenIDConnectDiscovery('https://issuer.example.com', '')

    expect(error?.message).toContain('Failed to fetch OpenID Connect discovery document: 404 Not Found')
    expect(data).toBeNull()
  })

  it('returns an error when discovery is missing required endpoints', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        grant_types_supported: ['authorization_code'],
      }),
    })

    const [error, data] = await fetchOpenIDConnectDiscovery('https://issuer.example.com', '')

    expect(error?.message).toBe('Invalid OpenID Connect discovery document: missing required endpoints')
    expect(data).toBeNull()
  })

  it('returns thrown errors from fetch', async () => {
    mockFetch.mockRejectedValue(new Error('Network down'))

    const [error, data] = await fetchOpenIDConnectDiscovery('https://issuer.example.com', '')

    expect(error?.message).toBe('Network down')
    expect(data).toBeNull()
  })
})
