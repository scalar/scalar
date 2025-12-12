import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import type {
  OAuthFlowAuthorizationCode,
  OAuthFlowImplicit,
} from '@scalar/workspace-store/schemas/v3.1/strict/oauth-flow'
import {
  type ApiKeyObject,
  type HttpObject,
  SecuritySchemeObjectSchema,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { OAuth2Object } from '@scalar/workspace-store/schemas/v3.1/strict/security-scheme'
import { encode } from 'js-base64'
import { beforeEach, describe, expect, it } from 'vitest'

import { buildRequestSecurity } from './build-request-security'

describe('buildRequestSecurity', () => {
  let apiKey: ApiKeyObject
  let basic: HttpObject
  let oauth2: OAuth2Object

  beforeEach(() => {
    apiKey = coerceValue(SecuritySchemeObjectSchema, {
      type: 'apiKey',
      name: 'x-api-key',
      in: 'header',
      'x-scalar-secret-token': 'test-key',
    }) as ApiKeyObject

    basic = coerceValue(SecuritySchemeObjectSchema, {
      type: 'http',
      scheme: 'basic',
      'x-scalar-secret-username': 'scalar',
      'x-scalar-secret-password': 'user',
    }) as HttpObject

    oauth2 = coerceValue(SecuritySchemeObjectSchema, {
      type: 'oauth2',
    }) as OAuth2Object
  })

  it('returns empty objects when no security schemes are provided', () => {
    const result = buildRequestSecurity({}, undefined)

    expect(result.headers).toEqual({})
    expect(result.cookies).toEqual([])
    expect(result.urlParams.toString()).toBe('')
  })

  describe('apiKey security', () => {
    it('handles apiKey in header', () => {
      const result = buildRequestSecurity(
        { apiKeyScheme: apiKey },
        { selectedIndex: 0, selectedSchemes: [{ apiKeyScheme: [] }] },
      )
      expect(result.headers['x-api-key']).toBe('test-key')
    })

    it('handles apiKey in query', () => {
      apiKey.in = 'query'
      const result = buildRequestSecurity(
        { apiKeyScheme: apiKey },
        { selectedIndex: 0, selectedSchemes: [{ apiKeyScheme: [] }] },
      )
      expect(result.urlParams.get('x-api-key')).toBe('test-key')
    })

    it('handles apiKey in cookie', () => {
      apiKey.in = 'cookie'
      const result = buildRequestSecurity(
        { apiKeyScheme: apiKey },
        { selectedIndex: 0, selectedSchemes: [{ apiKeyScheme: [] }] },
      )

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
      const result = buildRequestSecurity(
        { basicScheme: basic },
        { selectedIndex: 0, selectedSchemes: [{ basicScheme: [] }] },
      )
      expect(result.headers['Authorization']).toBe(`Basic ${encode('scalar:user')}`)
    })

    it('handles basic auth with empty credentials', () => {
      basic['x-scalar-secret-username'] = ''
      basic['x-scalar-secret-password'] = ''
      const result = buildRequestSecurity(
        { basicScheme: basic },
        { selectedIndex: 0, selectedSchemes: [{ basicScheme: [] }] },
      )
      expect(result.headers['Authorization']).toBe('Basic username:password')
    })

    it('handles basic auth with Unicode characters', () => {
      basic['x-scalar-secret-username'] = 'żółć'
      basic['x-scalar-secret-password'] = 'тест'

      const result = buildRequestSecurity(
        { basicScheme: basic },
        { selectedIndex: 0, selectedSchemes: [{ basicScheme: [] }] },
      )

      // The credentials are properly encoded as base64
      const expectedBase64 = 'xbzDs8WCxIc60YLQtdGB0YI='
      expect(result.headers['Authorization']).toBe(`Basic ${expectedBase64}`)
    })

    it('handles bearer auth', () => {
      basic.scheme = 'bearer'
      basic['x-scalar-secret-token'] = 'test-token'
      const result = buildRequestSecurity(
        { bearerScheme: basic },
        { selectedIndex: 0, selectedSchemes: [{ bearerScheme: [] }] },
      )
      expect(result.headers['Authorization']).toBe('Bearer test-token')
    })
  })

  describe('oauth2 security', () => {
    it('handles oauth2 with token', () => {
      oauth2.flows = {
        implicit: {
          'x-scalar-secret-token': 'test-token',
        } as OAuthFlowImplicit,
      }
      const result = buildRequestSecurity(
        { oauth2Scheme: oauth2 },
        { selectedIndex: 0, selectedSchemes: [{ oauth2Scheme: [] }] },
      )
      expect(result.headers['Authorization']).toBe('Bearer test-token')
    })

    it('handles oauth2 without token', () => {
      const result = buildRequestSecurity(
        { oauth2Scheme: oauth2 },
        { selectedIndex: 0, selectedSchemes: [{ oauth2Scheme: [] }] },
      )
      expect(result.headers['Authorization']).toBe('Bearer ')
    })

    it('handles oauth2 with multiple flows with the first token being used', () => {
      oauth2.flows = {
        implicit: {
          'x-scalar-secret-token': 'test-token-implicit',
        } as OAuthFlowImplicit,
        authorizationCode: {
          'x-scalar-secret-token': 'test-token-code',
        } as OAuthFlowAuthorizationCode,
      }

      const result = buildRequestSecurity(
        { oauth2Scheme: oauth2 },
        { selectedIndex: 0, selectedSchemes: [{ oauth2Scheme: [] }] },
      )
      expect(result.headers['Authorization']).toBe('Bearer test-token-implicit')
    })
  })

  it('handles empty token placeholder', () => {
    apiKey['x-scalar-secret-token'] = ''
    const result = buildRequestSecurity(
      { apiKeyScheme: apiKey },
      { selectedIndex: 0, selectedSchemes: [{ apiKeyScheme: [] }] },
      {},
      'NO_VALUE',
    )
    expect(result.headers['x-api-key']).toBe('NO_VALUE')
  })

  describe('environment variable replacement', () => {
    it('replaces environment variables in apiKey token', () => {
      apiKey['x-scalar-secret-token'] = '{{API_KEY}}'
      const env = { API_KEY: 'my-secret-key-123' }

      const result = buildRequestSecurity(
        { apiKeyScheme: apiKey },
        { selectedIndex: 0, selectedSchemes: [{ apiKeyScheme: [] }] },
        env,
      )

      expect(result.headers['x-api-key']).toBe('my-secret-key-123')
    })

    it('replaces environment variables in basic auth credentials', () => {
      basic['x-scalar-secret-username'] = '{{USERNAME}}'
      basic['x-scalar-secret-password'] = '{{PASSWORD}}'
      const env = { USERNAME: 'admin', PASSWORD: 'super-secret' }

      const result = buildRequestSecurity(
        { basicScheme: basic },
        { selectedIndex: 0, selectedSchemes: [{ basicScheme: [] }] },
        env,
      )

      expect(result.headers['Authorization']).toBe(`Basic ${encode('admin:super-secret')}`)
    })
  })

  describe('complex security with multiple schemes', () => {
    it('handles multiple security schemes applied simultaneously', () => {
      // Create a second API key for a different header
      const apiKey2 = coerceValue(SecuritySchemeObjectSchema, {
        type: 'apiKey',
        name: 'x-client-id',
        in: 'header',
        'x-scalar-secret-token': 'client-123',
      }) as ApiKeyObject

      const result = buildRequestSecurity(
        { apiKeyScheme: apiKey, clientIdScheme: apiKey2 },
        {
          selectedIndex: 0,
          selectedSchemes: [{ apiKeyScheme: [], clientIdScheme: [] }],
        },
      )

      // Both headers should be present
      expect(result.headers['x-api-key']).toBe('test-key')
      expect(result.headers['x-client-id']).toBe('client-123')
    })

    it('handles apiKey and basic auth together', () => {
      const result = buildRequestSecurity(
        { apiKeyScheme: apiKey, basicScheme: basic },
        {
          selectedIndex: 0,
          selectedSchemes: [{ apiKeyScheme: [], basicScheme: [] }],
        },
      )

      // Both apiKey header and Authorization header should be present
      expect(result.headers['x-api-key']).toBe('test-key')
      expect(result.headers['Authorization']).toBe(`Basic ${encode('scalar:user')}`)
    })

    it('handles multiple schemes across different locations', () => {
      // API key in header
      const headerKey = coerceValue(SecuritySchemeObjectSchema, {
        type: 'apiKey',
        name: 'x-api-key',
        in: 'header',
        'x-scalar-secret-token': 'header-key',
      }) as ApiKeyObject

      // API key in query
      const queryKey = coerceValue(SecuritySchemeObjectSchema, {
        type: 'apiKey',
        name: 'api_key',
        in: 'query',
        'x-scalar-secret-token': 'query-key',
      }) as ApiKeyObject

      // API key in cookie
      const cookieKey = coerceValue(SecuritySchemeObjectSchema, {
        type: 'apiKey',
        name: 'session',
        in: 'cookie',
        'x-scalar-secret-token': 'cookie-value',
      }) as ApiKeyObject

      const result = buildRequestSecurity(
        { headerScheme: headerKey, queryScheme: queryKey, cookieScheme: cookieKey },
        {
          selectedIndex: 0,
          selectedSchemes: [{ headerScheme: [], queryScheme: [], cookieScheme: [] }],
        },
      )

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
