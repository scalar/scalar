import { describe, expect, it } from 'vitest'

import { createWorkspaceStore } from '@/client'
import { createAuthStore } from '@/entities/auth'
import { authMutatorsFactory } from '@/mutators/auth'
import type {
  OAuthFlowsObjectSecret,
  SecuritySchemeObjectSecret,
} from '@/request-example/builder/security/secret-types'
import { mergeSecurity } from '@/request-example/context/security/merge-security'

import {
  type AuthSecretField,
  canResetSecretField,
  getSecretFieldDefault,
  isSecretFieldCleared,
  resetSecretField,
  updateClearedSecretFields,
} from './auth-secret-fields'

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

  const setup = async (): Promise<{
    store: ReturnType<typeof createWorkspaceStore>
    mutators: ReturnType<typeof authMutatorsFactory>
    read: () => OAuthFlowsObjectSecret
  }> => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'document',
      document: { openapi: '3.1.0', info: { title: 'Auth fields', version: '1' }, paths: {} },
    })
    const mutators = authMutatorsFactory({ store, document: store.workspace.activeDocument ?? null })
    const read = (): OAuthFlowsObjectSecret => {
      const scheme = mergeSecurity({}, { OAuth: defaults }, store.auth, 'document').OAuth
      if (scheme?.type !== 'oauth2') {
        throw new Error('Expected OAuth2 scheme')
      }
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
    const expected = {
      ...initial,
      authorizationCode: { ...initial.authorizationCode, [field]: '', 'x-scalar-secret-cleared-fields': [field] },
    }
    expect(read()).toStrictEqual(expected)
    const restored = createAuthStore()
    restored.load(store.auth.export())
    const persisted = mergeSecurity({}, { OAuth: defaults }, restored, 'document').OAuth
    if (persisted?.type !== 'oauth2') {
      throw new Error('Expected OAuth2 scheme')
    }
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
        'x-scalar-secret-cleared-fields': ['x-scalar-secret-token-url'],
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
    const read = (): SecuritySchemeObjectSecret | undefined =>
      mergeSecurity({}, { Auth: scheme }, store.auth, 'document').Auth
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
    const read = (): SecuritySchemeObjectSecret | undefined => mergeSecurity({}, schemes, store.auth, 'document').OIDC
    const initial = read()
    mutators.updateSecuritySchemeSecrets({
      name: 'OIDC',
      payload: { type: 'openIdConnect', authorizationCode: { 'x-scalar-secret-auth-url': '' } },
    })
    const cleared = read()
    if (cleared?.type !== 'openIdConnect') {
      throw new Error('Expected OpenID Connect')
    }
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

  describe('canResetSecretField', () => {
    const field = 'x-scalar-secret-client-id'
    const withDefault = { 'x-scalar-secret-defaults': { [field]: 'configured' } }

    it.each([
      ['no default and an empty value', {}, '', false],
      ['no default and a typed value', {}, 'typed', false],
      ['a value equal to its default', withDefault, 'configured', false],
      ['a value different from its default', withDefault, 'typed', true],
      ['a cleared value with a default', withDefault, '', true],
      ['a missing value with a default', withDefault, undefined, true],
    ] as const)('handles %s', (_, secrets, value, expected) => {
      expect(canResetSecretField(secrets, field, value)).toBe(expected)
    })

    it('uses the fallback only when the merged default is empty', () => {
      expect(canResetSecretField({}, field, 'typed', 'fallback')).toBe(true)
      expect(canResetSecretField({}, field, 'fallback', 'fallback')).toBe(false)
      expect(canResetSecretField(withDefault, field, 'fallback', 'fallback')).toBe(true)
      expect(canResetSecretField(withDefault, field, 'configured', 'fallback')).toBe(false)
    })

    it('ignores defaults that are not strings', () => {
      expect(getSecretFieldDefault({ 'x-scalar-secret-defaults': 'configured' }, field)).toBe('')
      expect(getSecretFieldDefault({ 'x-scalar-secret-defaults': { [field]: 42 } }, field)).toBe('')
    })
  })

  describe('reset restores the reported default', () => {
    const oauth = {
      type: 'oauth2',
      flows: {
        authorizationCode: {
          authorizationUrl: 'https://example.com/auth',
          tokenUrl: 'https://example.com/token',
          refreshUrl: '',
          scopes: {},
          'x-usePkce': 'no',
          'x-scalar-client-id': 'configured-client',
          clientSecret: 'configured-secret',
          'x-scalar-redirect-uri': 'https://example.com/callback',
          token: 'configured-token',
        },
        password: {
          tokenUrl: 'https://example.com/token',
          refreshUrl: '',
          scopes: {},
          username: 'configured-user',
          password: 'configured-password',
        },
      },
    } as const
    const http = {
      type: 'http',
      scheme: 'basic',
      token: 'configured-token',
      username: 'configured-user',
      password: 'configured-password',
    } as const
    const apiKey = { type: 'apiKey', in: 'header', name: 'X-Key', value: 'configured-key' } as const

    const oauthFields: [flow: 'authorizationCode' | 'password', field: AuthSecretField][] = [
      ['authorizationCode', 'x-scalar-secret-client-id'],
      ['authorizationCode', 'x-scalar-secret-client-secret'],
      ['authorizationCode', 'x-scalar-secret-redirect-uri'],
      ['authorizationCode', 'x-scalar-secret-token'],
      ['authorizationCode', 'x-scalar-secret-auth-url'],
      ['authorizationCode', 'x-scalar-secret-token-url'],
      ['password', 'x-scalar-secret-username'],
      ['password', 'x-scalar-secret-password'],
    ]
    const cases = oauthFields.flatMap(([flow, field]) =>
      (['override', 'clear'] as const).map((mode) => [flow, field, mode] as const),
    )

    it.each(cases)('restores %s %s after an %s', async (flow, field, mode) => {
      const { store, mutators } = await setup()
      const read = (): Record<string, unknown> => {
        const scheme = mergeSecurity({}, { OAuth: oauth }, store.auth, 'document').OAuth
        if (scheme?.type !== 'oauth2') {
          throw new Error('Expected OAuth2 scheme')
        }
        const merged = scheme.flows[flow]
        if (!merged) {
          throw new Error('Expected the flow')
        }
        return merged
      }
      mutators.updateSecuritySchemeSecrets({
        name: 'OAuth',
        payload: { type: 'oauth2', [flow]: { [field]: mode === 'clear' ? '' : 'https://override.example.com' } },
      })
      const before = read()
      const target = getSecretFieldDefault(before, field)
      expect(target).not.toBe('')
      expect(canResetSecretField(before, field, before[field] as string)).toBe(true)

      mutators.resetSecuritySchemeSecret({ name: 'OAuth', flow, field })

      const after = read()
      expect(after[field]).toBe(target)
      expect(canResetSecretField(after, field, after[field] as string)).toBe(false)
    })

    const schemeFields = [
      ['http', 'x-scalar-secret-token'],
      ['http', 'x-scalar-secret-username'],
      ['http', 'x-scalar-secret-password'],
      ['apiKey', 'x-scalar-secret-token'],
    ] as const
    const schemeCases = schemeFields.flatMap(([type, field]) =>
      (['override', 'clear'] as const).map((mode) => [type, field, mode] as const),
    )

    it.each(schemeCases)('restores %s %s after an %s', async (type, field, mode) => {
      const { store, mutators } = await setup()
      const read = (): Record<string, unknown> => {
        const scheme = mergeSecurity({}, { Auth: type === 'http' ? http : apiKey }, store.auth, 'document').Auth
        if (!scheme) {
          throw new Error('Expected the scheme')
        }
        return scheme
      }
      mutators.updateSecuritySchemeSecrets({
        name: 'Auth',
        payload: { type, [field]: mode === 'clear' ? '' : 'override' },
      })
      const before = read()
      const target = getSecretFieldDefault(before, field)
      expect(target).not.toBe('')
      expect(canResetSecretField(before, field, before[field] as string)).toBe(true)

      mutators.resetSecuritySchemeSecret({ name: 'Auth', field })

      const after = read()
      expect(after[field]).toBe(target)
      expect(canResetSecretField(after, field, after[field] as string)).toBe(false)
    })

    // OpenID Connect stores the discovered flow in the auth store, so only the discovered URLs are defaults
    const oidcFields = ['x-scalar-secret-auth-url', 'x-scalar-secret-token-url'] as const
    const oidcCases = oidcFields.flatMap((field) =>
      (['override', 'clear'] as const).map((mode) => [field, mode] as const),
    )

    it.each(oidcCases)('restores OpenID Connect %s after an %s', async (field, mode) => {
      const { store, mutators } = await setup()
      mutators.updateSecuritySchemeSecrets({
        name: 'OIDC',
        overwrite: true,
        payload: {
          type: 'openIdConnect',
          authorizationCode: {
            authorizationUrl: 'https://example.com/auth',
            tokenUrl: 'https://example.com/token',
            refreshUrl: '',
            scopes: {},
            'x-scalar-secret-client-id': 'edited',
          },
        },
      })
      const schemes = { OIDC: { type: 'openIdConnect', openIdConnectUrl: 'https://example.com/discovery' } } as const
      const read = (): Record<string, unknown> => {
        const scheme = mergeSecurity({}, schemes, store.auth, 'document').OIDC
        const merged = scheme?.type === 'openIdConnect' ? scheme.flows?.authorizationCode : undefined
        if (!merged) {
          throw new Error('Expected the discovered flow')
        }
        return merged
      }
      mutators.updateSecuritySchemeSecrets({
        name: 'OIDC',
        payload: {
          type: 'openIdConnect',
          authorizationCode: { [field]: mode === 'clear' ? '' : 'https://override.example.com' },
        },
      })
      const before = read()
      const target = getSecretFieldDefault(before, field)
      expect(target).not.toBe('')
      expect(canResetSecretField(before, field, before[field] as string)).toBe(true)
      expect(getSecretFieldDefault(before, 'x-scalar-secret-client-id')).toBe('')

      mutators.resetSecuritySchemeSecret({ name: 'OIDC', flow: 'authorizationCode', field })

      const after = read()
      expect(after[field]).toBe(target)
      expect(canResetSecretField(after, field, after[field] as string)).toBe(false)
    })
  })
})
