import type {
  OAuthFlowAuthorizationCode,
  OAuthFlowClientCredentials,
  OAuthFlowImplicit,
  OAuthFlowPassword,
} from '@scalar/workspace-store/schemas/v3.1/strict/oauth-flow'
import { describe, expect, it } from 'vitest'

import type { OpenIDConnectDiscovery } from './fetch-openid-connect-discovery'
import { openIDDiscoveryToFlows } from './openid-discovery-to-flows'

describe('openid-discovery-to-flows', () => {
  const authorizationEndpoint = 'https://example.com/oauth/authorize'
  const tokenEndpoint = 'https://example.com/oauth/token'
  const scopes = ['openid', 'profile', 'email']
  const expectedScopes = {
    openid: '',
    profile: '',
    email: '',
  }

  const createDiscovery = (overrides: Partial<OpenIDConnectDiscovery> = {}): OpenIDConnectDiscovery => ({
    authorization_endpoint: authorizationEndpoint,
    token_endpoint: tokenEndpoint,
    scopes_supported: scopes,
    ...overrides,
  })

  it('creates only the implicit flow', () => {
    const result = openIDDiscoveryToFlows(
      createDiscovery({
        grant_types_supported: ['implicit'],
      }),
    )

    expect(result.implicit).toBeDefined()
    expect(result.password).toBeUndefined()
    expect(result.clientCredentials).toBeUndefined()
    expect(result.authorizationCode).toBeUndefined()
    expect(result.implicit).toMatchObject({
      authorizationUrl: authorizationEndpoint,
      refreshUrl: authorizationEndpoint,
      scopes: expectedScopes,
    } as OAuthFlowImplicit)
  })

  it('creates only the password flow', () => {
    const result = openIDDiscoveryToFlows(
      createDiscovery({
        grant_types_supported: ['password'],
      }),
    )

    expect(result.implicit).toBeUndefined()
    expect(result.password).toBeDefined()
    expect(result.clientCredentials).toBeUndefined()
    expect(result.authorizationCode).toBeUndefined()
    expect(result.password).toMatchObject({
      tokenUrl: tokenEndpoint,
      refreshUrl: tokenEndpoint,
      scopes: expectedScopes,
    } as OAuthFlowPassword)
  })

  it('creates only the client credentials flow', () => {
    const result = openIDDiscoveryToFlows(
      createDiscovery({
        grant_types_supported: ['client_credentials'],
      }),
    )

    expect(result.implicit).toBeUndefined()
    expect(result.password).toBeUndefined()
    expect(result.clientCredentials).toBeDefined()
    expect(result.authorizationCode).toBeUndefined()
    expect(result.clientCredentials).toMatchObject({
      tokenUrl: tokenEndpoint,
      refreshUrl: tokenEndpoint,
      scopes: expectedScopes,
    } satisfies OAuthFlowClientCredentials)
  })

  it('creates only the authorization code flow', () => {
    const result = openIDDiscoveryToFlows(
      createDiscovery({
        grant_types_supported: ['authorization_code'],
      }),
    )

    expect(result.implicit).toBeUndefined()
    expect(result.password).toBeUndefined()
    expect(result.clientCredentials).toBeUndefined()
    expect(result.authorizationCode).toBeDefined()
    expect(result.authorizationCode).toMatchObject({
      authorizationUrl: authorizationEndpoint,
      tokenUrl: tokenEndpoint,
      refreshUrl: tokenEndpoint,
      'x-usePkce': 'no',
      scopes: expectedScopes,
    } satisfies OAuthFlowAuthorizationCode)
  })

  it('creates all flows when all grant types are supported', () => {
    const result = openIDDiscoveryToFlows(
      createDiscovery({
        grant_types_supported: ['implicit', 'password', 'client_credentials', 'authorization_code'],
      }),
    )

    expect(result.implicit).toBeDefined()
    expect(result.password).toBeDefined()
    expect(result.clientCredentials).toBeDefined()
    expect(result.authorizationCode).toBeDefined()

    expect(result.implicit).toMatchObject({
      authorizationUrl: authorizationEndpoint,
      refreshUrl: authorizationEndpoint,
      scopes: expectedScopes,
    } as OAuthFlowImplicit)
    expect(result.password).toMatchObject({
      tokenUrl: tokenEndpoint,
      refreshUrl: tokenEndpoint,
      scopes: expectedScopes,
    } as OAuthFlowPassword)
    expect(result.clientCredentials).toMatchObject({
      tokenUrl: tokenEndpoint,
      refreshUrl: tokenEndpoint,
      scopes: expectedScopes,
    } satisfies OAuthFlowClientCredentials)
    expect(result.authorizationCode).toMatchObject({
      authorizationUrl: authorizationEndpoint,
      tokenUrl: tokenEndpoint,
      refreshUrl: tokenEndpoint,
      'x-usePkce': 'no',
      scopes: expectedScopes,
    } satisfies OAuthFlowAuthorizationCode)
  })

  it('defaults to implicit and authorization code when grant types are omitted', () => {
    const result = openIDDiscoveryToFlows(createDiscovery())

    expect(result.implicit).toBeDefined()
    expect(result.password).toBeUndefined()
    expect(result.clientCredentials).toBeUndefined()
    expect(result.authorizationCode).toBeDefined()

    expect(result.implicit).toMatchObject({
      authorizationUrl: authorizationEndpoint,
      refreshUrl: authorizationEndpoint,
      scopes: expectedScopes,
    } as OAuthFlowImplicit)
    expect(result.authorizationCode).toMatchObject({
      authorizationUrl: authorizationEndpoint,
      tokenUrl: tokenEndpoint,
      refreshUrl: tokenEndpoint,
      'x-usePkce': 'no',
      scopes: expectedScopes,
    } satisfies OAuthFlowAuthorizationCode)
  })
})
