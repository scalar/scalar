import { describe, expect, it, vi } from 'vitest'

import {
  fetchOpenIDConnectDiscovery,
  type OpenIDConnectDiscovery,
} from './openid-connect'

describe('openid-connect', () => {
  describe('fetchOpenIDConnectDiscovery', () => {
    it('appends well-known path when not present', async () => {
      const mockDiscovery: OpenIDConnectDiscovery = {
        authorization_endpoint: 'https://example.com/authorize',
        token_endpoint: 'https://example.com/token',
        issuer: 'https://example.com',
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockDiscovery,
      })

      const [error, result] = await fetchOpenIDConnectDiscovery(
        'https://example.com',
      )

      expect(error).toBeNull()
      expect(result).toEqual(mockDiscovery)
      expect(global.fetch).toHaveBeenCalledWith(
        'https://example.com/.well-known/openid-configuration',
      )
    })

    it('handles URLs with trailing slash', async () => {
      const mockDiscovery: OpenIDConnectDiscovery = {
        authorization_endpoint: 'https://example.com/authorize',
        token_endpoint: 'https://example.com/token',
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockDiscovery,
      })

      const [error, result] = await fetchOpenIDConnectDiscovery(
        'https://example.com/',
      )

      expect(error).toBeNull()
      expect(result).toEqual(mockDiscovery)
      expect(global.fetch).toHaveBeenCalledWith(
        'https://example.com/.well-known/openid-configuration',
      )
    })

    it('uses full discovery URL when provided', async () => {
      const mockDiscovery: OpenIDConnectDiscovery = {
        authorization_endpoint: 'https://example.com/oauth/authorize',
        token_endpoint: 'https://example.com/oauth/token',
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockDiscovery,
      })

      const [error, result] = await fetchOpenIDConnectDiscovery(
        'https://example.com/.well-known/openid-configuration',
      )

      expect(error).toBeNull()
      expect(result).toEqual(mockDiscovery)
      expect(global.fetch).toHaveBeenCalledWith(
        'https://example.com/.well-known/openid-configuration',
      )
    })

    it('returns error for empty URL', async () => {
      const [error, result] = await fetchOpenIDConnectDiscovery('')

      expect(error).not.toBeNull()
      expect(error?.message).toBe('URL cannot be empty')
      expect(result).toBeNull()
    })

    it('handles fetch errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })

      const [error, result] = await fetchOpenIDConnectDiscovery(
        'https://example.com',
      )

      expect(error).not.toBeNull()
      expect(error?.message).toContain('404')
      expect(result).toBeNull()
    })

    it('validates discovery document has required endpoints', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      })

      const [error, result] = await fetchOpenIDConnectDiscovery(
        'https://example.com',
      )

      expect(error).not.toBeNull()
      expect(error?.message).toContain('missing required endpoints')
      expect(result).toBeNull()
    })

    it('handles network errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      const [error, result] = await fetchOpenIDConnectDiscovery(
        'https://example.com',
      )

      expect(error).not.toBeNull()
      expect(error?.message).toBe('Network error')
      expect(result).toBeNull()
    })

    it('parses scopes_supported from discovery document', async () => {
      const mockDiscovery: OpenIDConnectDiscovery = {
        authorization_endpoint: 'https://example.com/authorize',
        token_endpoint: 'https://example.com/token',
        scopes_supported: ['openid', 'profile', 'email'],
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockDiscovery,
      })

      const [error, result] = await fetchOpenIDConnectDiscovery(
        'https://example.com',
      )

      expect(error).toBeNull()
      expect(result?.scopes_supported).toEqual([
        'openid',
        'profile',
        'email',
      ])
    })
  })
})
