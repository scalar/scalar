import { describe, expect, it } from 'vitest'

import type { ApiKeyObjectSecret, HttpObjectSecret } from '@/request-example/builder/security/secret-types'

import { resolveCredentialPlaceholders } from './resolve-credential-placeholders'

const apiKey = (token = 'secret'): ApiKeyObjectSecret => ({
  type: 'apiKey',
  name: 'X-API-Key',
  in: 'header',
  'x-scalar-secret-token': token,
  'x-scalar-credential-placeholders': { apiKey: { field: 'token' } },
})

const basic = (password = 'secret'): HttpObjectSecret => ({
  type: 'http',
  scheme: 'basic',
  'x-scalar-secret-token': '',
  'x-scalar-secret-username': 'public-id',
  'x-scalar-secret-password': password,
  'x-scalar-credential-placeholders': {
    id: { field: 'username', mask: false },
    password: { field: 'password' },
  },
})

describe('resolve-credential-placeholders', () => {
  it('replaces repeated placeholders literally and leaves unknown names unchanged', () => {
    const result = resolveCredentialPlaceholders('{{apiKey}} {{unknown}} {{apiKey}}', [apiKey('$&"\\{{apiKey}}')])
    expect(result).toStrictEqual({
      content: '$&"\\{{apiKey}} {{unknown}} $&"\\{{apiKey}}',
      displayContent: '•••••••• {{unknown}} ••••••••',
    })
  })

  it.each(['pet', 'ab', 'a&b', '<secret>', '"quoted"', 'foo() + bar'])(
    'masks the inserted secret %s without modifying literal code',
    (secret) => {
      const result = resolveCredentialPlaceholders('client.pets.list("{{apiKey}}")', [apiKey(secret)])
      expect(result).toStrictEqual({
        content: `client.pets.list("${secret}")`,
        displayContent: 'client.pets.list("••••••••")',
      })
    },
  )

  it('masks a public value containing another secret', () => {
    expect(resolveCredentialPlaceholders('{{id}}', [basic('id')]).displayContent).toBe('••••••••')
  })

  it('leaves missing credentials and ambiguous bindings unchanged', () => {
    expect(resolveCredentialPlaceholders('{{apiKey}}', [apiKey('')]).content).toBe('{{apiKey}}')
    expect(resolveCredentialPlaceholders('{{apiKey}}', [apiKey(''), apiKey('other')]).content).toBe('{{apiKey}}')
    expect(resolveCredentialPlaceholders('{{apiKey}}', [apiKey('first'), apiKey('other')]).content).toBe('{{apiKey}}')
  })

  it('counts duplicate declarations even when OAuth has no active token', () => {
    const oauth = {
      type: 'oauth2' as const,
      flows: {},
      'x-scalar-credential-placeholders': { apiKey: { field: 'token' as const } },
    }
    for (const schemes of [
      [apiKey('available'), oauth],
      [oauth, apiKey('available')],
    ]) {
      expect(resolveCredentialPlaceholders('{{apiKey}}', schemes).content).toBe('{{apiKey}}')
    }
  })

  it('keeps a public ID visible while masking the password', () => {
    const result = resolveCredentialPlaceholders('{{id}}:{{password}}', [basic()])
    expect(result.content).toBe('public-id:secret')
    expect(result.displayContent).toBe('public-id:••••••••')
  })

  it('never unmasks a public value that is also a password', () => {
    const result = resolveCredentialPlaceholders('{{id}}:{{password}}', [basic('public-id')])
    expect(result.displayContent).toBe('••••••••:••••••••')
  })

  it('does not retain credentials across updates or mutate the original scheme', () => {
    const scheme = apiKey('first')
    expect(resolveCredentialPlaceholders('{{apiKey}}', [scheme]).content).toBe('first')
    scheme['x-scalar-secret-token'] = 'second'
    expect(resolveCredentialPlaceholders('{{apiKey}}', [scheme]).content).toBe('second')
    expect(resolveCredentialPlaceholders('{{apiKey}}', []).content).toBe('{{apiKey}}')
    expect(scheme).toStrictEqual(apiKey('second'))
  })

  it('uses only the OAuth flow used by the request builder', () => {
    const result = resolveCredentialPlaceholders('{{token}} {{id}}', [
      {
        type: 'oauth2',
        'x-scalar-credential-placeholders': { token: { field: 'token' }, id: { field: 'clientId', mask: false } },
        flows: {
          implicit: {
            authorizationUrl: '/auth',
            refreshUrl: '/refresh',
            scopes: {},
            'x-scalar-secret-client-id': 'unused',
            'x-scalar-secret-token': '',
            'x-scalar-secret-redirect-uri': '',
          },
          clientCredentials: {
            tokenUrl: '/token',
            refreshUrl: '/refresh',
            scopes: {},
            'x-scalar-secret-token': 'active-token',
            'x-scalar-secret-client-id': 'client-id',
            'x-scalar-secret-client-secret': 'client-secret',
          },
        },
      },
    ])
    expect(result.content).toBe('active-token client-id')
    expect(result.displayContent).toBe('•••••••• client-id')
  })
})
