import { describe, expect, it } from 'vitest'

import type { Auth } from '@/types'

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

  it('returns OAuth2 security configuration with defaults when no attributes provided', () => {
    const auth = { type: 'oauth2' } satisfies Auth

    const result = processAuth(auth)

    expect(result.securitySchemes).toEqual({
      oauth2Auth: {
        type: 'oauth2',
        flows: {
          authorizationCode: {
            authorizationUrl: '/oauth/authorize',
            tokenUrl: '/oauth/token',
            scopes: {},
          },
        },
      },
    })
    expect(result.security).toEqual([{ oauth2Auth: [] }])
  })

  it('extracts OAuth2 authorization URL from auth attributes', () => {
    const auth = {
      type: 'oauth2',
      oauth2: [
        { key: 'authUrl', value: 'https://login.example.com/oauth/authorize' },
        { key: 'accessTokenUrl', value: 'https://login.example.com/oauth/token' },
      ],
    } satisfies Auth

    const result = processAuth(auth)

    expect(result.securitySchemes.oauth2Auth?.flows?.authorizationCode?.authorizationUrl).toBe(
      'https://login.example.com/oauth/authorize',
    )
  })

  it('extracts OAuth2 token URL from auth attributes', () => {
    const auth = {
      type: 'oauth2',
      oauth2: [
        { key: 'authUrl', value: 'https://login.example.com/oauth/authorize' },
        { key: 'accessTokenUrl', value: 'https://login.example.com/oauth/token' },
      ],
    } satisfies Auth

    const result = processAuth(auth)

    expect(result.securitySchemes.oauth2Auth?.flows?.authorizationCode?.tokenUrl).toBe(
      'https://login.example.com/oauth/token',
    )
  })

  it('extracts OAuth2 scopes from auth attributes', () => {
    const auth = {
      type: 'oauth2',
      oauth2: [{ key: 'scope', value: 'read write admin' }],
    } satisfies Auth

    const result = processAuth(auth)

    const scopes = result.securitySchemes.oauth2Auth?.flows?.authorizationCode?.scopes
    expect(scopes).toEqual({
      read: 'read',
      write: 'write',
      admin: 'admin',
    })
    expect(result.security[0]?.oauth2Auth).toEqual(['read', 'write', 'admin'])
  })

  it('handles comma-separated OAuth2 scopes', () => {
    const auth = {
      type: 'oauth2',
      oauth2: [{ key: 'scope', value: 'read,write,admin' }],
    } satisfies Auth

    const result = processAuth(auth)

    const scopes = result.securitySchemes.oauth2Auth?.flows?.authorizationCode?.scopes
    expect(scopes).toEqual({
      read: 'read',
      write: 'write',
      admin: 'admin',
    })
  })

  it('uses tokenUrl as fallback for accessTokenUrl', () => {
    const auth = {
      type: 'oauth2',
      oauth2: [{ key: 'tokenUrl', value: 'https://login.example.com/oauth/token' }],
    } satisfies Auth

    const result = processAuth(auth)

    expect(result.securitySchemes.oauth2Auth?.flows?.authorizationCode?.tokenUrl).toBe(
      'https://login.example.com/oauth/token',
    )
  })

  it('uses authorizationUrl as fallback for authUrl', () => {
    const auth = {
      type: 'oauth2',
      oauth2: [{ key: 'authorizationUrl', value: 'https://login.example.com/oauth/authorize' }],
    } satisfies Auth

    const result = processAuth(auth)

    expect(result.securitySchemes.oauth2Auth?.flows?.authorizationCode?.authorizationUrl).toBe(
      'https://login.example.com/oauth/authorize',
    )
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
