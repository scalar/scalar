import type { AuthStore } from '@scalar/workspace-store/entities/auth/index'
import type { SecuritySchemeObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { decode } from 'js-base64'
import { describe, expect, it } from 'vitest'

import { getSecrets } from './get-secrets'

describe('getSecrets', () => {
  const mockDocumentSlug = 'test-doc'

  // Helper to create a mock auth store with custom secret returns
  const createMockAuthStore = (secretsMap: Record<string, any>): AuthStore => ({
    getAuthSecrets: (_docName, schemeName) => secretsMap[schemeName] || undefined,
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

  describe('apiKey security schemes', () => {
    it('should extract secret token from apiKey scheme', () => {
      const securitySchemes: { scheme: SecuritySchemeObject; name: string }[] = [
        {
          scheme: {
            type: 'apiKey',
            name: 'X-API-Key',
            in: 'header',
          },
          name: 'apiKeyAuth',
        },
      ]

      const mockAuthStore = createMockAuthStore({
        apiKeyAuth: {
          type: 'apiKey',
          'x-scalar-secret-token': 'api-key-secret-123',
        },
      })

      const result = getSecrets(securitySchemes, mockAuthStore, mockDocumentSlug)

      expect(result).toEqual(['api-key-secret-123'])
    })

    it('should handle apiKey scheme without secret token', () => {
      const securitySchemes: { scheme: SecuritySchemeObject; name: string }[] = [
        {
          scheme: {
            type: 'apiKey',
            name: 'X-API-Key',
            in: 'header',
          },
          name: 'apiKeyAuth',
        },
      ]

      const mockAuthStore = createMockAuthStore({
        apiKeyAuth: {
          type: 'apiKey',
          'x-scalar-secret-token': '',
        },
      })

      const result = getSecrets(securitySchemes, mockAuthStore, mockDocumentSlug)
      expect(result).toEqual([])
    })

    it('should handle multiple apiKey schemes', () => {
      const securitySchemes: { scheme: SecuritySchemeObject; name: string }[] = [
        {
          scheme: {
            type: 'apiKey',
            name: 'X-API-Key',
            in: 'header',
          },
          name: 'apiKeyAuth1',
        },
        {
          scheme: {
            type: 'apiKey',
            name: 'X-Custom-Key',
            in: 'query',
          },
          name: 'apiKeyAuth2',
        },
      ]

      const mockAuthStore = createMockAuthStore({
        apiKeyAuth1: {
          type: 'apiKey',
          'x-scalar-secret-token': 'api-key-secret-1',
        },
        apiKeyAuth2: {
          type: 'apiKey',
          'x-scalar-secret-token': 'api-key-secret-2',
        },
      })

      const result = getSecrets(securitySchemes, mockAuthStore, mockDocumentSlug)

      expect(result).toEqual(['api-key-secret-1', 'api-key-secret-2'])
    })
  })

  describe('http security schemes', () => {
    it('should extract all secrets from http scheme with basic auth', () => {
      const securitySchemes: { scheme: SecuritySchemeObject; name: string }[] = [
        {
          scheme: {
            type: 'http',
            scheme: 'basic',
          },
          name: 'basicAuth',
        },
      ]

      const mockAuthStore = createMockAuthStore({
        basicAuth: {
          type: 'http',
          'x-scalar-secret-token': 'http-token-secret',
          'x-scalar-secret-username': 'testuser',
          'x-scalar-secret-password': 'testpass',
        },
      })

      const result = getSecrets(securitySchemes, mockAuthStore, mockDocumentSlug)

      expect(result).toEqual([
        'http-token-secret',
        'testuser',
        'testpass',
        'dGVzdHVzZXI6dGVzdHBhc3M=', // base64 encoded "testuser:testpass"
      ])
    })

    it('should extract all secrets from http scheme with bearer auth', () => {
      const securitySchemes: { scheme: SecuritySchemeObject; name: string }[] = [
        {
          scheme: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
          name: 'bearerAuth',
        },
      ]

      const mockAuthStore = createMockAuthStore({
        bearerAuth: {
          type: 'http',
          'x-scalar-secret-token': 'bearer-token-secret',
          'x-scalar-secret-username': 'beareruser',
          'x-scalar-secret-password': 'bearerpass',
        },
      })

      const result = getSecrets(securitySchemes, mockAuthStore, mockDocumentSlug)

      expect(result).toEqual([
        'bearer-token-secret',
        'beareruser',
        'bearerpass',
        'YmVhcmVydXNlcjpiZWFyZXJwYXNz', // base64 encoded "beareruser:bearerpass"
      ])
    })

    it('should handle http scheme with missing secrets', () => {
      const securitySchemes: { scheme: SecuritySchemeObject; name: string }[] = [
        {
          scheme: {
            type: 'http',
            scheme: 'basic',
          },
          name: 'basicAuth',
        },
      ]

      const mockAuthStore = createMockAuthStore({
        basicAuth: {
          type: 'http',
          'x-scalar-secret-token': '',
          'x-scalar-secret-username': '',
          'x-scalar-secret-password': '',
        },
      })

      const result = getSecrets(securitySchemes, mockAuthStore, mockDocumentSlug)

      expect(result).toEqual([
        'Og==', // base64 encoded ":"
      ])
    })

    it('should handle http scheme with partial secrets', () => {
      const securitySchemes: { scheme: SecuritySchemeObject; name: string }[] = [
        {
          scheme: {
            type: 'http',
            scheme: 'basic',
          },
          name: 'basicAuth',
        },
      ]

      const mockAuthStore = createMockAuthStore({
        basicAuth: {
          type: 'http',
          'x-scalar-secret-token': '',
          'x-scalar-secret-username': 'partialuser',
          'x-scalar-secret-password': '',
        },
      })

      const result = getSecrets(securitySchemes, mockAuthStore, mockDocumentSlug)

      expect(result).toEqual([
        'partialuser',
        'cGFydGlhbHVzZXI6', // base64 encoded "partialuser:"
      ])
    })
  })

  describe('oauth2 security schemes', () => {
    it('should extract secrets from oauth2 scheme with single flow', () => {
      const securitySchemes: { scheme: SecuritySchemeObject; name: string }[] = [
        {
          scheme: {
            type: 'oauth2',
            flows: {
              authorizationCode: {
                refreshUrl: '',
                authorizationUrl: 'https://example.com/oauth/authorize',
                tokenUrl: 'https://example.com/oauth/token',
                scopes: { read: 'Read access' },
                'x-usePkce': 'no',
              },
            },
          },
          name: 'oauth2Auth',
        },
      ]

      const mockAuthStore = createMockAuthStore({
        oauth2Auth: {
          type: 'oauth2',
          authorizationCode: {
            'x-scalar-secret-token': 'oauth-token-secret-1',
            'x-scalar-secret-client-id': '',
            'x-scalar-secret-client-secret': '',
            'x-scalar-secret-redirect-uri': '',
          },
        },
      })

      const result = getSecrets(securitySchemes, mockAuthStore, mockDocumentSlug)

      expect(result).toEqual(['oauth-token-secret-1'])
    })

    it('should extract secrets from oauth2 scheme with multiple flows', () => {
      const securitySchemes: { scheme: SecuritySchemeObject; name: string }[] = [
        {
          scheme: {
            type: 'oauth2',
            flows: {
              authorizationCode: {
                refreshUrl: '',
                authorizationUrl: 'https://example.com/oauth/authorize',
                tokenUrl: 'https://example.com/oauth/token',
                scopes: { read: 'Read access' },
                'x-usePkce': 'no',
              },
              clientCredentials: {
                refreshUrl: '',
                tokenUrl: 'https://example.com/oauth/token',
                scopes: { write: 'Write access' },
              },
              password: {
                refreshUrl: '',
                tokenUrl: 'https://example.com/oauth/token',
                scopes: { admin: 'Admin access' },
              },
            },
          },
          name: 'oauth2Auth',
        },
      ]

      const mockAuthStore = createMockAuthStore({
        oauth2Auth: {
          type: 'oauth2',
          authorizationCode: {
            'x-scalar-secret-token': 'oauth-token-secret-1',
            'x-scalar-secret-client-id': '',
            'x-scalar-secret-client-secret': '',
            'x-scalar-secret-redirect-uri': '',
          },
          clientCredentials: {
            'x-scalar-secret-token': 'oauth-token-secret-2',
            'x-scalar-secret-client-id': '',
            'x-scalar-secret-client-secret': '',
          },
          password: {
            'x-scalar-secret-token': 'oauth-token-secret-3',
            'x-scalar-secret-client-id': '',
            'x-scalar-secret-client-secret': '',
            'x-scalar-secret-username': '',
            'x-scalar-secret-password': '',
          },
        },
      })

      const result = getSecrets(securitySchemes, mockAuthStore, mockDocumentSlug)

      expect(result).toEqual(['oauth-token-secret-1', 'oauth-token-secret-2', 'oauth-token-secret-3'])
    })

    it('should handle oauth2 scheme with flows without secret tokens', () => {
      const securitySchemes: { scheme: SecuritySchemeObject; name: string }[] = [
        {
          scheme: {
            type: 'oauth2',
            flows: {
              authorizationCode: {
                refreshUrl: '',
                authorizationUrl: 'https://example.com/oauth/authorize',
                tokenUrl: 'https://example.com/oauth/token',
                scopes: { read: 'Read access' },
                'x-usePkce': 'no',
              },
            },
          },
          name: 'oauth2Auth',
        },
      ]

      const mockAuthStore = createMockAuthStore({
        oauth2Auth: {
          type: 'oauth2',
          authorizationCode: {
            'x-scalar-secret-token': '',
            'x-scalar-secret-client-id': '',
            'x-scalar-secret-client-secret': '',
            'x-scalar-secret-redirect-uri': '',
          },
        },
      })

      const result = getSecrets(securitySchemes, mockAuthStore, mockDocumentSlug)
      expect(result).toEqual([])
    })

    it('should handle oauth2 scheme with empty flows object', () => {
      const securitySchemes: { scheme: SecuritySchemeObject; name: string }[] = [
        {
          scheme: {
            type: 'oauth2',
            flows: {},
          },
          name: 'oauth2Auth',
        },
      ]

      const mockAuthStore = createMockAuthStore({
        oauth2Auth: {
          type: 'oauth2',
        },
      })

      const result = getSecrets(securitySchemes, mockAuthStore, mockDocumentSlug)

      expect(result).toEqual([])
    })
  })

  describe('mixed security schemes', () => {
    it('should handle combination of different security scheme types', () => {
      const securitySchemes: { scheme: SecuritySchemeObject; name: string }[] = [
        {
          scheme: {
            type: 'apiKey',
            name: 'X-API-Key',
            in: 'header',
          },
          name: 'apiKeyAuth',
        },
        {
          scheme: {
            type: 'http',
            scheme: 'bearer',
          },
          name: 'bearerAuth',
        },
        {
          scheme: {
            type: 'oauth2',
            flows: {
              authorizationCode: {
                refreshUrl: '',
                authorizationUrl: 'https://example.com/oauth/authorize',
                tokenUrl: 'https://example.com/oauth/token',
                scopes: { read: 'Read access' },
                'x-usePkce': 'no',
              },
            },
          },
          name: 'oauth2Auth',
        },
      ]

      const mockAuthStore = createMockAuthStore({
        apiKeyAuth: {
          type: 'apiKey',
          'x-scalar-secret-token': 'api-key-secret',
        },
        bearerAuth: {
          type: 'http',
          'x-scalar-secret-token': 'http-token-secret',
          'x-scalar-secret-username': 'httpuser',
          'x-scalar-secret-password': 'httppass',
        },
        oauth2Auth: {
          type: 'oauth2',
          authorizationCode: {
            'x-scalar-secret-token': 'oauth-token-secret',
            'x-scalar-secret-client-id': '',
            'x-scalar-secret-client-secret': '',
            'x-scalar-secret-redirect-uri': '',
          },
        },
      })

      const result = getSecrets(securitySchemes, mockAuthStore, mockDocumentSlug)

      expect(result).toEqual([
        'api-key-secret',
        'http-token-secret',
        'httpuser',
        'httppass',
        'aHR0cHVzZXI6aHR0cHBhc3M=', // base64 encoded "httpuser:httppass"
        'oauth-token-secret',
      ])
    })
  })

  describe('edge cases', () => {
    it('should return empty array for empty input', () => {
      const securitySchemes: { scheme: SecuritySchemeObject; name: string }[] = []

      const mockAuthStore = createMockAuthStore({})

      const result = getSecrets(securitySchemes, mockAuthStore, mockDocumentSlug)

      expect(result).toEqual([])
    })

    it('should handle unknown security scheme type', () => {
      const securitySchemes: { scheme: SecuritySchemeObject; name: string }[] = [
        {
          scheme: {
            type: 'openIdConnect' as any, // unknown type
            openIdConnectUrl: 'https://example.com/.well-known/openid_configuration',
          },
          name: 'oidcAuth',
        },
      ]

      const mockAuthStore = createMockAuthStore({})

      const result = getSecrets(securitySchemes, mockAuthStore, mockDocumentSlug)

      expect(result).toEqual([])
    })

    it('should handle security scheme without type', () => {
      const securitySchemes: { scheme: SecuritySchemeObject; name: string }[] = [
        {
          scheme: {
            // missing type
            name: 'Unknown',
          } as SecuritySchemeObject,
          name: 'unknownAuth',
        },
      ]

      const mockAuthStore = createMockAuthStore({})

      const result = getSecrets(securitySchemes, mockAuthStore, mockDocumentSlug)

      expect(result).toEqual([])
    })

    it('should handle empty string values in http scheme', () => {
      const securitySchemes: { scheme: SecuritySchemeObject; name: string }[] = [
        {
          scheme: {
            type: 'http',
            scheme: 'basic',
          },
          name: 'basicAuth',
        },
      ]

      const mockAuthStore = createMockAuthStore({
        basicAuth: {
          type: 'http',
          'x-scalar-secret-token': '',
          'x-scalar-secret-username': '',
          'x-scalar-secret-password': '',
        },
      })

      const result = getSecrets(securitySchemes, mockAuthStore, mockDocumentSlug)

      expect(result).toEqual([
        'Og==', // base64 encoded ":"
      ])
    })
  })

  describe('base64 encoding verification', () => {
    it('should correctly encode username:password combination', () => {
      const securitySchemes: { scheme: SecuritySchemeObject; name: string }[] = [
        {
          scheme: {
            type: 'http',
            scheme: 'basic',
          },
          name: 'basicAuth',
        },
      ]

      const mockAuthStore = createMockAuthStore({
        basicAuth: {
          type: 'http',
          'x-scalar-secret-token': '',
          'x-scalar-secret-username': 'admin',
          'x-scalar-secret-password': 'secret123',
        },
      })

      const result = getSecrets(securitySchemes, mockAuthStore, mockDocumentSlug)

      // Verify the base64 encoded value is correct
      expect(result[2]).toBe('YWRtaW46c2VjcmV0MTIz') // base64 encoded "admin:secret123"

      // Verify we can decode it back
      const decoded = decode(result[2] || '')
      expect(decoded).toBe('admin:secret123')
    })

    it('should handle special characters in username and password', () => {
      const securitySchemes: { scheme: SecuritySchemeObject; name: string }[] = [
        {
          scheme: {
            type: 'http',
            scheme: 'basic',
          },
          name: 'basicAuth',
        },
      ]

      const mockAuthStore = createMockAuthStore({
        basicAuth: {
          type: 'http',
          'x-scalar-secret-token': '',
          'x-scalar-secret-username': 'user@domain.com',
          'x-scalar-secret-password': 'pass:word!',
        },
      })

      const result = getSecrets(securitySchemes, mockAuthStore, mockDocumentSlug)

      // Verify the base64 encoded value is correct
      expect(result[2]).toBe('dXNlckBkb21haW4uY29tOnBhc3M6d29yZCE=') // base64 encoded "user@domain.com:pass:word!"

      // Verify we can decode it back
      const decoded = decode(result[2] || '')
      expect(decoded).toBe('user@domain.com:pass:word!')
    })
  })
})
