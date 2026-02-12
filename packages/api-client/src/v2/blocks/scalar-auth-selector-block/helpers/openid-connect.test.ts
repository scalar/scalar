import { describe, expect, it, vi } from 'vitest'

import {
  OPENID_SCOPE,
  type OpenIDConnectDiscovery,
  STANDARD_OIDC_SCOPES,
  buildClaimsParameter,
  buildOIDCResponseType,
  ensureOpenIDScope,
  fetchOpenIDConnectDiscovery,
  isOIDCRequest,
  isValidOIDCResponseType,
  openIDConnectDiscoveryToOAuth2Flows,
  parseClaimsParameter,
} from './openid-connect'

describe('openid-connect', () => {
  describe('isOIDCRequest', () => {
    it('returns true when openid scope is present in array', () => {
      expect(isOIDCRequest(['openid', 'profile', 'email'])).toBe(true)
    })

    it('returns true when openid scope is the only scope', () => {
      expect(isOIDCRequest(['openid'])).toBe(true)
    })

    it('returns false when openid scope is not present', () => {
      expect(isOIDCRequest(['profile', 'email'])).toBe(false)
    })

    it('returns false for empty array', () => {
      expect(isOIDCRequest([])).toBe(false)
    })

    it('handles space-separated scope string with openid', () => {
      expect(isOIDCRequest('openid profile email')).toBe(true)
    })

    it('handles space-separated scope string without openid', () => {
      expect(isOIDCRequest('read write')).toBe(false)
    })

    it('handles empty string', () => {
      expect(isOIDCRequest('')).toBe(false)
    })

    it('is case-insensitive for openid scope', () => {
      expect(isOIDCRequest(['OPENID', 'profile'])).toBe(true)
      expect(isOIDCRequest(['OpenID', 'email'])).toBe(true)
      expect(isOIDCRequest('OpenId profile')).toBe(true)
    })

    it('does not match partial scope names containing openid', () => {
      expect(isOIDCRequest(['openid_extended'])).toBe(false)
      expect(isOIDCRequest(['my_openid'])).toBe(false)
    })
  })

  describe('ensureOpenIDScope', () => {
    it('returns scopes unchanged if openid is already present', () => {
      const scopes = ['openid', 'profile', 'email']
      expect(ensureOpenIDScope(scopes)).toEqual(['openid', 'profile', 'email'])
    })

    it('adds openid at the beginning if not present', () => {
      const scopes = ['profile', 'email']
      expect(ensureOpenIDScope(scopes)).toEqual(['openid', 'profile', 'email'])
    })

    it('adds openid to empty array', () => {
      expect(ensureOpenIDScope([])).toEqual(['openid'])
    })

    it('handles case-insensitive openid check', () => {
      const scopes = ['OPENID', 'profile']
      expect(ensureOpenIDScope(scopes)).toEqual(['OPENID', 'profile'])
    })
  })

  describe('isValidOIDCResponseType', () => {
    describe('OAuth 2.0 (non-OIDC) requests', () => {
      it('accepts code response type', () => {
        expect(isValidOIDCResponseType('code', false)).toBe(true)
      })

      it('accepts token response type', () => {
        expect(isValidOIDCResponseType('token', false)).toBe(true)
      })

      it('rejects id_token response type', () => {
        expect(isValidOIDCResponseType('id_token', false)).toBe(false)
      })

      it('rejects combined response types', () => {
        expect(isValidOIDCResponseType('code id_token', false)).toBe(false)
        expect(isValidOIDCResponseType('code token', false)).toBe(false)
      })
    })

    describe('OIDC requests', () => {
      it('accepts code response type', () => {
        expect(isValidOIDCResponseType('code', true)).toBe(true)
      })

      it('accepts token response type', () => {
        expect(isValidOIDCResponseType('token', true)).toBe(true)
      })

      it('accepts id_token response type', () => {
        expect(isValidOIDCResponseType('id_token', true)).toBe(true)
      })

      it('accepts code id_token response type', () => {
        expect(isValidOIDCResponseType('code id_token', true)).toBe(true)
      })

      it('accepts code token response type', () => {
        expect(isValidOIDCResponseType('code token', true)).toBe(true)
      })

      it('accepts id_token token response type', () => {
        expect(isValidOIDCResponseType('id_token token', true)).toBe(true)
      })

      it('accepts code id_token token response type', () => {
        expect(isValidOIDCResponseType('code id_token token', true)).toBe(true)
      })

      it('rejects invalid response types', () => {
        expect(isValidOIDCResponseType('invalid', true)).toBe(false)
        expect(isValidOIDCResponseType('', true)).toBe(false)
      })
    })
  })

  describe('buildOIDCResponseType', () => {
    it('builds code response type', () => {
      expect(buildOIDCResponseType({ code: true })).toBe('code')
    })

    it('builds token response type', () => {
      expect(buildOIDCResponseType({ token: true })).toBe('token')
    })

    it('builds id_token response type', () => {
      expect(buildOIDCResponseType({ idToken: true })).toBe('id_token')
    })

    it('builds code id_token response type', () => {
      expect(buildOIDCResponseType({ code: true, idToken: true })).toBe('code id_token')
    })

    it('builds code token response type', () => {
      expect(buildOIDCResponseType({ code: true, token: true })).toBe('code token')
    })

    it('builds id_token token response type', () => {
      expect(buildOIDCResponseType({ idToken: true, token: true })).toBe('id_token token')
    })

    it('builds code id_token token response type', () => {
      expect(buildOIDCResponseType({ code: true, idToken: true, token: true })).toBe('code id_token token')
    })

    it('returns empty string when no options are specified', () => {
      expect(buildOIDCResponseType({})).toBe('')
    })

    it('ignores false values', () => {
      expect(buildOIDCResponseType({ code: true, idToken: false, token: false })).toBe('code')
    })
  })

  describe('buildClaimsParameter', () => {
    it('builds claims for id_token', () => {
      const claims = {
        id_token: {
          name: null,
          email: { essential: true },
        },
      }
      const result = buildClaimsParameter(claims)
      expect(result).toBe('{"id_token":{"name":null,"email":{"essential":true}}}')
    })

    it('builds claims for userinfo', () => {
      const claims = {
        userinfo: {
          name: null,
          picture: null,
        },
      }
      const result = buildClaimsParameter(claims)
      expect(result).toBe('{"userinfo":{"name":null,"picture":null}}')
    })

    it('builds claims for both id_token and userinfo', () => {
      const claims = {
        id_token: {
          email: { essential: true },
        },
        userinfo: {
          name: null,
        },
      }
      const result = buildClaimsParameter(claims)
      expect(result).toBe('{"id_token":{"email":{"essential":true}},"userinfo":{"name":null}}')
    })

    it('handles claims with specific values', () => {
      const claims = {
        id_token: {
          acr: { value: 'urn:mace:incommon:iap:silver' },
        },
      }
      const result = buildClaimsParameter(claims)
      expect(result).toBe('{"id_token":{"acr":{"value":"urn:mace:incommon:iap:silver"}}}')
    })

    it('handles claims with multiple acceptable values', () => {
      const claims = {
        id_token: {
          acr: { values: ['urn:example:silver', 'urn:example:bronze'] },
        },
      }
      const result = buildClaimsParameter(claims)
      expect(result).toBe('{"id_token":{"acr":{"values":["urn:example:silver","urn:example:bronze"]}}}')
    })

    it('returns null for empty claims', () => {
      expect(buildClaimsParameter({})).toBeNull()
    })

    it('returns null for empty id_token and userinfo objects', () => {
      expect(buildClaimsParameter({ id_token: {}, userinfo: {} })).toBeNull()
    })

    it('filters out empty objects', () => {
      const claims = {
        id_token: { name: null },
        userinfo: {},
      }
      const result = buildClaimsParameter(claims)
      expect(result).toBe('{"id_token":{"name":null}}')
    })
  })

  describe('parseClaimsParameter', () => {
    it('parses valid claims JSON', () => {
      const claimsString = '{"id_token":{"name":null,"email":{"essential":true}}}'
      const result = parseClaimsParameter(claimsString)
      expect(result).toEqual({
        id_token: {
          name: null,
          email: { essential: true },
        },
      })
    })

    it('parses claims with both id_token and userinfo', () => {
      const claimsString = '{"id_token":{"email":null},"userinfo":{"name":null}}'
      const result = parseClaimsParameter(claimsString)
      expect(result).toEqual({
        id_token: { email: null },
        userinfo: { name: null },
      })
    })

    it('returns null for invalid JSON', () => {
      expect(parseClaimsParameter('not valid json')).toBeNull()
      expect(parseClaimsParameter('{incomplete')).toBeNull()
    })

    it('returns null for non-object JSON', () => {
      expect(parseClaimsParameter('"string"')).toBeNull()
      expect(parseClaimsParameter('123')).toBeNull()
      expect(parseClaimsParameter('null')).toBeNull()
      expect(parseClaimsParameter('[]')).toBeNull()
    })

    it('handles empty object', () => {
      expect(parseClaimsParameter('{}')).toEqual({})
    })
  })

  describe('constants', () => {
    it('exports OPENID_SCOPE constant', () => {
      expect(OPENID_SCOPE).toBe('openid')
    })

    it('exports STANDARD_OIDC_SCOPES', () => {
      expect(STANDARD_OIDC_SCOPES).toEqual(['openid', 'profile', 'email', 'address', 'phone'])
    })
  })

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

      const [error, result] = await fetchOpenIDConnectDiscovery('https://example.com')

      expect(error).toBeNull()
      expect(result).toEqual(mockDiscovery)
      expect(global.fetch).toHaveBeenCalledWith('https://example.com/.well-known/openid-configuration')
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

      const [error, result] = await fetchOpenIDConnectDiscovery('https://example.com/')

      expect(error).toBeNull()
      expect(result).toEqual(mockDiscovery)
      expect(global.fetch).toHaveBeenCalledWith('https://example.com/.well-known/openid-configuration')
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

      const [error, result] = await fetchOpenIDConnectDiscovery('https://example.com/.well-known/openid-configuration')

      expect(error).toBeNull()
      expect(result).toEqual(mockDiscovery)
      expect(global.fetch).toHaveBeenCalledWith('https://example.com/.well-known/openid-configuration')
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

      const [error, result] = await fetchOpenIDConnectDiscovery('https://example.com')

      expect(error).not.toBeNull()
      expect(error?.message).toContain('404')
      expect(result).toBeNull()
    })

    it('validates discovery document has required endpoints', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      })

      const [error, result] = await fetchOpenIDConnectDiscovery('https://example.com')

      expect(error).not.toBeNull()
      expect(error?.message).toContain('missing required endpoints')
      expect(result).toBeNull()
    })

    it('handles network errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      const [error, result] = await fetchOpenIDConnectDiscovery('https://example.com')

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

      const [error, result] = await fetchOpenIDConnectDiscovery('https://example.com')

      expect(error).toBeNull()
      expect(result?.scopes_supported).toEqual(['openid', 'profile', 'email'])
    })

    it('parses response_types_supported from discovery document', async () => {
      const mockDiscovery: OpenIDConnectDiscovery = {
        authorization_endpoint: 'https://example.com/authorize',
        token_endpoint: 'https://example.com/token',
        response_types_supported: ['code', 'token', 'id_token', 'code id_token'],
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockDiscovery,
      })

      const [error, result] = await fetchOpenIDConnectDiscovery('https://example.com')

      expect(error).toBeNull()
      expect(result?.response_types_supported).toEqual(['code', 'token', 'id_token', 'code id_token'])
    })

    it('parses claims_supported from discovery document', async () => {
      const mockDiscovery: OpenIDConnectDiscovery = {
        authorization_endpoint: 'https://example.com/authorize',
        token_endpoint: 'https://example.com/token',
        claims_supported: ['sub', 'name', 'email', 'picture', 'locale'],
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockDiscovery,
      })

      const [error, result] = await fetchOpenIDConnectDiscovery('https://example.com')

      expect(error).toBeNull()
      expect(result?.claims_supported).toEqual(['sub', 'name', 'email', 'picture', 'locale'])
    })

    it('parses claims_parameter_supported from discovery document', async () => {
      const mockDiscovery: OpenIDConnectDiscovery = {
        authorization_endpoint: 'https://example.com/authorize',
        token_endpoint: 'https://example.com/token',
        claims_parameter_supported: true,
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockDiscovery,
      })

      const [error, result] = await fetchOpenIDConnectDiscovery('https://example.com')

      expect(error).toBeNull()
      expect(result?.claims_parameter_supported).toBe(true)
    })

    it('parses full OIDC discovery document', async () => {
      const mockDiscovery: OpenIDConnectDiscovery = {
        issuer: 'https://example.com',
        authorization_endpoint: 'https://example.com/authorize',
        token_endpoint: 'https://example.com/token',
        userinfo_endpoint: 'https://example.com/userinfo',
        jwks_uri: 'https://example.com/.well-known/jwks.json',
        scopes_supported: ['openid', 'profile', 'email', 'address', 'phone'],
        response_types_supported: ['code', 'id_token', 'code id_token'],
        grant_types_supported: ['authorization_code', 'implicit', 'refresh_token'],
        claims_supported: ['sub', 'name', 'email', 'email_verified', 'picture'],
        claims_parameter_supported: true,
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockDiscovery,
      })

      const [error, result] = await fetchOpenIDConnectDiscovery('https://example.com')

      expect(error).toBeNull()
      expect(result).toEqual(mockDiscovery)
    })
  })

  describe('openIDConnectDiscoveryToOAuth2Flows', () => {
    it('creates an authorization code flow when supported and prefers it by default', () => {
      const discovery: OpenIDConnectDiscovery = {
        authorization_endpoint: 'https://example.com/oauth2/authorize',
        token_endpoint: 'https://example.com/oauth2/token',
        grant_types_supported: ['authorization_code', 'implicit'],
        response_types_supported: ['code', 'id_token token'],
        scopes_supported: ['profile', 'email'],
      }

      const result = openIDConnectDiscoveryToOAuth2Flows(discovery)

      expect(result.type).toBe('authorizationCode')
      expect(result.flows.authorizationCode).toBeDefined()
      expect(result.flows.authorizationCode?.authorizationUrl).toBe('https://example.com/oauth2/authorize')
      expect(result.flows.authorizationCode?.tokenUrl).toBe('https://example.com/oauth2/token')
      expect(result.flows.authorizationCode?.['x-scalar-secret-client-id']).toBe('')
      expect(result.flows.authorizationCode?.['x-scalar-secret-client-secret']).toBe('')
      expect(result.flows.authorizationCode?.['x-scalar-secret-redirect-uri']).toBe('')
      expect(result.selectedScopes).toEqual(['openid', 'profile', 'email'])
    })

    it('creates an implicit flow when only authorization endpoint is available', () => {
      const discovery: OpenIDConnectDiscovery = {
        authorization_endpoint: 'https://example.com/oauth2/authorize',
        grant_types_supported: ['implicit'],
        response_types_supported: ['id_token token'],
        scopes_supported: ['openid', 'profile'],
      }

      const result = openIDConnectDiscoveryToOAuth2Flows(discovery)

      expect(result.type).toBe('implicit')
      expect(result.flows.implicit).toBeDefined()
      expect(result.flows.implicit?.authorizationUrl).toBe('https://example.com/oauth2/authorize')
      expect(result.flows.implicit?.['x-scalar-secret-client-id']).toBe('')
      expect(result.flows.implicit?.['x-scalar-secret-redirect-uri']).toBe('')
      expect(result.flows.implicit?.['x-scalar-secret-token']).toBe('')
      expect(result.selectedScopes).toEqual(['openid', 'profile'])
    })

    it('creates a client credentials flow when token endpoint and grant type support it', () => {
      const discovery: OpenIDConnectDiscovery = {
        token_endpoint: 'https://example.com/oauth2/token',
        grant_types_supported: ['client_credentials'],
        scopes_supported: ['api.read'],
      }

      const result = openIDConnectDiscoveryToOAuth2Flows(discovery)

      expect(result.type).toBe('clientCredentials')
      expect(result.flows.clientCredentials).toBeDefined()
      expect(result.flows.clientCredentials?.tokenUrl).toBe('https://example.com/oauth2/token')
      expect(result.flows.clientCredentials?.['x-scalar-secret-client-id']).toBe('')
      expect(result.flows.clientCredentials?.['x-scalar-secret-client-secret']).toBe('')
      expect(result.selectedScopes).toEqual(['openid', 'api.read'])
    })

    it('falls back to authorization code when grant_types_supported is omitted', () => {
      const discovery: OpenIDConnectDiscovery = {
        authorization_endpoint: 'https://example.com/oauth2/authorize',
        token_endpoint: 'https://example.com/oauth2/token',
        response_types_supported: ['code'],
      }

      const result = openIDConnectDiscoveryToOAuth2Flows(discovery)

      expect(result.type).toBe('authorizationCode')
      expect(result.flows.authorizationCode).toBeDefined()
      expect(result.flows.authorizationCode?.authorizationUrl).toBe('https://example.com/oauth2/authorize')
      expect(result.flows.authorizationCode?.tokenUrl).toBe('https://example.com/oauth2/token')
      expect(result.selectedScopes).toEqual(['openid'])
    })

    it('deduplicates and normalizes selected scopes with openid included', () => {
      const discovery: OpenIDConnectDiscovery = {
        token_endpoint: 'https://example.com/oauth2/token',
        grant_types_supported: ['client_credentials'],
        scopes_supported: ['profile', 'profile', ' email ', 'openid'],
      }

      const result = openIDConnectDiscoveryToOAuth2Flows(discovery)

      expect(result.selectedScopes).toEqual(['profile', 'email', 'openid'])
      expect(result.flows.clientCredentials?.scopes).toEqual({
        profile: '',
        email: '',
        openid: '',
      })
    })
  })
})
