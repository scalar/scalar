import type { SecuritySchemeObjectSecret } from '@scalar/workspace-store/request-example'
import { describe, expect, it } from 'vitest'

import { WEBSOCKET_BEARER_TOKEN_QUERY_PARAM, applyAuthToWebSocketUrl } from './apply-auth-to-websocket-url'

describe('applyAuthToWebSocketUrl', () => {
  it('returns the URL unchanged when no schemes are provided', () => {
    const result = applyAuthToWebSocketUrl('wss://echo.example.com/socket', [])

    expect(result.url).toBe('wss://echo.example.com/socket')
    expect(result.unsupported).toEqual([])
  })

  it('returns the URL unchanged when the input is not a valid URL', () => {
    const result = applyAuthToWebSocketUrl('not-a-url', [
      {
        type: 'apiKey',
        name: 'apiKey',
        in: 'query',
        'x-scalar-secret-token': 'abc',
      } as SecuritySchemeObjectSecret,
    ])

    expect(result.url).toBe('not-a-url')
    expect(result.unsupported).toEqual([])
  })

  it('appends apiKey-in-query credentials to the URL', () => {
    const result = applyAuthToWebSocketUrl('wss://echo.example.com/socket', [
      {
        type: 'apiKey',
        name: 'apiKey',
        in: 'query',
        'x-scalar-secret-token': 'secret-token',
      } as SecuritySchemeObjectSecret,
    ])

    expect(result.url).toBe('wss://echo.example.com/socket?apiKey=secret-token')
    expect(result.unsupported).toEqual([])
  })

  it('overwrites an existing query parameter with the same name', () => {
    const result = applyAuthToWebSocketUrl('wss://echo.example.com/socket?apiKey=old', [
      {
        type: 'apiKey',
        name: 'apiKey',
        in: 'query',
        'x-scalar-secret-token': 'new-value',
      } as SecuritySchemeObjectSecret,
    ])

    expect(result.url).toBe('wss://echo.example.com/socket?apiKey=new-value')
  })

  it('skips apiKey schemes that have no value yet', () => {
    const result = applyAuthToWebSocketUrl('wss://echo.example.com/socket', [
      {
        type: 'apiKey',
        name: 'apiKey',
        in: 'query',
        'x-scalar-secret-token': '',
      } as SecuritySchemeObjectSecret,
    ])

    expect(result.url).toBe('wss://echo.example.com/socket')
  })

  it('reports apiKey-in-header schemes as unsupported', () => {
    const result = applyAuthToWebSocketUrl('wss://echo.example.com/socket', [
      {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        'x-scalar-secret-token': 'secret',
      } as SecuritySchemeObjectSecret,
    ])

    expect(result.url).toBe('wss://echo.example.com/socket')
    expect(result.unsupported).toEqual([expect.objectContaining({ name: 'X-API-Key' })])
  })

  it('leaves apiKey-in-cookie credentials to the browser', () => {
    const result = applyAuthToWebSocketUrl('wss://echo.example.com/socket', [
      {
        type: 'apiKey',
        name: 'session',
        in: 'cookie',
        'x-scalar-secret-token': 'abc',
      } as SecuritySchemeObjectSecret,
    ])

    expect(result.url).toBe('wss://echo.example.com/socket')
    expect(result.unsupported).toEqual([])
  })

  it('embeds HTTP basic credentials in the URL userinfo', () => {
    const result = applyAuthToWebSocketUrl('wss://echo.example.com/socket', [
      {
        type: 'http',
        scheme: 'basic',
        'x-scalar-secret-username': 'user',
        'x-scalar-secret-password': 'pass',
      } as SecuritySchemeObjectSecret,
    ])

    expect(result.url).toBe('wss://user:pass@echo.example.com/socket')
  })

  it('percent-encodes basic auth credentials containing reserved characters', () => {
    const result = applyAuthToWebSocketUrl('wss://echo.example.com/socket', [
      {
        type: 'http',
        scheme: 'basic',
        'x-scalar-secret-username': 'us er',
        'x-scalar-secret-password': 'p@ss',
      } as SecuritySchemeObjectSecret,
    ])

    expect(result.url).toBe('wss://us%20er:p%40ss@echo.example.com/socket')
  })

  it('appends HTTP bearer tokens as the standard access_token query parameter', () => {
    const result = applyAuthToWebSocketUrl('wss://echo.example.com/socket', [
      {
        type: 'http',
        scheme: 'bearer',
        'x-scalar-secret-token': 'bearer-value',
      } as SecuritySchemeObjectSecret,
    ])

    expect(result.url).toBe(`wss://echo.example.com/socket?${WEBSOCKET_BEARER_TOKEN_QUERY_PARAM}=bearer-value`)
  })

  it('appends OAuth2 access tokens from any flow with a stored secret', () => {
    const result = applyAuthToWebSocketUrl('wss://echo.example.com/socket', [
      {
        type: 'oauth2',
        flows: {
          authorizationCode: {
            'x-scalar-secret-token': 'oauth-token',
          },
        },
      } as unknown as SecuritySchemeObjectSecret,
    ])

    expect(result.url).toBe(`wss://echo.example.com/socket?${WEBSOCKET_BEARER_TOKEN_QUERY_PARAM}=oauth-token`)
  })

  it('appends OpenID Connect access tokens like OAuth2 tokens', () => {
    const result = applyAuthToWebSocketUrl('wss://echo.example.com/socket', [
      {
        type: 'openIdConnect',
        openIdConnectUrl: 'https://issuer.example.com/.well-known/openid-configuration',
        flows: {
          authorizationCode: {
            'x-scalar-secret-token': 'oidc-token',
          },
        },
      } as unknown as SecuritySchemeObjectSecret,
    ])

    expect(result.url).toBe(`wss://echo.example.com/socket?${WEBSOCKET_BEARER_TOKEN_QUERY_PARAM}=oidc-token`)
  })

  it('applies multiple schemes in a single pass', () => {
    const result = applyAuthToWebSocketUrl('wss://echo.example.com/socket', [
      {
        type: 'apiKey',
        name: 'apiKey',
        in: 'query',
        'x-scalar-secret-token': 'key-value',
      } as SecuritySchemeObjectSecret,
      {
        type: 'http',
        scheme: 'bearer',
        'x-scalar-secret-token': 'bearer-value',
      } as SecuritySchemeObjectSecret,
    ])

    const url = new URL(result.url)
    expect(url.searchParams.get('apiKey')).toBe('key-value')
    expect(url.searchParams.get(WEBSOCKET_BEARER_TOKEN_QUERY_PARAM)).toBe('bearer-value')
  })

  it('skips bearer schemes when no token is present', () => {
    const result = applyAuthToWebSocketUrl('wss://echo.example.com/socket', [
      {
        type: 'http',
        scheme: 'bearer',
        'x-scalar-secret-token': '',
      } as SecuritySchemeObjectSecret,
    ])

    expect(result.url).toBe('wss://echo.example.com/socket')
  })

  it('skips OAuth flows when none carries a token', () => {
    const result = applyAuthToWebSocketUrl('wss://echo.example.com/socket', [
      {
        type: 'oauth2',
        flows: {
          authorizationCode: {},
        },
      } as unknown as SecuritySchemeObjectSecret,
    ])

    expect(result.url).toBe('wss://echo.example.com/socket')
  })
})
