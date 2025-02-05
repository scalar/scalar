import { securitySchemeSchema } from '@scalar/oas-utils/entities/spec'
import { describe, expect, it } from 'vitest'

import { buildRequestSecurity } from './build-request-security'

describe('buildRequestSecurity', () => {
  const securitySchemes = {
    apiKeyUid: securitySchemeSchema.parse({
      type: 'apiKey',
      nameKey: 'apiKey',
      uid: 'apiKeyUid',
      name: 'apiKey',
      in: 'header',
      value: 'test-key',
    }),
    basicUid: securitySchemeSchema.parse({
      type: 'http',
      nameKey: 'basic',
      uid: 'basicUid',
      scheme: 'basic',
      username: 'scalar',
      password: 'user',
    }),
    oauth2Uid: securitySchemeSchema.parse({
      type: 'oauth2',
      nameKey: 'oauth2',
      uid: 'oauth2Uid',
      flows: {
        implicit: {
          authorizationUrl: 'https://example.com/auth',
          token: 'oauth-token',
        },
      },
    }),
  }

  it('should return empty objects when no security schemes are provided', () => {
    const result = buildRequestSecurity()

    expect(result.headers).toEqual({})
    expect(result.cookies).toEqual([])
    expect(result.urlParams.toString()).toBe('')
  })

  describe('apiKey security', () => {
    it('should handle apiKey in header', () => {
      const result = buildRequestSecurity([securitySchemes.apiKeyUid])
      expect(result.headers['x-api-key']).toBe('test-key')
    })

    it('should handle apiKey in query', () => {
      const schemes: SecurityScheme[] = [
        {
          type: 'apiKey',
          name: 'api_key',
          in: 'query',
          value: '{{API_KEY}}',
        },
      ]

      const env = { API_KEY: 'test-key' }
      const result = buildRequestSecurity(schemes, env)

      expect(result.urlParams.get('api_key')).toBe('test-key')
    })

    it('should handle apiKey in cookie', () => {
      const schemes: SecurityScheme[] = [
        {
          type: 'apiKey',
          name: 'SessionId',
          in: 'cookie',
          value: '{{SESSION_ID}}',
        },
      ]

      const env = { SESSION_ID: 'test-session' }
      const result = buildRequestSecurity(schemes, env)

      expect(result.cookies[0]).toEqual({
        name: 'SessionId',
        value: 'test-session',
        path: '/',
        uid: 'SessionId',
      })
    })
  })

  describe('http security', () => {
    it('should handle basic auth', () => {
      const schemes: SecurityScheme[] = [
        {
          type: 'http',
          scheme: 'basic',
          username: '{{USERNAME}}',
          password: '{{PASSWORD}}',
        },
      ]

      const env = { USERNAME: 'user', PASSWORD: 'pass' }
      const result = buildRequestSecurity(schemes, env)

      expect(result.headers['Authorization']).toBe('Basic dXNlcjpwYXNz') // base64 of "user:pass"
    })

    it('should handle basic auth with empty credentials', () => {
      const schemes: SecurityScheme[] = [
        {
          type: 'http',
          scheme: 'basic',
          username: '',
          password: '',
        },
      ]

      const result = buildRequestSecurity(schemes, {})

      expect(result.headers['Authorization']).toBe('Basic username:password')
    })

    it('should handle bearer auth', () => {
      const schemes: SecurityScheme[] = [
        {
          type: 'http',
          scheme: 'bearer',
          token: '{{TOKEN}}',
        },
      ]

      const env = { TOKEN: 'test-token' }
      const result = buildRequestSecurity(schemes, env)

      expect(result.headers['Authorization']).toBe('Bearer test-token')
    })
  })

  describe('oauth2 security', () => {
    it('should handle oauth2 with token', () => {
      const schemes: SecurityScheme[] = [
        {
          type: 'oauth2',
          flows: {
            implicit: {
              authorizationUrl: 'https://example.com/auth',
              token: 'oauth-token',
            },
          },
        },
      ]

      const result = buildRequestSecurity(schemes, {})

      expect(result.headers['Authorization']).toBe('Bearer oauth-token')
    })

    it('should handle oauth2 without token', () => {
      const schemes: SecurityScheme[] = [
        {
          type: 'oauth2',
          flows: {
            implicit: {
              authorizationUrl: 'https://example.com/auth',
            },
          },
        },
      ]

      const result = buildRequestSecurity(schemes, {}, 'NO_TOKEN')

      expect(result.headers['Authorization']).toBe('Bearer NO_TOKEN')
    })
  })

  it('should handle empty token placeholder', () => {
    const schemes: SecurityScheme[] = [
      {
        type: 'apiKey',
        name: 'x-api-key',
        in: 'header',
        value: '',
      },
    ]

    const result = buildRequestSecurity(schemes, {}, 'NO_VALUE')

    expect(result.headers['x-api-key']).toBe('NO_VALUE')
  })
})
