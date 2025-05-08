import { securitySchemeSchema } from '@scalar/types/entities'
import { describe, it, expect } from 'vitest'

import { hasToken } from './has-token'

describe('hasToken', () => {
  describe('apiKey scheme', () => {
    it('returns true when value is present', () => {
      const scheme = securitySchemeSchema.parse({
        type: 'apiKey',
        value: 'my-api-key',
        in: 'header',
        name: 'x-api-key',
      })
      expect(hasToken(scheme)).toBe(true)
    })

    it('returns false when value is empty', () => {
      const scheme = securitySchemeSchema.parse({
        type: 'apiKey',
        value: '',
        in: 'header',
        name: 'x-api-key',
      })
      expect(hasToken(scheme)).toBe(false)
    })
  })

  describe('http scheme', () => {
    describe('bearer', () => {
      it('returns true when token is present', () => {
        const scheme = securitySchemeSchema.parse({
          type: 'http',
          scheme: 'bearer',
          token: 'my-bearer-token',
        })
        expect(hasToken(scheme)).toBe(true)
      })

      it('returns false when token is empty', () => {
        const scheme = securitySchemeSchema.parse({
          type: 'http',
          scheme: 'bearer',
          token: '',
        })
        expect(hasToken(scheme)).toBe(false)
      })
    })

    describe('basic', () => {
      it('returns true when both username and password are present', () => {
        const scheme = securitySchemeSchema.parse({
          type: 'http',
          scheme: 'basic',
          username: 'user',
          password: 'pass',
        })
        expect(hasToken(scheme)).toBe(true)
      })

      it('returns false when username is missing', () => {
        const scheme = securitySchemeSchema.parse({
          type: 'http',
          scheme: 'basic',
          username: '',
          password: 'pass',
        })
        expect(hasToken(scheme)).toBe(false)
      })

      it('returns false when password is missing', () => {
        const scheme = securitySchemeSchema.parse({
          type: 'http',
          scheme: 'basic',
          username: 'user',
          password: '',
        })
        expect(hasToken(scheme)).toBe(false)
      })
    })
  })

  describe('oauth2 scheme', () => {
    it('returns true when authorization code flow has token', () => {
      const scheme = securitySchemeSchema.parse({
        type: 'oauth2',
        flows: {
          authorizationCode: {
            token: 'auth-code-token',
            authorizationUrl: 'https://auth.example.com',
            tokenUrl: 'https://token.example.com',
            scopes: {},
          },
        },
      })
      expect(hasToken(scheme)).toBe(true)
    })

    it('returns true when client credentials flow has token', () => {
      const scheme = securitySchemeSchema.parse({
        type: 'oauth2',
        flows: {
          clientCredentials: {
            token: 'client-creds-token',
            tokenUrl: 'https://token.example.com',
            scopes: {},
          },
        },
      })
      expect(hasToken(scheme)).toBe(true)
    })

    it('returns true when password flow has token', () => {
      const scheme = securitySchemeSchema.parse({
        type: 'oauth2',
        flows: {
          password: {
            token: 'password-token',
            tokenUrl: 'https://token.example.com',
            scopes: {},
          },
        },
      })
      expect(hasToken(scheme)).toBe(true)
    })

    it('returns true when implicit flow has token', () => {
      const scheme = securitySchemeSchema.parse({
        type: 'oauth2',
        flows: {
          implicit: {
            token: 'implicit-token',
            authorizationUrl: 'https://auth.example.com',
            scopes: {},
          },
        },
      })
      expect(hasToken(scheme)).toBe(true)
    })

    it('returns false when no flows have tokens', () => {
      const scheme = securitySchemeSchema.parse({
        type: 'oauth2',
        flows: {
          authorizationCode: {
            token: '',
            authorizationUrl: 'https://auth.example.com',
            tokenUrl: 'https://token.example.com',
            scopes: {},
          },
          clientCredentials: {
            token: '',
            tokenUrl: 'https://token.example.com',
            scopes: {},
          },
        },
      })
      expect(hasToken(scheme)).toBe(false)
    })
  })

  describe('unknown scheme type', () => {
    it('returns false for unknown scheme types', () => {
      // Note: For unknown types, we can't use parse as it would fail validation
      // This is testing the edge case of an invalid type
      const scheme = {
        type: 'unknown',
      } as any
      expect(hasToken(scheme)).toBe(false)
    })
  })
})
