import { describe, expect, it } from 'vitest'

import { createWorkspaceStore } from '@/client'
import { createAuthStore } from '@/entities/auth'
import { authMutatorsFactory } from '@/mutators/auth'
import { mergeSecurity } from '@/request-example/context/security/merge-security'

import { isSecretFieldCleared, resetSecretField, updateClearedSecretFields } from './auth-secret-fields'

describe('auth-secret-fields', () => {
  const defaults = {
    type: 'oauth2',
    flows: {
      authorizationCode: {
        authorizationUrl: 'https://example.com/auth',
        tokenUrl: 'https://example.com/token',
        refreshUrl: '',
        scopes: { read: 'Read' },
        'x-usePkce': 'SHA-256',
        'x-scalar-client-id': 'configured-client',
        clientSecret: 'configured-secret',
        'x-scalar-redirect-uri': 'https://example.com/callback',
      },
      clientCredentials: {
        tokenUrl: 'https://example.com/other-token',
        refreshUrl: '',
        scopes: {},
        clientSecret: 'other-secret',
      },
    },
  } as const

  const setup = async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'document',
      document: { openapi: '3.1.0', info: { title: 'Auth fields', version: '1' }, paths: {} },
    })
    const mutators = authMutatorsFactory({ store, document: store.workspace.activeDocument ?? null })
    const read = () => {
      const scheme = mergeSecurity({}, { OAuth: defaults }, store.auth, 'document').OAuth
      if (scheme?.type !== 'oauth2') throw new Error('Expected OAuth2 scheme')
      return scheme.flows
    }
    return { store, mutators, read }
  }

  it('records only fields explicitly cleared in an update', () => {
    const secrets = { 'x-scalar-secret-client-id': '', 'x-scalar-secret-client-secret': '' }
    updateClearedSecretFields(secrets, { 'x-scalar-secret-client-id': '' })
    expect(isSecretFieldCleared(secrets, 'x-scalar-secret-client-id')).toBe(true)
    expect(isSecretFieldCleared(secrets, 'x-scalar-secret-client-secret')).toBe(false)
    updateClearedSecretFields(secrets, { 'x-scalar-secret-client-id': 'edited' })
    expect(secrets).toStrictEqual({ 'x-scalar-secret-client-id': '', 'x-scalar-secret-client-secret': '' })
  })

  it.each([
    'x-scalar-secret-auth-url',
    'x-scalar-secret-token-url',
    'x-scalar-secret-client-id',
    'x-scalar-secret-client-secret',
    'x-scalar-secret-redirect-uri',
  ] as const)('clears and resets only %s, including after persistence', async (field) => {
    const { store, mutators, read } = await setup()
    const initial = read()
    mutators.updateSecuritySchemeSecrets({
      name: 'OAuth',
      payload: { type: 'oauth2', authorizationCode: { [field]: '' } },
    })
    const expected = { ...initial, authorizationCode: { ...initial.authorizationCode, [field]: '' } }
    expect(read()).toStrictEqual(expected)
    const restored = createAuthStore()
    restored.load(store.auth.export())
    const persisted = mergeSecurity({}, { OAuth: defaults }, restored, 'document').OAuth
    if (persisted?.type !== 'oauth2') throw new Error('Expected OAuth2 scheme')
    expect(persisted.flows).toStrictEqual(expected)
    mutators.resetSecuritySchemeSecret({ name: 'OAuth', flow: 'authorizationCode', field })
    expect(read()).toStrictEqual(initial)
  })

  it('keeps sibling clears and stored tokens when one URL is reset', async () => {
    const { mutators, read } = await setup()
    mutators.updateSecuritySchemeSecrets({
      name: 'OAuth',
      payload: {
        type: 'oauth2',
        authorizationCode: {
          'x-scalar-secret-auth-url': '',
          'x-scalar-secret-token-url': '',
          'x-scalar-secret-token': 'access',
          'x-scalar-secret-refresh-token': 'refresh',
        },
      },
    })
    const before = read()
    mutators.resetSecuritySchemeSecret({ name: 'OAuth', flow: 'authorizationCode', field: 'x-scalar-secret-auth-url' })
    expect(read()).toStrictEqual({
      ...before,
      authorizationCode: {
        ...before.authorizationCode,
        'x-scalar-secret-auth-url': defaults.flows.authorizationCode.authorizationUrl,
      },
    })
  })

  it('preserves legacy default fallback when another credential is edited', async () => {
    const { store, mutators, read } = await setup()
    store.auth.load({
      document: {
        secrets: {
          OAuth: {
            type: 'oauth2',
            authorizationCode: {
              'x-scalar-secret-client-id': '',
              'x-scalar-secret-client-secret': '',
              'x-scalar-secret-token': '',
            },
          },
        },
        selected: {},
      },
    })
    mutators.updateSecuritySchemeSecrets({
      name: 'OAuth',
      payload: { type: 'oauth2', authorizationCode: { 'x-scalar-secret-client-id': 'edited' } },
    })
    expect(read().authorizationCode?.['x-scalar-secret-client-secret']).toBe('configured-secret')
    expect(read().authorizationCode?.['x-scalar-secret-client-id']).toBe('edited')
  })

  it.each(['apiKey', 'basic', 'bearer'] as const)('clears and resets configured %s credentials', async (type) => {
    const { store, mutators } = await setup()
    const scheme =
      type === 'apiKey'
        ? ({ type: 'apiKey', in: 'header', name: 'X-Key', value: 'configured-token' } as const)
        : ({
            type: 'http',
            scheme: type,
            token: 'configured-token',
            username: 'configured-user',
            password: 'configured-password',
          } as const)
    const field = type === 'basic' ? 'x-scalar-secret-username' : 'x-scalar-secret-token'
    const read = () => mergeSecurity({}, { Auth: scheme }, store.auth, 'document').Auth
    const initial = read()
    mutators.updateSecuritySchemeSecrets({ name: 'Auth', payload: { type: scheme.type, [field]: '' } })
    expect(read()).toStrictEqual({ ...initial, [field]: '' })
    mutators.resetSecuritySchemeSecret({ name: 'Auth', field })
    expect(read()).toStrictEqual(initial)
  })

  it('resets an OpenID Connect URL without losing the discovered flow', async () => {
    const { store, mutators } = await setup()
    mutators.updateSecuritySchemeSecrets({
      name: 'OIDC',
      overwrite: true,
      payload: {
        type: 'openIdConnect',
        authorizationCode: { ...defaults.flows.authorizationCode, 'x-scalar-secret-client-id': 'edited' },
      },
    })
    const schemes = { OIDC: { type: 'openIdConnect', openIdConnectUrl: 'https://example.com/discovery' } } as const
    const read = () => mergeSecurity({}, schemes, store.auth, 'document').OIDC
    const initial = read()
    mutators.updateSecuritySchemeSecrets({
      name: 'OIDC',
      payload: { type: 'openIdConnect', authorizationCode: { 'x-scalar-secret-auth-url': '' } },
    })
    const cleared = read()
    if (cleared?.type !== 'openIdConnect') throw new Error('Expected OpenID Connect')
    expect(cleared.flows?.authorizationCode?.['x-scalar-secret-auth-url']).toBe('')
    mutators.resetSecuritySchemeSecret({ name: 'OIDC', flow: 'authorizationCode', field: 'x-scalar-secret-auth-url' })
    expect(read()).toStrictEqual(initial)
  })

  it('removes only the selected override and clear marker', () => {
    const secrets = {
      'x-scalar-secret-client-id': '',
      'x-scalar-secret-client-secret': '',
      'x-scalar-secret-cleared-fields': ['x-scalar-secret-client-id', 'x-scalar-secret-client-secret'],
    }
    resetSecretField(secrets, 'x-scalar-secret-client-id')
    expect(secrets).toStrictEqual({
      'x-scalar-secret-client-secret': '',
      'x-scalar-secret-cleared-fields': ['x-scalar-secret-client-secret'],
    })
  })
})
