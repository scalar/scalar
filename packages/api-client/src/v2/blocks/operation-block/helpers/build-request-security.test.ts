import type { AuthStore } from '@scalar/workspace-store/entities/auth/index'
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

import { buildRequestSecurity, getSecuritySchemes } from './build-request-security'

// Helper to create a mock auth store with custom secret returns
const createMockAuthStore = (secretsMap: Record<string, any>): AuthStore => ({
  getAuthSecrets: (_docName: string, schemeName: string) => secretsMap[schemeName] || undefined,
  setAuthSecrets: () => {
    /* no-op */
  },
  clearDocumentAuth: () => {
    /* no-op */
  },
  load: () => {
    /* no-op */
  },
  export: () => ({}),
})

const mockAuthStore = createMockAuthStore({
  apiKeyAuth: {
    type: 'apiKey',
    'x-scalar-secret-token': 'test-key',
  },
  basicAuth: {
    type: 'http',
    'x-scalar-secret-username': 'scalar',
    'x-scalar-secret-password': 'user',
    'x-scalar-secret-token': '',
  },
  oauth2Auth: {
    type: 'oauth2',
    implicit: {
      'x-scalar-secret-token': 'test-token',
      'x-scalar-secret-client-id': '',
      'x-scalar-secret-redirect-uri': '',
    },
  },
})

describe('buildRequestSecurity', () => {
  let apiKey: ApiKeyObject
  let basic: HttpObject
  let oauth2: OAuth2Object
  const documentName = 'test-doc'

  beforeEach(() => {
    apiKey = coerceValue(SecuritySchemeObjectSchema, {
      type: 'apiKey',
      name: 'x-api-key',
      in: 'header',
    }) as ApiKeyObject

    basic = coerceValue(SecuritySchemeObjectSchema, {
      type: 'http',
      scheme: 'basic',
    }) as HttpObject

    oauth2 = coerceValue(SecuritySchemeObjectSchema, {
      type: 'oauth2',
    }) as OAuth2Object
  })

  it('returns empty objects when no security schemes are provided', () => {
    const result = buildRequestSecurity([], mockAuthStore, documentName)

    expect(result.headers).toEqual({})
    expect(result.cookies).toEqual([])
    expect(result.urlParams.toString()).toBe('')
  })

  describe('apiKey security', () => {
    it('handles apiKey in header', () => {
      const result = buildRequestSecurity([{ scheme: apiKey, name: 'apiKeyAuth' }], mockAuthStore, documentName)
      expect(result.headers['x-api-key']).toBe('test-key')
    })

    it('handles apiKey in query', () => {
      apiKey.in = 'query'
      const result = buildRequestSecurity([{ scheme: apiKey, name: 'apiKeyAuth' }], mockAuthStore, documentName)
      expect(result.urlParams.get('x-api-key')).toBe('test-key')
    })

    it('handles apiKey in cookie', () => {
      apiKey.in = 'cookie'
      const result = buildRequestSecurity([{ scheme: apiKey, name: 'apiKeyAuth' }], mockAuthStore, documentName)

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
      const result = buildRequestSecurity([{ scheme: basic, name: 'basicAuth' }], mockAuthStore, documentName)
      expect(result.headers['Authorization']).toBe(`Basic ${encode('scalar:user')}`)
    })

    it('handles basic auth with empty credentials', () => {
      const result = buildRequestSecurity([{ scheme: basic, name: 'basicAuth' }], createMockAuthStore({}), documentName)
      expect(result.headers['Authorization']).toBe('Basic username:password')
    })

    it('handles basic auth with Unicode characters', () => {
      const result = buildRequestSecurity(
        [{ scheme: basic, name: 'basicAuth' }],
        createMockAuthStore({
          basicAuth: {
            type: 'http',
            'x-scalar-secret-username': 'żółć',
            'x-scalar-secret-password': 'тест',
            'x-scalar-secret-token': '',
          },
        }),
        documentName,
      )

      // The credentials are properly encoded as base64
      const expectedBase64 = 'xbzDs8WCxIc60YLQtdGB0YI='
      expect(result.headers['Authorization']).toBe(`Basic ${expectedBase64}`)
    })

    it('handles bearer auth', () => {
      basic.scheme = 'bearer'
      const result = buildRequestSecurity(
        [{ scheme: basic, name: 'bearerAuth' }],
        createMockAuthStore({
          bearerAuth: {
            type: 'http',
            'x-scalar-secret-token': 'test-token',
          },
        }),
        documentName,
      )
      expect(result.headers['Authorization']).toBe('Bearer test-token')
    })
  })

  describe('oauth2 security', () => {
    it('handles oauth2 with token', () => {
      oauth2.flows = {
        implicit: {
          authorizationUrl: 'https://example.com/oauth/authorize',
          scopes: {},
        } as OAuthFlowImplicit,
      }
      const result = buildRequestSecurity(
        [{ scheme: oauth2, name: 'oauth2Auth' }],
        createMockAuthStore({
          oauth2Auth: {
            type: 'oauth2',
            implicit: { 'x-scalar-secret-token': 'test-token' },
          },
        }),
        documentName,
      )
      expect(result.headers['Authorization']).toBe('Bearer test-token')
    })

    it('handles oauth2 without token', () => {
      const result = buildRequestSecurity(
        [{ scheme: oauth2, name: 'oauth2Auth' }],
        createMockAuthStore({}),
        documentName,
      )
      expect(result.headers['Authorization']).toBe('Bearer ')
    })

    it('handles oauth2 with multiple flows with the first token being used', () => {
      oauth2.flows = {
        implicit: {
          authorizationUrl: 'https://example.com/oauth/authorize',
          scopes: {},
        } as OAuthFlowImplicit,
        authorizationCode: {
          authorizationUrl: 'https://example.com/oauth/authorize',
          tokenUrl: 'https://example.com/oauth/token',
          scopes: {},
        } as OAuthFlowAuthorizationCode,
      }

      const result = buildRequestSecurity(
        [{ scheme: oauth2, name: 'oauth2Auth' }],
        createMockAuthStore({
          oauth2Auth: {
            type: 'oauth2',
            authorizationCode: {
              'x-scalar-secret-token': 'test-token-code',
            },
            implicit: {
              'x-scalar-secret-token': 'test-token-implicit',
            },
          },
        }),
        documentName,
      )
      expect(result.headers['Authorization']).toBe('Bearer test-token-code')
    })
  })

  it('handles empty token placeholder', () => {
    const result = buildRequestSecurity(
      [{ scheme: apiKey, name: 'apiKeyAuth' }],
      createMockAuthStore({}),
      documentName,
      {},
      'NO_VALUE',
    )
    expect(result.headers['x-api-key']).toBe('NO_VALUE')
  })

  describe('environment variable replacement', () => {
    it('replaces environment variables in apiKey token', () => {
      const env = { API_KEY: 'my-secret-key-123' }

      const result = buildRequestSecurity(
        [{ scheme: apiKey, name: 'apiKeyAuth' }],
        createMockAuthStore({
          apiKeyAuth: {
            type: 'apiKey',
            'x-scalar-secret-token': '{{API_KEY}}',
          },
        }),
        documentName,
        env,
      )

      expect(result.headers['x-api-key']).toBe('my-secret-key-123')
    })

    it('replaces environment variables in basic auth credentials', () => {
      const env = { USERNAME: 'admin', PASSWORD: 'super-secret' }

      const result = buildRequestSecurity(
        [{ scheme: basic, name: 'basicAuth' }],
        createMockAuthStore({
          basicAuth: {
            type: 'http',
            'x-scalar-secret-username': '{{USERNAME}}',
            'x-scalar-secret-password': '{{PASSWORD}}',
          },
        }),
        documentName,
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
      }) as ApiKeyObject

      const multiSchemeAuthStore = createMockAuthStore({
        apiKeyAuth: {
          type: 'apiKey',
          'x-scalar-secret-token': 'test-key',
        },
        apiKeyAuth2: {
          type: 'apiKey',
          'x-scalar-secret-token': 'client-123',
        },
      })

      const result = buildRequestSecurity(
        [
          { scheme: apiKey, name: 'apiKeyAuth' },
          { scheme: apiKey2, name: 'apiKeyAuth2' },
        ],
        multiSchemeAuthStore,
        documentName,
      )

      // Both headers should be present
      expect(result.headers['x-api-key']).toBe('test-key')
      expect(result.headers['x-client-id']).toBe('client-123')
    })

    it('handles apiKey and basic auth together', () => {
      const result = buildRequestSecurity(
        [
          { scheme: apiKey, name: 'apiKeyAuth' },
          { scheme: basic, name: 'basicAuth' },
        ],
        createMockAuthStore({
          apiKeyAuth: {
            type: 'apiKey',
            'x-scalar-secret-token': 'test-key',
          },
          basicAuth: {
            type: 'http',
            'x-scalar-secret-username': 'scalar',
            'x-scalar-secret-password': 'user',
          },
        }),
        documentName,
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
      }) as ApiKeyObject

      // API key in query
      const queryKey = coerceValue(SecuritySchemeObjectSchema, {
        type: 'apiKey',
        name: 'api_key',
        in: 'query',
      }) as ApiKeyObject

      // API key in cookie
      const cookieKey = coerceValue(SecuritySchemeObjectSchema, {
        type: 'apiKey',
        name: 'session',
        in: 'cookie',
      }) as ApiKeyObject

      const locationAuthStore = createMockAuthStore({
        headerKey: {
          type: 'apiKey',
          'x-scalar-secret-token': 'header-key',
        },
        queryKey: {
          type: 'apiKey',
          'x-scalar-secret-token': 'query-key',
        },
        cookieKey: {
          type: 'apiKey',
          'x-scalar-secret-token': 'cookie-value',
        },
      })

      const result = buildRequestSecurity(
        [
          { scheme: headerKey, name: 'headerKey' },
          { scheme: queryKey, name: 'queryKey' },
          { scheme: cookieKey, name: 'cookieKey' },
        ],
        locationAuthStore,
        documentName,
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

describe('getSecuritySchemes', () => {
  it('returns an empty array when no security is selected', () => {
    const securitySchemes = {
      apiKey: coerceValue(SecuritySchemeObjectSchema, {
        type: 'apiKey',
        name: 'x-api-key',
        in: 'header',
      }) as ApiKeyObject,
    }

    const result = getSecuritySchemes(securitySchemes, [])

    expect(result).toEqual([])
  })

  it('returns the correct security schemes when multiple schemes are selected', () => {
    const apiKey = coerceValue(SecuritySchemeObjectSchema, {
      type: 'apiKey',
      name: 'x-api-key',
      in: 'header',
    }) as ApiKeyObject

    const basic = coerceValue(SecuritySchemeObjectSchema, {
      type: 'http',
      scheme: 'basic',
    }) as HttpObject

    const securitySchemes = {
      apiKeyScheme: apiKey,
      basicScheme: basic,
    }

    const selectedSecurity = [{ apiKeyScheme: [], basicScheme: [] }]

    const result = getSecuritySchemes(securitySchemes, selectedSecurity)

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ scheme: apiKey, name: 'apiKeyScheme' })
    expect(result[1]).toEqual({ scheme: basic, name: 'basicScheme' })
  })
})
