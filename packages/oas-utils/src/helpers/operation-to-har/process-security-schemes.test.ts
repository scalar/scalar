import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { describe, it, expect } from 'vitest'

import { processSecuritySchemes } from './process-security-schemes'

describe('process-security-schemes', () => {
  describe('apiKey security scheme', () => {
    it('processes apiKey in header', () => {
      const securitySchemes: OpenAPIV3_1.SecuritySchemeObject[] = [
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
      const securitySchemes: OpenAPIV3_1.SecuritySchemeObject[] = [
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
      const securitySchemes: OpenAPIV3_1.SecuritySchemeObject[] = [
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
      const securitySchemes: OpenAPIV3_1.SecuritySchemeObject[] = [
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
      const securitySchemes: OpenAPIV3_1.SecuritySchemeObject[] = [
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
      const securitySchemes: OpenAPIV3_1.SecuritySchemeObject[] = [
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
      const securitySchemes: OpenAPIV3_1.SecuritySchemeObject[] = [
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
      const securitySchemes: OpenAPIV3_1.SecuritySchemeObject[] = [
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
      const securitySchemes: OpenAPIV3_1.SecuritySchemeObject[] = [
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
      const securitySchemes: OpenAPIV3_1.SecuritySchemeObject[] = [
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

    it('handles oauth2 without token', () => {
      const securitySchemes: OpenAPIV3_1.SecuritySchemeObject[] = [
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

      expect(result.headers).toHaveLength(0)
    })
  })

  describe('multiple security schemes', () => {
    it('processes multiple security schemes', () => {
      const securitySchemes: OpenAPIV3_1.SecuritySchemeObject[] = [
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

  describe('edge cases', () => {
    it('handles empty security schemes array', () => {
      const securitySchemes: OpenAPIV3_1.SecuritySchemeObject[] = []

      const result = processSecuritySchemes(securitySchemes)

      expect(result.headers).toHaveLength(0)
      expect(result.queryString).toHaveLength(0)
      expect(result.cookies).toHaveLength(0)
    })

    it('handles security scheme without x-scalar-secret properties', () => {
      const securitySchemes: OpenAPIV3_1.SecuritySchemeObject[] = [
        {
          type: 'apiKey',
          name: 'X-API-Key',
          in: 'header',
        },
      ]

      const result = processSecuritySchemes(securitySchemes)

      expect(result.headers).toHaveLength(0)
      expect(result.queryString).toHaveLength(0)
      expect(result.cookies).toHaveLength(0)
    })
  })
})
