import { describe, expect, it } from 'vitest'
import type { SecuritySchemeObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { getSecrets } from './get-secrets'
import { decode } from 'js-base64'

describe('getSecrets', () => {
  describe('apiKey security schemes', () => {
    it('should extract secret token from apiKey scheme', () => {
      const securitySchemes: SecuritySchemeObject[] = [
        {
          type: 'apiKey',
          name: 'X-API-Key',
          in: 'header',
          'x-scalar-secret-token': 'api-key-secret-123',
        },
      ]

      const result = getSecrets(securitySchemes)

      expect(result).toEqual(['api-key-secret-123'])
    })

    it('should handle apiKey scheme without secret token', () => {
      const securitySchemes: SecuritySchemeObject[] = [
        {
          type: 'apiKey',
          name: 'X-API-Key',
          in: 'header',
        },
      ]

      const result = getSecrets(securitySchemes)
      expect(result).toEqual([])
    })

    it('should handle multiple apiKey schemes', () => {
      const securitySchemes: SecuritySchemeObject[] = [
        {
          type: 'apiKey',
          name: 'X-API-Key',
          in: 'header',
          'x-scalar-secret-token': 'api-key-secret-1',
        },
        {
          type: 'apiKey',
          name: 'X-Custom-Key',
          in: 'query',
          'x-scalar-secret-token': 'api-key-secret-2',
        },
      ]

      const result = getSecrets(securitySchemes)

      expect(result).toEqual(['api-key-secret-1', 'api-key-secret-2'])
    })
  })

  describe('http security schemes', () => {
    it('should extract all secrets from http scheme with basic auth', () => {
      const securitySchemes: SecuritySchemeObject[] = [
        {
          type: 'http',
          scheme: 'basic',
          'x-scalar-secret-token': 'http-token-secret',
          'x-scalar-secret-username': 'testuser',
          'x-scalar-secret-password': 'testpass',
        },
      ]

      const result = getSecrets(securitySchemes)

      expect(result).toEqual([
        'http-token-secret',
        'testuser',
        'testpass',
        'dGVzdHVzZXI6dGVzdHBhc3M=', // base64 encoded "testuser:testpass"
      ])
    })

    it('should extract all secrets from http scheme with bearer auth', () => {
      const securitySchemes: SecuritySchemeObject[] = [
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          'x-scalar-secret-token': 'bearer-token-secret',
          'x-scalar-secret-username': 'beareruser',
          'x-scalar-secret-password': 'bearerpass',
        },
      ]

      const result = getSecrets(securitySchemes)

      expect(result).toEqual([
        'bearer-token-secret',
        'beareruser',
        'bearerpass',
        'YmVhcmVydXNlcjpiZWFyZXJwYXNz', // base64 encoded "beareruser:bearerpass"
      ])
    })

    it('should handle http scheme with missing secrets', () => {
      const securitySchemes: SecuritySchemeObject[] = [
        {
          type: 'http',
          scheme: 'basic',
        },
      ]

      const result = getSecrets(securitySchemes)

      expect(result).toEqual([
        'dW5kZWZpbmVkOnVuZGVmaW5lZA==', // base64 encoded "undefined:undefined"
      ])
    })

    it('should handle http scheme with partial secrets', () => {
      const securitySchemes: SecuritySchemeObject[] = [
        {
          type: 'http',
          scheme: 'basic',
          'x-scalar-secret-username': 'partialuser',
        },
      ]

      const result = getSecrets(securitySchemes)

      expect(result).toEqual([
        'partialuser',
        'cGFydGlhbHVzZXI6dW5kZWZpbmVk', // base64 encoded "partialuser:undefined"
      ])
    })
  })

  describe('oauth2 security schemes', () => {
    it('should extract secrets from oauth2 scheme with single flow', () => {
      const securitySchemes: SecuritySchemeObject[] = [
        {
          type: 'oauth2',
          flows: {
            authorizationCode: {
              authorizationUrl: 'https://example.com/oauth/authorize',
              tokenUrl: 'https://example.com/oauth/token',
              scopes: { read: 'Read access' },
              'x-scalar-secret-token': 'oauth-token-secret-1',
            },
          },
        },
      ]

      const result = getSecrets(securitySchemes)

      expect(result).toEqual(['oauth-token-secret-1'])
    })

    it('should extract secrets from oauth2 scheme with multiple flows', () => {
      const securitySchemes: SecuritySchemeObject[] = [
        {
          type: 'oauth2',
          flows: {
            authorizationCode: {
              authorizationUrl: 'https://example.com/oauth/authorize',
              tokenUrl: 'https://example.com/oauth/token',
              scopes: { read: 'Read access' },
              'x-scalar-secret-token': 'oauth-token-secret-1',
            },
            clientCredentials: {
              tokenUrl: 'https://example.com/oauth/token',
              scopes: { write: 'Write access' },
              'x-scalar-secret-token': 'oauth-token-secret-2',
            },
            password: {
              tokenUrl: 'https://example.com/oauth/token',
              scopes: { admin: 'Admin access' },
              'x-scalar-secret-token': 'oauth-token-secret-3',
            },
          },
        },
      ]

      const result = getSecrets(securitySchemes)

      expect(result).toEqual(['oauth-token-secret-1', 'oauth-token-secret-2', 'oauth-token-secret-3'])
    })

    it('should handle oauth2 scheme with flows without secret tokens', () => {
      const securitySchemes: SecuritySchemeObject[] = [
        {
          type: 'oauth2',
          flows: {
            authorizationCode: {
              authorizationUrl: 'https://example.com/oauth/authorize',
              tokenUrl: 'https://example.com/oauth/token',
              scopes: { read: 'Read access' },
            },
          },
        },
      ]

      const result = getSecrets(securitySchemes)
      expect(result).toEqual([])
    })

    it('should handle oauth2 scheme with empty flows object', () => {
      const securitySchemes: SecuritySchemeObject[] = [
        {
          type: 'oauth2',
          flows: {},
        },
      ]

      const result = getSecrets(securitySchemes)

      expect(result).toEqual([])
    })
  })

  describe('mixed security schemes', () => {
    it('should handle combination of different security scheme types', () => {
      const securitySchemes: SecuritySchemeObject[] = [
        {
          type: 'apiKey',
          name: 'X-API-Key',
          in: 'header',
          'x-scalar-secret-token': 'api-key-secret',
        },
        {
          type: 'http',
          scheme: 'bearer',
          'x-scalar-secret-token': 'http-token-secret',
          'x-scalar-secret-username': 'httpuser',
          'x-scalar-secret-password': 'httppass',
        },
        {
          type: 'oauth2',
          flows: {
            authorizationCode: {
              authorizationUrl: 'https://example.com/oauth/authorize',
              tokenUrl: 'https://example.com/oauth/token',
              scopes: { read: 'Read access' },
              'x-scalar-secret-token': 'oauth-token-secret',
            },
          },
        },
      ]

      const result = getSecrets(securitySchemes)

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
      const securitySchemes: SecuritySchemeObject[] = []

      const result = getSecrets(securitySchemes)

      expect(result).toEqual([])
    })

    it('should handle unknown security scheme type', () => {
      const securitySchemes: SecuritySchemeObject[] = [
        {
          type: 'openIdConnect' as any, // unknown type
          openIdConnectUrl: 'https://example.com/.well-known/openid_configuration',
        },
      ]

      const result = getSecrets(securitySchemes)

      expect(result).toEqual([])
    })

    it('should handle security scheme without type', () => {
      const securitySchemes: SecuritySchemeObject[] = [
        {
          // missing type
          name: 'Unknown',
        } as SecuritySchemeObject,
      ]

      const result = getSecrets(securitySchemes)

      expect(result).toEqual([])
    })

    it('should handle null/undefined values in http scheme', () => {
      const securitySchemes: SecuritySchemeObject[] = [
        {
          type: 'http',
          scheme: 'basic',
          'x-scalar-secret-token': undefined,
          'x-scalar-secret-username': undefined,
          'x-scalar-secret-password': undefined,
        },
      ]

      const result = getSecrets(securitySchemes)

      expect(result).toEqual([
        'dW5kZWZpbmVkOnVuZGVmaW5lZA==', // base64 encoded "undefined:undefined"
      ])
    })

    it('should handle empty string values in http scheme', () => {
      const securitySchemes: SecuritySchemeObject[] = [
        {
          type: 'http',
          scheme: 'basic',
          'x-scalar-secret-token': '',
          'x-scalar-secret-username': '',
          'x-scalar-secret-password': '',
        },
      ]

      const result = getSecrets(securitySchemes)

      expect(result).toEqual([
        '',
        '',
        '',
        'Og==', // base64 encoded ":"
      ])
    })
  })

  describe('base64 encoding verification', () => {
    it('should correctly encode username:password combination', () => {
      const securitySchemes: SecuritySchemeObject[] = [
        {
          type: 'http',
          scheme: 'basic',
          'x-scalar-secret-username': 'admin',
          'x-scalar-secret-password': 'secret123',
        },
      ]

      const result = getSecrets(securitySchemes)

      // Verify the base64 encoded value is correct
      expect(result[2]).toBe('YWRtaW46c2VjcmV0MTIz') // base64 encoded "admin:secret123"

      // Verify we can decode it back
      const decoded = decode(result[2])
      expect(decoded).toBe('admin:secret123')
    })

    it('should handle special characters in username and password', () => {
      const securitySchemes: SecuritySchemeObject[] = [
        {
          type: 'http',
          scheme: 'basic',
          'x-scalar-secret-username': 'user@domain.com',
          'x-scalar-secret-password': 'pass:word!',
        },
      ]

      const result = getSecrets(securitySchemes)

      // Verify the base64 encoded value is correct
      expect(result[2]).toBe('dXNlckBkb21haW4uY29tOnBhc3M6d29yZCE=') // base64 encoded "user@domain.com:pass:word!"

      // Verify we can decode it back
      const decoded = decode(result[2])
      expect(decoded).toBe('user@domain.com:pass:word!')
    })
  })
})
