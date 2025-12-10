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

  it('should return empty objects when no security schemes are provided', () => {
    const result = buildRequestSecurity()

    expect(result.headers).toEqual({})
    expect(result.cookies).toEqual([])
    expect(result.urlParams.toString()).toBe('')
  })

  describe('apiKey security', () => {
    it('should handle apiKey in header', () => {
      const result = buildRequestSecurity([apiKey])
      expect(result.headers['x-api-key']).toBe('test-key')
    })

    it('should handle apiKey in query', () => {
      apiKey.in = 'query'
      const result = buildRequestSecurity([apiKey])
      expect(result.urlParams.get('x-api-key')).toBe('test-key')
    })

    it('should handle apiKey in cookie', () => {
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
    it('should handle basic auth', () => {
      basic.scheme = 'basic'
      const result = buildRequestSecurity([basic])
      expect(result.headers['Authorization']).toBe(`Basic ${encode('scalar:user')}`)
    })

    it('should handle basic auth with empty credentials', () => {
      basic['x-scalar-secret-username'] = ''
      basic['x-scalar-secret-password'] = ''
      const result = buildRequestSecurity([basic])
      expect(result.headers['Authorization']).toBe('Basic username:password')
    })

    it('should handle basic auth with Unicode characters', () => {
      basic['x-scalar-secret-username'] = 'żółć'
      basic['x-scalar-secret-password'] = 'тест'

      const result = buildRequestSecurity([basic])

      // The credentials should be properly encoded as base64
      const expectedBase64 = 'xbzDs8WCxIc60YLQtdGB0YI='
      expect(result.headers['Authorization']).toBe(`Basic ${expectedBase64}`)
    })

    it('should handle bearer auth', () => {
      basic.scheme = 'bearer'
      basic['x-scalar-secret-token'] = 'test-token'
      const result = buildRequestSecurity([basic])
      expect(result.headers['Authorization']).toBe('Bearer test-token')
    })
  })

  describe('oauth2 security', () => {
    it('should handle oauth2 with token', () => {
      oauth2.flows = {
        implicit: {
          'x-scalar-secret-token': 'test-token',
        } as OAuthFlowImplicit,
      }
      const result = buildRequestSecurity([oauth2])
      expect(result.headers['Authorization']).toBe('Bearer test-token')
    })

    it('should handle oauth2 without token', () => {
      const result = buildRequestSecurity([oauth2])
      expect(result.headers['Authorization']).toBe('Bearer ')
    })

    it('should handle oauth2 with multiple flows with the first token being used', () => {
      oauth2.flows = {
        implicit: {
          'x-scalar-secret-token': 'test-token-implicit',
        } as OAuthFlowImplicit,
        authorizationCode: {
          'x-scalar-secret-token': 'test-token-code',
        } as OAuthFlowAuthorizationCode,
      }

      const result = buildRequestSecurity([oauth2])
      expect(result.headers['Authorization']).toBe('Bearer test-token-implicit')
    })
  })

  it('should handle empty token placeholder', () => {
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
})
