import { describe, it, expect } from 'vitest'

import { processSecuritySchemes } from './process-security-schemes'
import type { SecuritySchemeObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

describe('process-security-schemes', () => {
  describe('apiKey security scheme', () => {
    it('processes apiKey in header', () => {
      const securitySchemes: SecuritySchemeObject[] = [
        {
          type: 'apiKey',
          name: 'X-API-Key',
          in: 'header',
          'x-scalar-secret-token': 'test-api-key',
        },
      ]

      const result = processSecuritySchemes(securitySchemes)

      expect(result.headers).toEqual([
        {
          name: 'X-API-Key',
          value: 'test-api-key',
        },
      ])
    })

    it('processes apiKey in query', () => {
      const securitySchemes: SecuritySchemeObject[] = [
        {
          type: 'apiKey',
          name: 'api_key',
          in: 'query',
          'x-scalar-secret-token': 'test-query-key',
        },
      ]

      const result = processSecuritySchemes(securitySchemes)

      expect(result.queryString).toEqual([
        {
          name: 'api_key',
          value: 'test-query-key',
        },
      ])
    })

    it('processes apiKey in cookie', () => {
      const securitySchemes: SecuritySchemeObject[] = [
        {
          type: 'apiKey',
          name: 'session',
          in: 'cookie',
          'x-scalar-secret-token': 'test-cookie-value',
        },
      ]

      const result = processSecuritySchemes(securitySchemes)

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
      const securitySchemes: SecuritySchemeObject[] = [
        {
          type: 'http',
          scheme: 'basic',
          'x-scalar-secret-username': 'testuser',
          'x-scalar-secret-password': 'testpass',
        },
      ]

      const result = processSecuritySchemes(securitySchemes)

      expect(result.headers).toEqual([
        {
          name: 'Authorization',
          value: 'Basic dGVzdHVzZXI6dGVzdHBhc3M=',
        },
      ])
    })

    it('processes bearer auth', () => {
      const securitySchemes: SecuritySchemeObject[] = [
        {
          type: 'http',
          scheme: 'bearer',
          'x-scalar-secret-token': 'test-bearer-token',
        },
      ]

      const result = processSecuritySchemes(securitySchemes)

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
      const securitySchemes: SecuritySchemeObject[] = [
        {
          type: 'oauth2',
          flows: {
            clientCredentials: {
              tokenUrl: 'https://oauth.example.com/token',
              scopes: {
                'read:users': 'Read user data',
                'write:users': 'Write user data',
              },
              'x-scalar-secret-token': 'test-oauth-token',
            },
          },
        },
      ]

      const result = processSecuritySchemes(securitySchemes)

      expect(result.headers).toEqual([
        {
          name: 'Authorization',
          value: 'Bearer test-oauth-token',
        },
      ])
    })

    it('processes oauth2 with password flow', () => {
      const securitySchemes: SecuritySchemeObject[] = [
        {
          type: 'oauth2',
          flows: {
            password: {
              tokenUrl: 'https://oauth.example.com/token',
              scopes: {
                'read:users': 'Read user data',
                'write:users': 'Write user data',
              },
              'x-scalar-secret-token': 'test-password-token',
            },
          },
        },
      ]

      const result = processSecuritySchemes(securitySchemes)

      expect(result.headers).toEqual([
        {
          name: 'Authorization',
          value: 'Bearer test-password-token',
        },
      ])
    })

    it('processes oauth2 with implicit flow', () => {
      const securitySchemes: SecuritySchemeObject[] = [
        {
          type: 'oauth2',
          flows: {
            implicit: {
              authorizationUrl: 'https://oauth.example.com/authorize',
              scopes: {
                'read:users': 'Read user data',
                'write:users': 'Write user data',
              },
              'x-scalar-secret-token': 'test-implicit-token',
            },
          },
        },
      ]

      const result = processSecuritySchemes(securitySchemes)

      expect(result.headers).toEqual([
        {
          name: 'Authorization',
          value: 'Bearer test-implicit-token',
        },
      ])
    })

    it('processes oauth2 with authorization code flow', () => {
      const securitySchemes: SecuritySchemeObject[] = [
        {
          type: 'oauth2',
          flows: {
            authorizationCode: {
              authorizationUrl: 'https://oauth.example.com/authorize',
              tokenUrl: 'https://oauth.example.com/token',
              scopes: {
                'read:users': 'Read user data',
                'write:users': 'Write user data',
              },
              'x-scalar-secret-token': 'test-auth-code-token',
            },
          },
        },
      ]

      const result = processSecuritySchemes(securitySchemes)

      expect(result.headers).toEqual([
        {
          name: 'Authorization',
          value: 'Bearer test-auth-code-token',
        },
      ])
    })

    it('processes oauth2 with multiple flows', () => {
      const securitySchemes: SecuritySchemeObject[] = [
        {
          type: 'oauth2',
          flows: {
            clientCredentials: {
              tokenUrl: 'https://oauth.example.com/token',
              scopes: {
                'read:users': 'Read user data',
              },
              'x-scalar-secret-token': 'test-client-token',
            },
            password: {
              tokenUrl: 'https://oauth.example.com/token',
              scopes: {
                'write:users': 'Write user data',
              },
              'x-scalar-secret-token': 'test-password-token',
            },
          },
        },
      ]

      const result = processSecuritySchemes(securitySchemes)

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
      const securitySchemes: SecuritySchemeObject[] = [
        {
          type: 'apiKey',
          name: 'X-API-Key',
          in: 'header',
          'x-scalar-secret-token': 'test-api-key',
        },
        {
          type: 'http',
          scheme: 'bearer',
          'x-scalar-secret-token': 'test-bearer-token',
        },
      ]

      const result = processSecuritySchemes(securitySchemes)

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
      const securitySchemes: SecuritySchemeObject[] = []

      const result = processSecuritySchemes(securitySchemes)

      expect(result.headers).toHaveLength(0)
      expect(result.queryString).toHaveLength(0)
      expect(result.cookies).toHaveLength(0)
    })

    it('handles apiKeys without x-scalar-secrets', () => {
      const securitySchemes: SecuritySchemeObject[] = [
        {
          type: 'apiKey',
          name: 'X-API-Key',
          in: 'header',
        },
        {
          type: 'apiKey',
          name: 'api-key',
          in: 'query',
        },
        {
          type: 'apiKey',
          name: 'session',
          in: 'cookie',
        },
      ]

      const result = processSecuritySchemes(securitySchemes)

      expect(result.headers).toEqual([{ name: 'X-API-Key', value: 'YOUR_SECRET_TOKEN' }])
      expect(result.queryString).toEqual([{ name: 'api-key', value: 'YOUR_SECRET_TOKEN' }])
      expect(result.cookies).toEqual([{ name: 'session', value: 'YOUR_SECRET_TOKEN' }])
    })

    it('handles http auth without x-scalar-secrets', () => {
      const securitySchemes: SecuritySchemeObject[] = [
        {
          type: 'http',
          scheme: 'basic',
        },
        {
          type: 'http',
          scheme: 'bearer',
        },
      ]

      const result = processSecuritySchemes(securitySchemes)

      expect(result.headers).toEqual([
        { name: 'Authorization', value: 'Basic username:password' },
        { name: 'Authorization', value: 'Bearer YOUR_SECRET_TOKEN' },
      ])
    })

    it('handles oauth2 without token', () => {
      const securitySchemes: SecuritySchemeObject[] = [
        {
          type: 'oauth2',
          flows: {
            clientCredentials: {
              tokenUrl: 'https://oauth.example.com/token',
              scopes: {
                'read:users': 'Read user data',
              },
            },
          },
        },
      ]

      const result = processSecuritySchemes(securitySchemes)
      expect(result.headers).toEqual([{ name: 'Authorization', value: 'Bearer YOUR_SECRET_TOKEN' }])
    })
  })
})
