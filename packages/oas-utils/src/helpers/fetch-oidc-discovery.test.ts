import { describe, expect, it, vi } from 'vitest'

import type { OidcDiscoveryDocument } from './fetch-oidc-discovery'
import { fetchOidcDiscovery, transformOidcToOAuth2 } from './fetch-oidc-discovery'

// Mock the fetchWithProxyFallback function
vi.mock('./fetch-with-proxy-fallback', () => ({
  fetchWithProxyFallback: vi.fn(),
}))

describe('fetchOidcDiscovery', () => {
  it('fetches and parses a valid OIDC discovery document', async () => {
    const mockDiscovery: OidcDiscoveryDocument = {
      authorization_endpoint: 'https://auth.example.com/oauth/authorize',
      token_endpoint: 'https://auth.example.com/oauth/token',
      grant_types_supported: ['authorization_code', 'client_credentials'],
      scopes_supported: ['openid', 'profile', 'email'],
    }

    const { fetchWithProxyFallback } = await import('./fetch-with-proxy-fallback')
    vi.mocked(fetchWithProxyFallback).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDiscovery,
    } as Response)

    const result = await fetchOidcDiscovery('https://auth.example.com/.well-known/openid-configuration')

    expect(result).toEqual(mockDiscovery)
    expect(fetchWithProxyFallback).toHaveBeenCalledWith('https://auth.example.com/.well-known/openid-configuration', {
      proxyUrl: undefined,
    })
  })

  it('passes proxy URL to fetchWithProxyFallback', async () => {
    const mockDiscovery: OidcDiscoveryDocument = {
      authorization_endpoint: 'https://auth.example.com/oauth/authorize',
      token_endpoint: 'https://auth.example.com/oauth/token',
    }

    const { fetchWithProxyFallback } = await import('./fetch-with-proxy-fallback')
    vi.mocked(fetchWithProxyFallback).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDiscovery,
    } as Response)

    await fetchOidcDiscovery('https://auth.example.com/.well-known/openid-configuration', 'https://proxy.example.com')

    expect(fetchWithProxyFallback).toHaveBeenCalledWith('https://auth.example.com/.well-known/openid-configuration', {
      proxyUrl: 'https://proxy.example.com',
    })
  })

  it('throws error when fetch fails with non-200 status', async () => {
    const { fetchWithProxyFallback } = await import('./fetch-with-proxy-fallback')
    vi.mocked(fetchWithProxyFallback).mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response)

    await expect(fetchOidcDiscovery('https://auth.example.com/.well-known/openid-configuration')).rejects.toThrow(
      'OIDC Discovery failed: Failed to fetch OIDC discovery document from https://auth.example.com/.well-known/openid-configuration (Status: 404)',
    )
  })

  it('throws error when discovery document is missing required fields', async () => {
    const invalidDiscovery = {
      authorization_endpoint: 'https://auth.example.com/oauth/authorize',
      // Missing token_endpoint
    }

    const { fetchWithProxyFallback } = await import('./fetch-with-proxy-fallback')
    vi.mocked(fetchWithProxyFallback).mockResolvedValueOnce({
      ok: true,
      json: async () => invalidDiscovery,
    } as Response)

    await expect(fetchOidcDiscovery('https://auth.example.com/.well-known/openid-configuration')).rejects.toThrow(
      'OIDC Discovery failed: Invalid OIDC discovery document: missing required authorization_endpoint or token_endpoint',
    )
  })

  it('throws error when network request fails', async () => {
    const { fetchWithProxyFallback } = await import('./fetch-with-proxy-fallback')
    vi.mocked(fetchWithProxyFallback).mockRejectedValueOnce(new Error('Network error'))

    await expect(fetchOidcDiscovery('https://auth.example.com/.well-known/openid-configuration')).rejects.toThrow(
      'OIDC Discovery failed: Network error',
    )
  })
})

describe('transformOidcToOAuth2', () => {
  it('transforms authorization_code grant type to authorizationCode flow', () => {
    const discovery: OidcDiscoveryDocument = {
      authorization_endpoint: 'https://auth.example.com/oauth/authorize',
      token_endpoint: 'https://auth.example.com/oauth/token',
      grant_types_supported: ['authorization_code'],
      scopes_supported: ['openid', 'profile', 'email'],
    }

    const result = transformOidcToOAuth2(discovery)

    expect(result.flows.authorizationCode).toEqual({
      authorizationUrl: 'https://auth.example.com/oauth/authorize',
      tokenUrl: 'https://auth.example.com/oauth/token',
      scopes: {
        openid: 'openid',
        profile: 'profile',
        email: 'email',
      },
    })
  })

  it('transforms multiple grant types to corresponding OAuth2 flows', () => {
    const discovery: OidcDiscoveryDocument = {
      authorization_endpoint: 'https://auth.example.com/oauth/authorize',
      token_endpoint: 'https://auth.example.com/oauth/token',
      grant_types_supported: ['authorization_code', 'implicit', 'client_credentials', 'password'],
      scopes_supported: ['openid', 'profile'],
    }

    const result = transformOidcToOAuth2(discovery)

    expect(result.flows.authorizationCode).toBeDefined()
    expect(result.flows.implicit).toBeDefined()
    expect(result.flows.clientCredentials).toBeDefined()
    expect(result.flows.password).toBeDefined()
  })

  it('handles discovery document with no grant_types_supported', () => {
    const discovery: OidcDiscoveryDocument = {
      authorization_endpoint: 'https://auth.example.com/oauth/authorize',
      token_endpoint: 'https://auth.example.com/oauth/token',
    }

    const result = transformOidcToOAuth2(discovery)

    expect(result.flows).toEqual({})
  })

  it('handles discovery document with empty scopes_supported', () => {
    const discovery: OidcDiscoveryDocument = {
      authorization_endpoint: 'https://auth.example.com/oauth/authorize',
      token_endpoint: 'https://auth.example.com/oauth/token',
      grant_types_supported: ['authorization_code'],
      scopes_supported: [],
    }

    const result = transformOidcToOAuth2(discovery)

    expect(result.flows.authorizationCode?.scopes).toEqual({})
  })

  it('handles discovery document with no scopes_supported', () => {
    const discovery: OidcDiscoveryDocument = {
      authorization_endpoint: 'https://auth.example.com/oauth/authorize',
      token_endpoint: 'https://auth.example.com/oauth/token',
      grant_types_supported: ['client_credentials'],
    }

    const result = transformOidcToOAuth2(discovery)

    expect(result.flows.clientCredentials?.scopes).toEqual({})
  })

  it('ignores unsupported grant types', () => {
    const discovery: OidcDiscoveryDocument = {
      authorization_endpoint: 'https://auth.example.com/oauth/authorize',
      token_endpoint: 'https://auth.example.com/oauth/token',
      grant_types_supported: ['authorization_code', 'refresh_token', 'urn:ietf:params:oauth:grant-type:device_code'],
    }

    const result = transformOidcToOAuth2(discovery)

    // Only authorization_code should be transformed
    expect(result.flows.authorizationCode).toBeDefined()
    expect(Object.keys(result.flows)).toHaveLength(1)
  })

  it('transforms real-world Keycloak discovery document', () => {
    const keycloakDiscovery: OidcDiscoveryDocument = {
      authorization_endpoint: 'http://localhost:8080/realms/scalar/protocol/openid-connect/auth',
      token_endpoint: 'http://localhost:8080/realms/scalar/protocol/openid-connect/token',
      grant_types_supported: [
        'authorization_code',
        'client_credentials',
        'implicit',
        'password',
        'refresh_token',
        'urn:ietf:params:oauth:grant-type:device_code',
        'urn:ietf:params:oauth:grant-type:token-exchange',
        'urn:ietf:params:oauth:grant-type:uma-ticket',
        'urn:openid:params:grant-type:ciba',
      ],
      scopes_supported: [
        'openid',
        'profile',
        'microprofile-jwt',
        'acr',
        'email',
        'address',
        'phone',
        'basic',
        'organization',
        'offline_access',
        'roles',
        'web-origins',
        'service_account',
      ],
    }

    const result = transformOidcToOAuth2(keycloakDiscovery)

    // Should transform the 4 supported OAuth2 flows
    expect(result.flows.authorizationCode).toBeDefined()
    expect(result.flows.implicit).toBeDefined()
    expect(result.flows.clientCredentials).toBeDefined()
    expect(result.flows.password).toBeDefined()

    // Check scopes are properly converted with scope names as descriptions
    expect(result.flows.authorizationCode?.scopes).toEqual({
      openid: 'openid',
      profile: 'profile',
      'microprofile-jwt': 'microprofile-jwt',
      acr: 'acr',
      email: 'email',
      address: 'address',
      phone: 'phone',
      basic: 'basic',
      organization: 'organization',
      'offline_access': 'offline_access',
      roles: 'roles',
      'web-origins': 'web-origins',
      'service_account': 'service_account',
    })

    // Check endpoints
    expect(result.flows.authorizationCode?.authorizationUrl).toBe(
      'http://localhost:8080/realms/scalar/protocol/openid-connect/auth',
    )
    expect(result.flows.authorizationCode?.tokenUrl).toBe(
      'http://localhost:8080/realms/scalar/protocol/openid-connect/token',
    )
  })
})
