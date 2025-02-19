import { type SecurityScheme, securitySchemeSchema } from '@scalar/oas-utils/entities/spec'
import { beforeEach, describe, expect, it } from 'vitest'

import { buildRequestSecurity } from './build-request-security'

describe('buildRequestSecurity', () => {
  let apiKey: Extract<SecurityScheme, { type: 'apiKey' }>
  let basic: Extract<SecurityScheme, { type: 'http' }>
  let oauth2: Extract<SecurityScheme, { type: 'oauth2' }>

  beforeEach(() => {
    apiKey = securitySchemeSchema.parse({
      type: 'apiKey',
      nameKey: 'apiKey',
      uid: 'apiKeyUid',
      name: 'x-api-key',
      in: 'header',
      value: 'test-key',
    }) as Extract<SecurityScheme, { type: 'apiKey' }>

    basic = securitySchemeSchema.parse({
      type: 'http',
      nameKey: 'basic',
      uid: 'basicUid',
      scheme: 'basic',
      username: 'scalar',
      password: 'user',
    }) as Extract<SecurityScheme, { type: 'http' }>

    oauth2 = securitySchemeSchema.parse({
      type: 'oauth2',
      nameKey: 'oauth2',
      uid: 'oauth2Uid',
    }) as Extract<SecurityScheme, { type: 'oauth2' }>
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
        uid: 'apiKeyUid',
      })
    })
  })

  describe('http security', () => {
    it('should handle basic auth', () => {
      basic.scheme = 'basic'
      const result = buildRequestSecurity([basic])
      expect(result.headers['Authorization']).toBe(`Basic ${btoa('scalar:user')}`)
    })

    it('should handle basic auth with empty credentials', () => {
      basic.username = ''
      basic.password = ''
      const result = buildRequestSecurity([basic])
      expect(result.headers['Authorization']).toBe('Basic username:password')
    })

    it('should handle bearer auth', () => {
      basic.scheme = 'bearer'
      basic.token = 'test-token'
      const result = buildRequestSecurity([basic])
      expect(result.headers['Authorization']).toBe('Bearer test-token')
    })
  })

  describe('oauth2 security', () => {
    it('should handle oauth2 with token', () => {
      oauth2.flows = {
        // @ts-expect-error
        implicit: {
          type: 'implicit',
          token: 'test-token',
        },
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
        // @ts-expect-error
        implicit: {
          type: 'implicit',
          token: 'test-token-implicit',
        },
        // @ts-expect-error
        authorizationCode: {
          type: 'authorizationCode',
          token: 'test-token-code',
        },
      }

      const result = buildRequestSecurity([oauth2])
      expect(result.headers['Authorization']).toBe('Bearer test-token-implicit')
    })
  })

  it('should handle empty token placeholder', () => {
    apiKey.value = ''
    const result = buildRequestSecurity([apiKey], {}, 'NO_VALUE')
    expect(result.headers['x-api-key']).toBe('NO_VALUE')
  })
})
