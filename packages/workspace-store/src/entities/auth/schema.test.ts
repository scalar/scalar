import { describe, expect, it } from 'vitest'

import { createWorkspaceStore } from '@/client'
import { createAuthStore } from '@/entities/auth'
import { authMutatorsFactory } from '@/mutators/auth'
import { extractSecuritySchemeSecrets } from '@/request-example/context/security/extract-security-scheme-secrets'
import type { OAuth2Object } from '@/schemas/v3.2/strict/security-scheme'

describe('schema', () => {
  it.each(['oauth2', 'openIdConnect'] as const)(
    'preserves absent, empty, and custom redirect overrides for %s',
    (type) => {
      const store = createAuthStore()
      for (const redirect of [undefined, '', 'https://app.example.com/callback']) {
        const flow = {
          'x-scalar-secret-client-id': 'client',
          ...(redirect === undefined ? {} : { 'x-scalar-secret-redirect-uri': redirect }),
        }
        store.setAuthSecrets('document', 'OAuth', { type, implicit: flow, authorizationCode: flow })
        const secrets = store.getAuthSecrets('document', 'OAuth')
        expect(secrets?.type).toBe(type)
        if (secrets?.type !== 'oauth2' && secrets?.type !== 'openIdConnect') {
          throw new Error('Expected OAuth flow secrets')
        }
        expect(secrets.implicit?.['x-scalar-secret-redirect-uri']).toBe(redirect)
        expect(secrets.authorizationCode?.['x-scalar-secret-redirect-uri']).toBe(redirect)
      }
    },
  )

  it.each(['top-level', 'per-flow'] as const)(
    'preserves the %s configured redirect through credentials and token updates',
    async (source) => {
      const redirectUri = 'https://app.example.com/callback'
      const store = createWorkspaceStore()
      await store.addDocument({
        name: 'oauth',
        document: { openapi: '3.2.0', info: { title: 'OAuth', version: '1.0.0' }, paths: {} },
      })
      const mutators = authMutatorsFactory({ store, document: store.workspace.activeDocument ?? null })
      const scheme = {
        type: 'oauth2',
        flows: {
          authorizationCode: {
            authorizationUrl: 'https://issuer.example.com/authorize',
            tokenUrl: 'https://issuer.example.com/token',
            refreshUrl: '',
            'x-usePkce': 'no',
            scopes: {},
            ...(source === 'per-flow' ? { 'x-scalar-redirect-uri': redirectUri } : {}),
          },
        },
      } satisfies OAuth2Object
      const readRedirect = (): string | undefined => {
        const effective = extractSecuritySchemeSecrets(
          scheme,
          store.auth,
          'OAuth',
          'oauth',
          source === 'top-level' ? redirectUri : undefined,
        )
        return effective.type === 'oauth2'
          ? effective.flows.authorizationCode?.['x-scalar-secret-redirect-uri']
          : undefined
      }
      expect(readRedirect()).toBe(redirectUri)
      mutators.updateSecuritySchemeSecrets({
        name: 'OAuth',
        payload: { type: 'oauth2', authorizationCode: { 'x-scalar-credentials-location': 'body' } },
      })
      expect(readRedirect()).toBe(redirectUri)
      mutators.updateSecuritySchemeSecrets({
        name: 'OAuth',
        payload: {
          type: 'oauth2',
          authorizationCode: {
            'x-scalar-secret-token': 'access-token',
            'x-scalar-secret-refresh-token': 'refresh-token',
          },
        },
      })
      expect(readRedirect()).toBe(redirectUri)
      mutators.updateSecuritySchemeSecrets({
        name: 'OAuth',
        payload: {
          type: 'oauth2',
          authorizationCode: { 'x-scalar-secret-token': '', 'x-scalar-secret-refresh-token': '' },
        },
      })
      expect(readRedirect()).toBe(redirectUri)
      // An intentional clear still overrides the configured redirect after other edits.
      mutators.updateSecuritySchemeSecrets({
        name: 'OAuth',
        payload: { type: 'oauth2', authorizationCode: { 'x-scalar-secret-redirect-uri': '' } },
      })
      mutators.updateSecuritySchemeSecrets({
        name: 'OAuth',
        payload: { type: 'oauth2', authorizationCode: { 'x-scalar-credentials-location': 'header' } },
      })
      expect(readRedirect()).toBe('')
    },
  )
})
