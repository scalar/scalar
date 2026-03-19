import { encode } from 'js-base64'
import { beforeEach, describe, expect, it } from 'vitest'

import type {
  ApiKeyObjectSecret,
  HttpObjectSecret,
  OAuth2ObjectSecret,
  OAuthFlowAuthorizationCodeSecret,
  OAuthFlowImplicitSecret,
} from '@/v2/blocks/scalar-auth-selector-block/helpers/secret-types'

import { buildRequestSecurity, getSecuritySchemes } from './build-request-security'

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

    expect(result.headers).toEqual({})
    expect(result.cookies).toEqual([])
    expect(result.urlParams.toString()).toBe('')
  })

  describe('apiKey security', () => {
    it('handles apiKey in header', () => {
      const result = buildRequestSecurity([apiKey])
      expect(result.headers['x-api-key']).toBe('test-key')
    })

    it('handles apiKey in query', () => {
      apiKey.in = 'query'
      const result = buildRequestSecurity([apiKey])
      expect(result.urlParams.get('x-api-key')).toBe('test-key')
    })

    it('handles apiKey in cookie', () => {
      apiKey.in = 'cookie'
      const result = buildRequestSecurity([apiKey])

      expect(result.cookies[0]).toEqual({
        name: 'x-api-key',
        value: 'test-key',
        path: '/',
      })
    })
  })

  describe('http security', () => {
    it('handles basic auth', () => {
      basic.scheme = 'basic'
      const result = buildRequestSecurity([basic])
      expect(result.headers['Authorization']).toBe(`Basic ${encode('scalar:user')}`)
    })

    it('handles basic auth with empty credentials', () => {
      basic['x-scalar-secret-username'] = ''
      basic['x-scalar-secret-password'] = ''
      const result = buildRequestSecurity([basic])
      expect(result.headers['Authorization']).toBe('Basic username:password')
    })

    it('handles basic auth with Unicode characters', () => {
      basic['x-scalar-secret-username'] = 'żółć'
      basic['x-scalar-secret-password'] = 'тест'

      const result = buildRequestSecurity([basic])

      // The credentials are properly encoded as base64
      const expectedBase64 = 'xbzDs8WCxIc60YLQtdGB0YI='
      expect(result.headers['Authorization']).toBe(`Basic ${expectedBase64}`)
    })

    it('handles bearer auth', () => {
      basic.scheme = 'bearer'
      basic['x-scalar-secret-token'] = 'test-token'
      const result = buildRequestSecurity([basic])
      expect(result.headers['Authorization']).toBe('Bearer test-token')
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
      expect(result.headers['Authorization']).toBe('Bearer test-token')
    })

    it('handles oauth2 without token', () => {
      const result = buildRequestSecurity([oauth2])
      expect(result.headers['Authorization']).toBe('Bearer ')
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
      expect(result.headers['Authorization']).toBe('Bearer test-token-implicit')
    })
  })

  it('handles empty token placeholder', () => {
    apiKey['x-scalar-secret-token'] = ''
    const result = buildRequestSecurity([apiKey], {}, 'NO_VALUE')
    expect(result.headers['x-api-key']).toBe('NO_VALUE')
  })

  describe('environment variable replacement', () => {
    it('replaces environment variables in apiKey token', () => {
      apiKey['x-scalar-secret-token'] = '{{API_KEY}}'
      const env = { API_KEY: 'my-secret-key-123' }

      const result = buildRequestSecurity([apiKey], env)

      expect(result.headers['x-api-key']).toBe('my-secret-key-123')
    })

    it('replaces environment variables in basic auth credentials', () => {
      basic['x-scalar-secret-username'] = '{{USERNAME}}'
      basic['x-scalar-secret-password'] = '{{PASSWORD}}'
      const env = { USERNAME: 'admin', PASSWORD: 'super-secret' }

      const result = buildRequestSecurity([basic], env)

      expect(result.headers['Authorization']).toBe(`Basic ${encode('admin:super-secret')}`)
    })
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
      expect(result.headers['x-api-key']).toBe('test-key')
      expect(result.headers['x-client-id']).toBe('client-123')
    })

    it('handles apiKey and basic auth together', () => {
      const result = buildRequestSecurity([apiKey, basic])

      // Both apiKey header and Authorization header should be present
      expect(result.headers['x-api-key']).toBe('test-key')
      expect(result.headers['Authorization']).toBe(`Basic ${encode('scalar:user')}`)
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
      expect(result.headers['x-api-key']).toBe('header-key')
      expect(result.urlParams.get('api_key')).toBe('query-key')
      expect(result.cookies[0]).toEqual({
        name: 'session',
        value: 'cookie-value',
        path: '/',
      })
    })
  })
})

describe('getSecuritySchemes', () => {
  it('returns an empty array when no security is selected', () => {
    const securitySchemes = {
      apiKey: {
        type: 'apiKey',
        name: 'x-api-key',
        in: 'header',
        'x-scalar-secret-token': 'test-key',
      } as ApiKeyObjectSecret,
    }

    const result = getSecuritySchemes(securitySchemes, [])

    expect(result).toEqual([])
  })

  it('returns the correct security schemes when multiple schemes are selected', () => {
    const apiKey = {
      type: 'apiKey',
      name: 'x-api-key',
      in: 'header',
      'x-scalar-secret-token': 'test-key',
    } as ApiKeyObjectSecret

    const basic = {
      type: 'http',
      scheme: 'basic',
      'x-scalar-secret-username': 'user',
      'x-scalar-secret-password': 'pass',
    } as HttpObjectSecret

    const securitySchemes = {
      apiKeyScheme: apiKey,
      basicScheme: basic,
    }

    const selectedSecurity = [{ apiKeyScheme: [], basicScheme: [] }]

    const result = getSecuritySchemes(securitySchemes, selectedSecurity)

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual(apiKey)
    expect(result[1]).toEqual(basic)
  })
})
