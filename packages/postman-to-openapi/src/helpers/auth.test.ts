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

  it('returns Digest security configuration', () => {
    const auth = { type: 'digest' } satisfies Auth

    const result = processAuth(auth)

    expect(result.securitySchemes).toStrictEqual({
      digestAuth: {
        type: 'http',
        scheme: 'digest',
      },
    })
    expect(result.security).toStrictEqual([{ digestAuth: [] }])
  })

  it.each([
    'awsv4',
    'oauth1',
    'hawk',
    'ntlm',
    'edgegrid',
    'jwt',
    'asap',
    'akamai',
    'APIKEY',
    '',
    '__proto__',
    'constructor',
    'toString',
    'hasOwnProperty',
  ])('skips the unsupported authentication type "%s"', (type) => {
    const auth: Auth = { type }
    const original = structuredClone(auth)

    const result = processAuth(auth)

    expect(result).toStrictEqual({ securitySchemes: {}, security: [] })
    expect(auth).toStrictEqual(original)
  })

  it.each<{ name: string; auth: Auth; schemeName: string; scheme: { name: string; in: 'header' | 'query' } }>([
    {
      name: 'a header key',
      auth: {
        type: 'apikey',
        apikey: [
          { key: 'key', value: 'X-API-Key' },
          { key: 'value', value: 'secret' },
          { key: 'in', value: 'header' },
        ],
      },
      schemeName: 'apikeyAuth_header_X-API-Key',
      scheme: { name: 'X-API-Key', in: 'header' },
    },
    {
      name: 'a query key',
      auth: {
        type: 'apikey',
        apikey: [
          { key: 'key', value: 'api_token' },
          { key: 'in', value: 'query' },
        ],
      },
      schemeName: 'apikeyAuth_query_api_token',
      scheme: { name: 'api_token', in: 'query' },
    },
    {
      name: 'a key without a location',
      auth: { type: 'apikey', apikey: [{ key: 'key', value: 'X-API-Key' }] },
      schemeName: 'apikeyAuth_header_X-API-Key',
      scheme: { name: 'X-API-Key', in: 'header' },
    },
    {
      name: 'a key with the unknown location "cookie"',
      auth: {
        type: 'apikey',
        apikey: [
          { key: 'key', value: 'session' },
          { key: 'in', value: 'cookie' },
        ],
      },
      schemeName: 'apikeyAuth_header_session',
      scheme: { name: 'session', in: 'header' },
    },
    {
      name: 'a key with an empty location',
      auth: {
        type: 'apikey',
        apikey: [
          { key: 'key', value: 'X-API-Key' },
          { key: 'in', value: '' },
        ],
      },
      schemeName: 'apikeyAuth_header_X-API-Key',
      scheme: { name: 'X-API-Key', in: 'header' },
    },
    {
      name: 'a query location without a key',
      auth: { type: 'apikey', apikey: [{ key: 'in', value: 'query' }] },
      schemeName: 'apikeyAuth_query_api_key',
      scheme: { name: 'api_key', in: 'query' },
    },
    {
      name: 'an empty key',
      auth: { type: 'apikey', apikey: [{ key: 'key', value: '' }] },
      schemeName: 'apikeyAuth',
      scheme: { name: 'api_key', in: 'header' },
    },
    {
      name: 'rows without a value',
      auth: { type: 'apikey', apikey: [{ key: 'key' }, { key: 'in' }] },
      schemeName: 'apikeyAuth',
      scheme: { name: 'api_key', in: 'header' },
    },
    {
      name: 'an empty attribute list',
      auth: { type: 'apikey', apikey: [] },
      schemeName: 'apikeyAuth',
      scheme: { name: 'api_key', in: 'header' },
    },
    {
      name: 'attributes named like object keywords',
      auth: {
        type: 'apikey',
        apikey: [
          { key: '__proto__', value: 'query' },
          { key: 'constructor', value: 'X-Constructor' },
          { key: 'toString', value: 'X-ToString' },
        ],
      },
      schemeName: 'apikeyAuth',
      scheme: { name: 'api_key', in: 'header' },
    },
    {
      name: 'the explicit default header key',
      auth: { type: 'apikey', apikey: [{ key: 'key', value: 'api_key' }] },
      schemeName: 'apikeyAuth',
      scheme: { name: 'api_key', in: 'header' },
    },
    {
      name: 'the default key name in a query',
      auth: {
        type: 'apikey',
        apikey: [
          { key: 'key', value: 'api_key' },
          { key: 'in', value: 'query' },
        ],
      },
      schemeName: 'apikeyAuth_query_api_key',
      scheme: { name: 'api_key', in: 'query' },
    },
    {
      name: 'a key named __proto__',
      auth: { type: 'apikey', apikey: [{ key: 'key', value: '__proto__' }] },
      schemeName: 'apikeyAuth_header___proto__',
      scheme: { name: '__proto__', in: 'header' },
    },
    {
      name: 'a key named constructor',
      auth: { type: 'apikey', apikey: [{ key: 'key', value: 'constructor' }] },
      schemeName: 'apikeyAuth_header_constructor',
      scheme: { name: 'constructor', in: 'header' },
    },
    {
      name: 'a key with characters component names cannot hold',
      auth: { type: 'apikey', apikey: [{ key: 'key', value: 'X API/Key.v2' }] },
      schemeName: 'apikeyAuth_header_X.20API.2FKey.2Ev2',
      scheme: { name: 'X API/Key.v2', in: 'header' },
    },
    {
      name: 'a key with non-ASCII characters',
      auth: { type: 'apikey', apikey: [{ key: 'key', value: 'clé' }] },
      schemeName: 'apikeyAuth_header_cl.C3.A9',
      scheme: { name: 'clé', in: 'header' },
    },
    {
      name: 'the Postman v2.0 attribute object',
      auth: { type: 'apikey', apikey: { key: 'X-API-Key', value: 'secret', in: 'query' } },
      schemeName: 'apikeyAuth_query_X-API-Key',
      scheme: { name: 'X-API-Key', in: 'query' },
    },
  ])('reads the API key name and location from $name', ({ auth, schemeName, scheme }) => {
    const original = structuredClone(auth)

    const result = processAuth(auth)

    expect(result.securitySchemes).toStrictEqual({ [schemeName]: { type: 'apiKey', ...scheme } })
    expect(result.security).toStrictEqual([{ [schemeName]: [] }])
    expect(auth).toStrictEqual(original)
  })

  it('ignores API key attributes that are neither rows nor an object', () => {
    const auth: Auth = JSON.parse('{ "type": "apikey", "apikey": "X-API-Key" }')

    const result = processAuth(auth)

    expect(result.securitySchemes).toStrictEqual({ apikeyAuth: { type: 'apiKey', name: 'api_key', in: 'header' } })
  })

  it('keeps distinct API key names and locations under distinct scheme names', () => {
    const names = ['X-API-Key', 'x-api-key', 'api_token', 'a b', 'a.20b', 'a_20b', 'a%20b', '__proto__', 'api_key', '']
    const locations = ['header', 'query']

    const schemeNames = names.flatMap((name) =>
      locations.map((location): string => {
        const { securitySchemes } = processAuth({
          type: 'apikey',
          apikey: [
            { key: 'key', value: name },
            { key: 'in', value: location },
          ],
        })
        return Object.keys(securitySchemes).join()
      }),
    )

    // The empty name falls back to api_key, so it shares its scheme with the explicit default.
    expect(new Set(schemeNames).size).toBe(schemeNames.length - locations.length)
    schemeNames.forEach((schemeName) => {
      expect(schemeName).toMatch(/^[a-zA-Z0-9._-]+$/)
    })
  })

  it('reads OAuth2 attributes from the Postman v2.0 attribute object', () => {
    const auth: Auth = {
      type: 'oauth2',
      oauth2: {
        authUrl: 'https://login.example.com/oauth/authorize',
        accessTokenUrl: 'https://login.example.com/oauth/token',
        scope: 'read write',
      },
    }

    const result = processAuth(auth)

    expect(result.securitySchemes).toStrictEqual({
      oauth2Auth: {
        type: 'oauth2',
        flows: {
          authorizationCode: {
            authorizationUrl: 'https://login.example.com/oauth/authorize',
            tokenUrl: 'https://login.example.com/oauth/token',
            scopes: { read: 'read', write: 'write' },
          },
        },
      },
    })
    expect(result.security).toStrictEqual([{ oauth2Auth: ['read', 'write'] }])
  })
})
