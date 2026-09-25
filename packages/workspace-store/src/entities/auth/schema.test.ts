import { describe, expect, it } from 'vitest'

import { createAuthStore } from '@/entities/auth'

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
})
