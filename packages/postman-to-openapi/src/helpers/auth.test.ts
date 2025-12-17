import { describe, expect, it } from 'vitest'

import type { Auth } from '../types'
import { processAuth } from './auth'

describe('auth', () => {
  it('returns API key security configuration', () => {
    const auth = { type: 'apikey' } satisfies Auth

    const result = processAuth(auth)

    expect(result.securitySchemes).toEqual({
      apikeyAuth: {
        type: 'apiKey',
        name: 'api_key',
        in: 'header',
      },
    })
    expect(result.security).toEqual([{ apikeyAuth: [] }])
  })

  it('returns Basic security configuration', () => {
    const auth = { type: 'basic' } satisfies Auth

    const result = processAuth(auth)

    expect(result.securitySchemes).toEqual({
      basicAuth: {
        type: 'http',
        scheme: 'basic',
      },
    })
    expect(result.security).toEqual([{ basicAuth: [] }])
  })

  it('returns Bearer security configuration', () => {
    const auth = { type: 'bearer' } satisfies Auth

    const result = processAuth(auth)

    expect(result.securitySchemes).toEqual({
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
      },
    })
    expect(result.security).toEqual([{ bearerAuth: [] }])
  })

  it('returns OAuth2 security configuration with defaults', () => {
    const auth = { type: 'oauth2' } satisfies Auth

    const result = processAuth(auth)

    expect(result.securitySchemes).toEqual({
      oauth2Auth: {
        type: 'oauth2',
        flows: {
          authorizationCode: {
            authorizationUrl: 'https://example.com/oauth/authorize',
            tokenUrl: 'https://example.com/oauth/token',
            scopes: {},
          },
        },
      },
    })
    expect(result.security).toEqual([{ oauth2Auth: [] }])
  })

  it('returns empty configuration for no authentication', () => {
    const auth = { type: 'noauth' } satisfies Auth

    const result = processAuth(auth)

    expect(result.securitySchemes).toEqual({})
    expect(result.security).toEqual([])
  })

  it('throws when authentication type is unsupported', () => {
    const auth = { type: 'unsupported' } satisfies Auth

    expect(() => processAuth(auth)).toThrowError('Unsupported authentication type: unsupported')
  })
})
