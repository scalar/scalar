import { assert, beforeEach, describe, expect, it } from 'vitest'

import type {
  ApiKeyObjectSecret,
  HttpObjectSecret,
  OAuth2ObjectSecret,
  OAuthFlowAuthorizationCodeSecret,
  OAuthFlowImplicitSecret,
  OpenIdConnectObjectSecret,
} from '@/request-example/builder/security/secret-types'

import { buildRequestSecurity } from './build-request-security'

describe('buildRequestSecurity', () => {
  let apiKey: ApiKeyObjectSecret
  let basic: HttpObjectSecret
  let oauth2: OAuth2ObjectSecret

  beforeEach(() => {
    apiKey = {
      type: 'apiKey',
      name: 'x-api-key',
      in: 'header',
      'x-scalar-secret-token': 'test-key',
    } as ApiKeyObjectSecret

    basic = {
      type: 'http',
      scheme: 'basic',
      'x-scalar-secret-username': 'scalar',
      'x-scalar-secret-password': 'user',
    } as HttpObjectSecret

    oauth2 = {
      type: 'oauth2',
    } as OAuth2ObjectSecret
  })

  it('returns empty objects when no security schemes are provided', () => {
    const result = buildRequestSecurity([])

    expect(result).toEqual([])
  })

  describe('apiKey security', () => {
    it('handles apiKey in header', () => {
      const result = buildRequestSecurity([apiKey])
      expect(result).toHaveLength(1)
      assert(result[0])
      expect(result[0].name).toBe('x-api-key')
      expect(result[0].value).toBe('test-key')
      expect(result[0].format).toBeUndefined()
      expect(result[0].in).toBe('header')
    })

    it('handles apiKey in query', () => {
      apiKey.in = 'query'
      const result = buildRequestSecurity([apiKey])
      expect(result).toHaveLength(1)
      assert(result[0])
      expect(result[0].name).toBe('x-api-key')
      expect(result[0].value).toBe('test-key')
      expect(result[0].format).toBeUndefined()
      expect(result[0].in).toBe('query')
    })

    it('handles apiKey in cookie', () => {
      apiKey.in = 'cookie'
      const result = buildRequestSecurity([apiKey])

      expect(result).toHaveLength(1)
      assert(result[0])
      expect(result[0].name).toBe('x-api-key')
      expect(result[0].value).toBe('test-key')
      expect(result[0].format).toBeUndefined()
      expect(result[0].in).toBe('cookie')
    })
  })

  describe('http security', () => {
    it('handles basic auth', () => {
      basic.scheme = 'basic'
      const result = buildRequestSecurity([basic])
      expect(result).toHaveLength(1)
      assert(result[0])
      expect(result[0].name).toBe('Authorization')
      expect(result[0].value).toBe('scalar:user')
      expect(result[0].format).toBe('basic')
      expect(result[0].in).toBe('header')
    })

    it('handles basic auth with empty credentials', () => {
      basic['x-scalar-secret-username'] = ''
      basic['x-scalar-secret-password'] = ''
      const result = buildRequestSecurity([basic])
      expect(result).toHaveLength(1)
      assert(result[0])
      expect(result[0].name).toBe('Authorization')
      expect(result[0].value).toBe('username:password')
      expect(result[0].format).toBe('basic')
      expect(result[0].in).toBe('header')
    })

    it('handles basic auth with Unicode characters', () => {
      basic['x-scalar-secret-username'] = 'żółć'
      basic['x-scalar-secret-password'] = 'тест'

      const result = buildRequestSecurity([basic])

      expect(result).toHaveLength(1)
      assert(result[0])
      expect(result[0].name).toBe('Authorization')
      expect(result[0].value).toBe('żółć:тест')
      expect(result[0].format).toBe('basic')
      expect(result[0].in).toBe('header')
    })

    it('handles bearer auth', () => {
      basic.scheme = 'bearer'
      basic['x-scalar-secret-token'] = 'test-token'
      const result = buildRequestSecurity([basic])
      expect(result).toHaveLength(1)
      assert(result[0])
      expect(result[0].name).toBe('Authorization')
      expect(result[0].value).toBe('test-token')
      expect(result[0].format).toBe('bearer')
      expect(result[0].in).toBe('header')
    })
  })

  describe('oauth2 security', () => {
    it('handles oauth2 with token', () => {
      oauth2.flows = {
        implicit: {
          'x-scalar-secret-token': 'test-token',
        } as OAuthFlowImplicitSecret,
      }
      const result = buildRequestSecurity([oauth2])
      expect(result).toHaveLength(1)
      assert(result[0])
      expect(result[0].name).toBe('Authorization')
      expect(result[0].value).toBe('test-token')
      expect(result[0].format).toBe('bearer')
      expect(result[0].in).toBe('header')
    })

    it('handles oauth2 without token', () => {
      const result = buildRequestSecurity([oauth2])
      expect(result).toHaveLength(1)
      assert(result[0])
      expect(result[0].name).toBe('Authorization')
      expect(result[0].value).toBe('')
      expect(result[0].format).toBe('bearer')
      expect(result[0].in).toBe('header')
    })

    it('handles oauth2 with multiple flows with the first token being used', () => {
      oauth2.flows = {
        implicit: {
          'x-scalar-secret-token': 'test-token-implicit',
        } as OAuthFlowImplicitSecret,
        authorizationCode: {
          'x-scalar-secret-token': 'test-token-code',
        } as OAuthFlowAuthorizationCodeSecret,
      }

      const result = buildRequestSecurity([oauth2])
      expect(result).toHaveLength(1)
      assert(result[0])
      expect(result[0].name).toBe('Authorization')
      expect(result[0].value).toBe('test-token-implicit')
      expect(result[0].format).toBe('bearer')
      expect(result[0].in).toBe('header')
    })
  })

  describe('openIdConnect security', () => {
    it('handles openIdConnect with a token from an authorizationCode flow', () => {
      const openId: OpenIdConnectObjectSecret = {
        type: 'openIdConnect',
        openIdConnectUrl: 'https://example.com/.well-known/openid-configuration',
        flows: {
          authorizationCode: {
            'x-scalar-secret-token': 'oidc-token',
          } as OAuthFlowAuthorizationCodeSecret,
        },
      }

      const result = buildRequestSecurity([openId])
      expect(result).toHaveLength(1)
      assert(result[0])
      expect(result[0].name).toBe('Authorization')
      expect(result[0].value).toBe('oidc-token')
      expect(result[0].format).toBe('bearer')
      expect(result[0].in).toBe('header')
    })

    it('handles openIdConnect with no flows (no token obtained yet)', () => {
      const openId: OpenIdConnectObjectSecret = {
        type: 'openIdConnect',
        openIdConnectUrl: 'https://example.com/.well-known/openid-configuration',
      }

      const result = buildRequestSecurity([openId])
      expect(result).toHaveLength(1)
      assert(result[0])
      expect(result[0].name).toBe('Authorization')
      expect(result[0].value).toBe('')
      expect(result[0].format).toBe('bearer')
      expect(result[0].in).toBe('header')
    })

    it('handles openIdConnect with multiple flows using the first token', () => {
      const openId: OpenIdConnectObjectSecret = {
        type: 'openIdConnect',
        openIdConnectUrl: 'https://example.com/.well-known/openid-configuration',
        flows: {
          implicit: {
            'x-scalar-secret-token': 'oidc-implicit-token',
          } as OAuthFlowImplicitSecret,
          authorizationCode: {
            'x-scalar-secret-token': 'oidc-code-token',
          } as OAuthFlowAuthorizationCodeSecret,
        },
      }

      const result = buildRequestSecurity([openId])
      expect(result).toHaveLength(1)
      assert(result[0])
      expect(result[0].name).toBe('Authorization')
      expect(result[0].value).toBe('oidc-implicit-token')
      expect(result[0].format).toBe('bearer')
      expect(result[0].in).toBe('header')
    })

    it('uses the empty token placeholder when no token is present', () => {
      const openId: OpenIdConnectObjectSecret = {
        type: 'openIdConnect',
        openIdConnectUrl: 'https://example.com/.well-known/openid-configuration',
      }

      const result = buildRequestSecurity([openId], 'NO_TOKEN')
      expect(result).toHaveLength(1)
      assert(result[0])
      expect(result[0].name).toBe('Authorization')
      expect(result[0].value).toBe('NO_TOKEN')
      expect(result[0].format).toBe('bearer')
      expect(result[0].in).toBe('header')
    })
  })

  it('handles empty token placeholder', () => {
    apiKey['x-scalar-secret-token'] = ''
    const result = buildRequestSecurity([apiKey], 'NO_VALUE')
    expect(result).toHaveLength(1)
    assert(result[0])
    expect(result[0].name).toBe('x-api-key')
    expect(result[0].value).toBe('NO_VALUE')
    expect(result[0].format).toBeUndefined()
    expect(result[0].in).toBe('header')
  })

  describe('complex security with multiple schemes', () => {
    it('handles multiple security schemes applied simultaneously', () => {
      // Create a second API key for a different header
      const apiKey2 = {
        type: 'apiKey',
        name: 'x-client-id',
        in: 'header',
        'x-scalar-secret-token': 'client-123',
      } as ApiKeyObjectSecret

      const result = buildRequestSecurity([apiKey, apiKey2])

      // Both headers should be present
      expect(result).toHaveLength(2)
      assert(result[0])
      assert(result[1])
      expect(result[0].name).toBe('x-api-key')
      expect(result[0].value).toBe('test-key')
      expect(result[0].format).toBeUndefined()
      expect(result[0].in).toBe('header')
      expect(result[1].name).toBe('x-client-id')
      expect(result[1].value).toBe('client-123')
      expect(result[1].format).toBeUndefined()
      expect(result[1].in).toBe('header')
    })

    it('handles apiKey and basic auth together', () => {
      const result = buildRequestSecurity([apiKey, basic])

      // Both apiKey header and Authorization header should be present
      expect(result).toHaveLength(2)
      assert(result[0])
      assert(result[1])
      expect(result[0].name).toBe('x-api-key')
      expect(result[0].value).toBe('test-key')
      expect(result[0].format).toBeUndefined()
      expect(result[0].in).toBe('header')
      expect(result[1].name).toBe('Authorization')
      expect(result[1].value).toBe('scalar:user')
      expect(result[1].format).toBe('basic')
      expect(result[1].in).toBe('header')
    })

    it('handles multiple schemes across different locations', () => {
      // API key in header
      const headerKey = {
        type: 'apiKey',
        name: 'x-api-key',
        in: 'header',
        'x-scalar-secret-token': 'header-key',
      } as ApiKeyObjectSecret

      // API key in query
      const queryKey = {
        type: 'apiKey',
        name: 'api_key',
        in: 'query',
        'x-scalar-secret-token': 'query-key',
      } as ApiKeyObjectSecret

      // API key in cookie
      const cookieKey = {
        type: 'apiKey',
        name: 'session',
        in: 'cookie',
        'x-scalar-secret-token': 'cookie-value',
      } as ApiKeyObjectSecret

      const result = buildRequestSecurity([headerKey, queryKey, cookieKey])

      // All three locations should have their respective values
      expect(result).toHaveLength(3)
      assert(result[0])
      assert(result[1])
      assert(result[2])

      // Header key
      expect(result[0].name).toBe('x-api-key')
      expect(result[0].value).toBe('header-key')
      expect(result[0].format).toBeUndefined()
      expect(result[0].in).toBe('header')

      // Query key
      expect(result[1].name).toBe('api_key')
      expect(result[1].value).toBe('query-key')
      expect(result[1].format).toBeUndefined()
      expect(result[1].in).toBe('query')

      // Cookie key
      expect(result[2].name).toBe('session')
      expect(result[2].value).toBe('cookie-value')
      expect(result[2].format).toBeUndefined()
      expect(result[2].in).toBe('cookie')
    })
  })
})
