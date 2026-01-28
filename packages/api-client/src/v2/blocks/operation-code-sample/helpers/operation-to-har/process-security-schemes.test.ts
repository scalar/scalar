import type { AuthStore } from '@scalar/workspace-store/entities/auth/index'
import type { SecuritySchemeObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { processSecuritySchemes } from './process-security-schemes'

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

describe('process-security-schemes', () => {
  describe('apiKey security scheme', () => {
    it('processes apiKey in header', () => {
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
          'x-scalar-secret-token': 'test-api-key',
        },
      })

      const result = processSecuritySchemes(securitySchemes, mockAuthStore, 'test-document')

      expect(result.headers).toEqual([
        {
          name: 'X-API-Key',
          value: 'test-api-key',
        },
      ])
    })

    it('processes apiKey in query', () => {
      const securitySchemes: { scheme: SecuritySchemeObject; name: string }[] = [
        {
          scheme: {
            type: 'apiKey',
            name: 'api_key',
            in: 'query',
          },
          name: 'apiKeyAuth',
        },
      ]

      const mockAuthStore = createMockAuthStore({
        apiKeyAuth: {
          type: 'apiKey',
          'x-scalar-secret-token': 'test-query-key',
        },
      })

      const result = processSecuritySchemes(securitySchemes, mockAuthStore, 'test-document')

      expect(result.queryString).toEqual([
        {
          name: 'api_key',
          value: 'test-query-key',
        },
      ])
    })

    it('processes apiKey in cookie', () => {
      const securitySchemes: { scheme: SecuritySchemeObject; name: string }[] = [
        {
          scheme: {
            type: 'apiKey',
            name: 'session',
            in: 'cookie',
          },
          name: 'apiKeyAuth',
        },
      ]

      const mockAuthStore = createMockAuthStore({
        apiKeyAuth: {
          type: 'apiKey',
          'x-scalar-secret-token': 'test-cookie-value',
        },
      })

      const result = processSecuritySchemes(securitySchemes, mockAuthStore, 'test-document')

      expect(result.cookies).toEqual([
        {
          name: 'session',
          value: 'test-cookie-value',
        },
      ])
    })
  })

  describe('http security scheme', () => {
    it('processes basic auth', () => {
      const securitySchemes: { scheme: SecuritySchemeObject; name: string }[] = [
        {
          name: 'basicAuth',
          scheme: {
            type: 'http',
            scheme: 'basic',
          },
        },
      ]
      const mockAuthStore = createMockAuthStore({
        basicAuth: {
          type: 'http',
          'x-scalar-secret-username': 'testuser',
          'x-scalar-secret-password': 'testpass',
          'x-scalar-secret-token': 'test-basic-token',
        },
      })

      const result = processSecuritySchemes(securitySchemes, mockAuthStore, 'test-document')

      expect(result.headers).toEqual([
        {
          name: 'Authorization',
          value: 'Basic dGVzdHVzZXI6dGVzdHBhc3M=',
        },
      ])
    })

    it('processes bearer auth', () => {
      const securitySchemes: { scheme: SecuritySchemeObject; name: string }[] = [
        {
          scheme: {
            type: 'http',
            scheme: 'bearer',
          },
          name: 'bearerAuth',
        },
      ]

      const mockAuthStore = createMockAuthStore({
        bearerAuth: {
          type: 'http',
          'x-scalar-secret-token': 'test-bearer-token',
        },
      })

      const result = processSecuritySchemes(securitySchemes, mockAuthStore, 'test-document')

      expect(result.headers).toEqual([
        {
          name: 'Authorization',
          value: 'Bearer test-bearer-token',
        },
      ])
    })
  })

  describe('oauth2 security scheme', () => {
    it('processes oauth2 with client credentials flow', () => {
      const securitySchemes: { scheme: SecuritySchemeObject; name: string }[] = [
        {
          name: 'oauth2Auth',
          scheme: {
            type: 'oauth2',
            flows: {
              clientCredentials: {
                tokenUrl: 'https://oauth.example.com/token',
                refreshUrl: '',
                scopes: {
                  'read:users': 'Read user data',
                  'write:users': 'Write user data',
                },
              },
            },
          },
        },
      ]

      const mockAuthStore = createMockAuthStore({
        oauth2Auth: {
          type: 'oauth2',
          clientCredentials: {
            'x-scalar-secret-token': 'test-oauth-token',
          },
        },
      })

      const result = processSecuritySchemes(securitySchemes, mockAuthStore, 'test-document')

      expect(result.headers).toEqual([
        {
          name: 'Authorization',
          value: 'Bearer test-oauth-token',
        },
      ])
    })

    it('processes oauth2 with password flow', () => {
      const securitySchemes: { scheme: SecuritySchemeObject; name: string }[] = [
        {
          name: 'oauth2Auth',
          scheme: {
            type: 'oauth2',
            flows: {
              password: {
                tokenUrl: 'https://oauth.example.com/token',
                refreshUrl: '',
                scopes: {
                  'read:users': 'Read user data',
                  'write:users': 'Write user data',
                },
              },
            },
          },
        },
      ]

      const mockAuthStore = createMockAuthStore({
        oauth2Auth: {
          type: 'oauth2',
          password: {
            'x-scalar-secret-token': 'test-password-token',
            'x-scalar-secret-client-id': '',
            'x-scalar-secret-client-secret': '',
            'x-scalar-secret-password': '',
            'x-scalar-secret-username': '',
          },
        },
      })

      const result = processSecuritySchemes(securitySchemes, mockAuthStore, 'test-document')

      expect(result.headers).toEqual([
        {
          name: 'Authorization',
          value: 'Bearer test-password-token',
        },
      ])
    })

    it('processes oauth2 with implicit flow', () => {
      const securitySchemes: { scheme: SecuritySchemeObject; name: string }[] = [
        {
          name: 'oauth2Auth',
          scheme: {
            type: 'oauth2',
            flows: {
              implicit: {
                authorizationUrl: 'https://oauth.example.com/authorize',
                refreshUrl: '',
                scopes: {
                  'read:users': 'Read user data',
                  'write:users': 'Write user data',
                },
              },
            },
          },
        },
      ]

      const mockAuthStore = createMockAuthStore({
        oauth2Auth: {
          type: 'oauth2',
          implicit: {
            'x-scalar-secret-token': 'test-implicit-token',
            'x-scalar-secret-client-id': '',
            'x-scalar-secret-redirect-uri': '',
          },
        },
      })

      const result = processSecuritySchemes(securitySchemes, mockAuthStore, 'test-document')

      expect(result.headers).toEqual([
        {
          name: 'Authorization',
          value: 'Bearer test-implicit-token',
        },
      ])
    })

    it('processes oauth2 with authorization code flow', () => {
      const securitySchemes: { scheme: SecuritySchemeObject; name: string }[] = [
        {
          name: 'oauth2Auth',
          scheme: {
            type: 'oauth2',
            flows: {
              authorizationCode: {
                authorizationUrl: 'https://oauth.example.com/authorize',
                tokenUrl: 'https://oauth.example.com/token',
                refreshUrl: '',
                scopes: {
                  'read:users': 'Read user data',
                  'write:users': 'Write user data',
                },

                'x-usePkce': 'no',
              },
            },
          },
        },
      ]

      const mockAuthStore = createMockAuthStore({
        oauth2Auth: {
          type: 'oauth2',
          authorizationCode: {
            'x-scalar-secret-token': 'test-auth-code-token',
            'x-scalar-secret-client-id': '',
            'x-scalar-secret-client-secret': '',
            'x-scalar-secret-redirect-uri': '',
          },
        },
      })

      const result = processSecuritySchemes(securitySchemes, mockAuthStore, 'test-document')

      expect(result.headers).toEqual([
        {
          name: 'Authorization',
          value: 'Bearer test-auth-code-token',
        },
      ])
    })

    it('processes oauth2 with multiple flows', () => {
      const securitySchemes: { scheme: SecuritySchemeObject; name: string }[] = [
        {
          name: 'oauth2Auth',
          scheme: {
            type: 'oauth2',
            flows: {
              clientCredentials: {
                tokenUrl: 'https://oauth.example.com/token',
                refreshUrl: '',
                scopes: {
                  'read:users': 'Read user data',
                },
              },
              password: {
                tokenUrl: 'https://oauth.example.com/token',
                refreshUrl: '',
                scopes: {
                  'write:users': 'Write user data',
                },
              },
            },
          },
        },
      ]

      const mockAuthStore = createMockAuthStore({
        oauth2Auth: {
          type: 'oauth2',
          clientCredentials: {
            'x-scalar-secret-token': 'test-client-token',
            'x-scalar-secret-client-id': '',
            'x-scalar-secret-client-secret': '',
          },
          password: {
            'x-scalar-secret-token': 'test-password-token',
            'x-scalar-secret-client-id': '',
            'x-scalar-secret-client-secret': '',
            'x-scalar-secret-password': '',
            'x-scalar-secret-username': '',
          },
        },
      })

      const result = processSecuritySchemes(securitySchemes, mockAuthStore, 'test-document')

      // Should use the first flow's token (client credentials in this case)
      expect(result.headers).toEqual([
        {
          name: 'Authorization',
          value: 'Bearer test-client-token',
        },
      ])
    })
  })

  describe('multiple security schemes', () => {
    it('processes multiple security schemes', () => {
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
      ]

      const mockAuthStore = createMockAuthStore({
        apiKeyAuth: {
          type: 'apiKey',
          'x-scalar-secret-token': 'test-api-key',
        },
        bearerAuth: {
          type: 'http',
          'x-scalar-secret-token': 'test-bearer-token',
        },
      })

      const result = processSecuritySchemes(securitySchemes, mockAuthStore, 'test-document')

      expect(result.headers).toEqual([
        {
          name: 'X-API-Key',
          value: 'test-api-key',
        },
        {
          name: 'Authorization',
          value: 'Bearer test-bearer-token',
        },
      ])
    })
  })

  describe('empty schemes', () => {
    it('handles empty security schemes array', () => {
      const securitySchemes: { scheme: SecuritySchemeObject; name: string }[] = []

      const mockAuthStore = createMockAuthStore({})

      const result = processSecuritySchemes(securitySchemes, mockAuthStore, 'test-document')

      expect(result.headers).toHaveLength(0)
      expect(result.queryString).toHaveLength(0)
      expect(result.cookies).toHaveLength(0)
    })

    it('handles apiKeys without x-scalar-secrets', () => {
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
            type: 'apiKey',
            name: 'api-key',
            in: 'query',
          },
          name: 'apiKeyAuth',
        },
        {
          scheme: {
            type: 'apiKey',
            name: 'session',
            in: 'cookie',
          },
          name: 'apiKeyAuth',
        },
      ]

      const mockAuthStore = createMockAuthStore({
        apiKeyAuth: {
          type: 'apiKey',
          'x-scalar-secret-token': 'YOUR_SECRET_TOKEN',
        },
      })

      const result = processSecuritySchemes(securitySchemes, mockAuthStore, 'test-document')

      expect(result.headers).toEqual([{ name: 'X-API-Key', value: 'YOUR_SECRET_TOKEN' }])
      expect(result.queryString).toEqual([{ name: 'api-key', value: 'YOUR_SECRET_TOKEN' }])
      expect(result.cookies).toEqual([{ name: 'session', value: 'YOUR_SECRET_TOKEN' }])
    })

    it('handles http auth without x-scalar-secrets', () => {
      const securitySchemes: { scheme: SecuritySchemeObject; name: string }[] = [
        {
          scheme: {
            type: 'http',
            scheme: 'basic',
          },
          name: 'basicAuth',
        },
        {
          scheme: {
            type: 'http',
            scheme: 'bearer',
          },
          name: 'bearerAuth',
        },
      ]

      const mockAuthStore = createMockAuthStore({
        basicAuth: {
          type: 'http',
          'x-scalar-secret-username': '',
          'x-scalar-secret-password': '',
          'x-scalar-secret-token': '',
        },
      })
      const result = processSecuritySchemes(securitySchemes, mockAuthStore, 'test-document')

      expect(result.headers).toEqual([
        { name: 'Authorization', value: 'Basic username:password' },
        { name: 'Authorization', value: 'Bearer YOUR_SECRET_TOKEN' },
      ])
    })

    it('handles oauth2 without token', () => {
      const securitySchemes: { scheme: SecuritySchemeObject; name: string }[] = [
        {
          name: 'oauth2Auth',
          scheme: {
            type: 'oauth2',
            flows: {
              clientCredentials: {
                tokenUrl: 'https://oauth.example.com/token',
                refreshUrl: '',
                scopes: {
                  'read:users': 'Read user data',
                },
              },
            },
          },
        },
      ]

      const mockAuthStore = createMockAuthStore({
        oauth2Auth: {
          type: 'oauth2',
          clientCredentials: {
            'x-scalar-secret-token': '',
          },
        },
      })

      const result = processSecuritySchemes(securitySchemes, mockAuthStore, 'test-document')
      expect(result.headers).toEqual([{ name: 'Authorization', value: 'Bearer YOUR_SECRET_TOKEN' }])
    })
  })
})
