import { describe, expect, it } from 'vitest'
import { securitySchemeSchema } from '@scalar/types/entities'

import { convertSecurityScheme } from './convert-security-scheme'

describe('convertSecurityScheme', () => {
  describe('apiKey security scheme', () => {
    it('converts apiKey scheme with value to include x-scalar-secret-token', () => {
      const input = securitySchemeSchema.parse({
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        uid: 'test-uid',
        nameKey: 'apiKey',
        value: 'secret-api-key-value',
        description: 'API key for authentication',
      })

      const result = convertSecurityScheme(input)

      expect(result).toEqual({
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        uid: 'test-uid',
        nameKey: 'apiKey',
        value: 'secret-api-key-value',
        description: 'API key for authentication',
        'x-scalar-secret-token': 'secret-api-key-value',
      })
    })

    it('converts apiKey scheme without description', () => {
      const input = securitySchemeSchema.parse({
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'query',
        uid: 'test-uid',
        nameKey: 'apiKey',
        value: 'secret-api-key-value',
      })

      const result = convertSecurityScheme(input)

      expect(result).toEqual({
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'query',
        uid: 'test-uid',
        nameKey: 'apiKey',
        value: 'secret-api-key-value',
        'x-scalar-secret-token': 'secret-api-key-value',
      })
    })

    it('converts apiKey scheme with empty value', () => {
      const input = securitySchemeSchema.parse({
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'cookie',
        uid: 'test-uid',
        nameKey: 'apiKey',
        value: '',
      })

      const result = convertSecurityScheme(input)

      expect(result).toEqual({
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'cookie',
        uid: 'test-uid',
        nameKey: 'apiKey',
        value: '',
        'x-scalar-secret-token': '',
      })
    })
  })

  describe('http security scheme', () => {
    it('converts http bearer scheme with all credentials', () => {
      const input = securitySchemeSchema.parse({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        uid: 'test-uid',
        nameKey: 'httpBearer',
        token: 'bearer-token-value',
        username: 'test-user',
        password: 'test-password',
        description: 'Bearer token authentication',
      })

      const result = convertSecurityScheme(input)

      expect(result).toEqual({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        uid: 'test-uid',
        nameKey: 'httpBearer',
        token: 'bearer-token-value',
        username: 'test-user',
        password: 'test-password',
        description: 'Bearer token authentication',
        'x-scalar-secret-token': 'bearer-token-value',
        'x-scalar-secret-username': 'test-user',
        'x-scalar-secret-password': 'test-password',
      })
    })

    it('converts http basic scheme with credentials', () => {
      const input = securitySchemeSchema.parse({
        type: 'http',
        scheme: 'basic',
        uid: 'test-uid',
        nameKey: 'httpBasic',
        token: 'basic-token-value',
        username: 'admin',
        password: 'secret123',
      })

      const result = convertSecurityScheme(input)

      expect(result).toEqual({
        type: 'http',
        scheme: 'basic',
        bearerFormat: 'JWT',
        uid: 'test-uid',
        nameKey: 'httpBasic',
        token: 'basic-token-value',
        username: 'admin',
        password: 'secret123',
        'x-scalar-secret-token': 'basic-token-value',
        'x-scalar-secret-username': 'admin',
        'x-scalar-secret-password': 'secret123',
      })
    })

    it('converts http scheme with empty credentials', () => {
      const input = securitySchemeSchema.parse({
        type: 'http',
        scheme: 'bearer',
        uid: 'test-uid',
        nameKey: 'httpBearer',
        token: '',
        username: '',
        password: '',
      })

      const result = convertSecurityScheme(input)

      expect(result).toEqual({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        uid: 'test-uid',
        nameKey: 'httpBearer',
        token: '',
        username: '',
        password: '',
        'x-scalar-secret-token': '',
        'x-scalar-secret-username': '',
        'x-scalar-secret-password': '',
      })
    })
  })

  describe('oauth2 security scheme', () => {
    it('converts oauth2 scheme with implicit flow', () => {
      const input = securitySchemeSchema.parse({
        type: 'oauth2',
        uid: 'test-uid',
        nameKey: 'oauth2',
        flows: {
          implicit: {
            type: 'implicit',
            authorizationUrl: 'https://example.com/oauth/authorize',
            refreshUrl: 'https://example.com/oauth/refresh',
            scopes: {
              'read:users': 'Read user information',
              'write:users': 'Write user information',
            },
            selectedScopes: ['read:users'],
            token: 'implicit-token-value',
            'x-scalar-client-id': 'client-id',
            'x-scalar-redirect-uri': 'https://app.example.com/callback',
          },
        },
      })

      const result = convertSecurityScheme(input)

      expect(result).toEqual({
        type: 'oauth2',
        uid: 'test-uid',
        nameKey: 'oauth2',
        flows: {
          implicit: {
            type: 'implicit',
            authorizationUrl: 'https://example.com/oauth/authorize',
            refreshUrl: 'https://example.com/oauth/refresh',
            scopes: {
              'read:users': 'Read user information',
              'write:users': 'Write user information',
            },
            selectedScopes: ['read:users'],
            token: 'implicit-token-value',
            'x-scalar-client-id': 'client-id',
            'x-scalar-redirect-uri': 'https://app.example.com/callback',
            'x-scalar-secret-token': 'implicit-token-value',
          },
        },
      })
    })

    it('converts oauth2 scheme with multiple flows', () => {
      const input = securitySchemeSchema.parse({
        type: 'oauth2',
        uid: 'test-uid',
        nameKey: 'oauth2',
        flows: {
          authorizationCode: {
            type: 'authorizationCode',
            authorizationUrl: 'https://example.com/oauth/authorize',
            tokenUrl: 'https://example.com/oauth/token',
            refreshUrl: 'https://example.com/oauth/refresh',
            scopes: {
              'read:users': 'Read user information',
            },
            selectedScopes: ['read:users'],
            token: 'auth-code-token-value',
            'x-scalar-client-id': 'client-id',
            'x-scalar-redirect-uri': 'https://app.example.com/callback',
            clientSecret: 'client-secret',
            'x-usePkce': 'no',
          },
          clientCredentials: {
            type: 'clientCredentials',
            tokenUrl: 'https://example.com/oauth/token',
            refreshUrl: 'https://example.com/oauth/refresh',
            scopes: {
              'admin:all': 'Full admin access',
            },
            selectedScopes: ['admin:all'],
            token: 'client-credentials-token-value',
            'x-scalar-client-id': 'client-id',
            clientSecret: 'client-secret',
          },
        },
      })

      const result = convertSecurityScheme(input)

      expect(result).toEqual({
        type: 'oauth2',
        uid: 'test-uid',
        nameKey: 'oauth2',
        flows: {
          authorizationCode: {
            type: 'authorizationCode',
            authorizationUrl: 'https://example.com/oauth/authorize',
            tokenUrl: 'https://example.com/oauth/token',
            refreshUrl: 'https://example.com/oauth/refresh',
            scopes: {
              'read:users': 'Read user information',
            },
            selectedScopes: ['read:users'],
            token: 'auth-code-token-value',
            'x-scalar-client-id': 'client-id',
            'x-scalar-redirect-uri': 'https://app.example.com/callback',
            clientSecret: 'client-secret',
            'x-usePkce': 'no',
            'x-scalar-secret-token': 'auth-code-token-value',
          },
          clientCredentials: {
            type: 'clientCredentials',
            tokenUrl: 'https://example.com/oauth/token',
            refreshUrl: 'https://example.com/oauth/refresh',
            scopes: {
              'admin:all': 'Full admin access',
            },
            selectedScopes: ['admin:all'],
            token: 'client-credentials-token-value',
            'x-scalar-client-id': 'client-id',
            clientSecret: 'client-secret',
            'x-scalar-secret-token': 'client-credentials-token-value',
          },
        },
      })
    })

    it('converts oauth2 scheme with empty flows', () => {
      const input = securitySchemeSchema.parse({
        type: 'oauth2',
        uid: 'test-uid',
        nameKey: 'oauth2',
        flows: {},
      })

      const result = convertSecurityScheme(input)

      expect(result).toEqual({
        type: 'oauth2',
        uid: 'test-uid',
        nameKey: 'oauth2',
        flows: {},
      })
    })
  })

  describe('edge cases', () => {
    it('handles scheme with undefined optional properties', () => {
      const input = securitySchemeSchema.parse({
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        uid: 'test-uid',
        nameKey: 'apiKey',
        value: 'secret-value',
        description: undefined,
      })

      const result = convertSecurityScheme(input)

      expect(result).toEqual({
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        uid: 'test-uid',
        nameKey: 'apiKey',
        value: 'secret-value',
        description: undefined,
        'x-scalar-secret-token': 'secret-value',
      })
    })

    it('preserves all original properties when converting', () => {
      const input = securitySchemeSchema.parse({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        uid: 'test-uid',
        nameKey: 'httpBearer',
        token: 'bearer-token',
        username: 'user',
        password: 'pass',
        description: 'Bearer authentication',
      })

      const result = convertSecurityScheme(input)

      // Verify all original properties are preserved
      expect(result.type).toBe('http')
      expect((result as any).scheme).toBe('bearer')
      expect((result as any).bearerFormat).toBe('JWT')
      expect((result as any).uid).toBe('test-uid')
      expect((result as any).nameKey).toBe('httpBearer')
      expect((result as any).token).toBe('bearer-token')
      expect((result as any).username).toBe('user')
      expect((result as any).password).toBe('pass')
      expect((result as any).description).toBe('Bearer authentication')

      // Verify secret extensions are added
      expect((result as any)['x-scalar-secret-token']).toBe('bearer-token')
      expect((result as any)['x-scalar-secret-username']).toBe('user')
      expect((result as any)['x-scalar-secret-password']).toBe('pass')
    })
  })
})
