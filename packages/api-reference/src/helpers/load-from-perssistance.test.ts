import { describe, expect, it } from 'vitest'

import { isSecretKey, mergeSecrets } from '@/helpers/load-from-perssistance'

describe('isSecretKey', () => {
  it('returns true for keys starting with x-scalar-secret-', () => {
    expect(isSecretKey('x-scalar-secret-token')).toBe(true)
    expect(isSecretKey('x-scalar-secret-password')).toBe(true)
    expect(isSecretKey('x-scalar-secret-client-id')).toBe(true)
    expect(isSecretKey('x-scalar-secret-anything')).toBe(true)
  })

  it('returns false for keys not starting with x-scalar-secret-', () => {
    expect(isSecretKey('type')).toBe(false)
    expect(isSecretKey('name')).toBe(false)
    expect(isSecretKey('x-scalar-other')).toBe(false)
    expect(isSecretKey('flows')).toBe(false)
  })
})

describe('mergeSecrets', () => {
  it('merges top-level secret keys from stored to current', () => {
    const current = {
      type: 'apiKey',
      name: 'Authorization',
      'x-scalar-secret-token': '',
    }

    const stored = {
      type: 'apiKey',
      name: 'Authorization',
      'x-scalar-secret-token': 'my-secret-token',
    }

    mergeSecrets(current, stored)

    expect(current).toEqual({
      type: 'apiKey',
      name: 'Authorization',
      'x-scalar-secret-token': 'my-secret-token',
    })
  })

  it('deos not merge when the key is not defined in the current schema', () => {
    const current = {
      type: 'apiKey',
      name: 'Authorization',
    }

    const stored = {
      type: 'apiKey',
      name: 'Authorization',
      'x-scalar-secret-token': 'my-secret-token',
    }

    mergeSecrets(current, stored)

    expect(current).toEqual({
      type: 'apiKey',
      name: 'Authorization',
    })
  })

  it('merges multiple secret keys', () => {
    const current = {
      type: 'http',
      scheme: 'basic',
      'x-scalar-secret-username': '',
      'x-scalar-secret-password': '',
    }

    const stored = {
      type: 'http',
      scheme: 'basic',
      'x-scalar-secret-username': 'user123',
      'x-scalar-secret-password': 'pass456',
    }

    mergeSecrets(current, stored)

    expect(current).toEqual({
      type: 'http',
      scheme: 'basic',
      'x-scalar-secret-username': 'user123',
      'x-scalar-secret-password': 'pass456',
    })
  })

  it('recursively merges secrets in nested objects', () => {
    const current = {
      type: 'oauth2',
      flows: {
        authorizationCode: {
          authorizationUrl: 'https://example.com/oauth/authorize',
          tokenUrl: 'https://example.com/oauth/token',
          'x-scalar-secret-client-id': '',
          'x-scalar-secret-client-secret': '',
          'x-scalar-secret-redirect-uri': '',
        },
      },
    }

    const stored = {
      type: 'oauth2',
      flows: {
        authorizationCode: {
          authorizationUrl: 'https://example.com/oauth/authorize',
          tokenUrl: 'https://example.com/oauth/token',
          'x-scalar-secret-client-id': 'my-client-id',
          'x-scalar-secret-client-secret': 'my-client-secret',
          'x-scalar-secret-redirect-uri': 'https://example.com/callback',
        },
      },
    }

    mergeSecrets(current, stored)

    expect(current).toEqual({
      type: 'oauth2',
      flows: {
        authorizationCode: {
          authorizationUrl: 'https://example.com/oauth/authorize',
          tokenUrl: 'https://example.com/oauth/token',
          'x-scalar-secret-client-id': 'my-client-id',
          'x-scalar-secret-client-secret': 'my-client-secret',
          'x-scalar-secret-redirect-uri': 'https://example.com/callback',
        },
      },
    })
  })

  it('only merges secrets if the path exists in current schema', () => {
    const current = {
      type: 'oauth2',
      flows: {
        authorizationCode: {
          authorizationUrl: 'https://example.com/oauth/authorize',
          tokenUrl: 'https://example.com/oauth/token',
          'x-scalar-secret-client-id': '',
        },
      },
    }

    // Stored has a 'password' flow that does not exist in current
    const stored = {
      type: 'oauth2',
      flows: {
        authorizationCode: {
          'x-scalar-secret-client-id': 'auth-code-client-id',
        },
        password: {
          tokenUrl: 'https://example.com/oauth/token',
          'x-scalar-secret-username': 'user123',
          'x-scalar-secret-password': 'pass456',
        },
      },
    }

    mergeSecrets(current, stored)

    // Should only merge authorizationCode secrets, not password flow
    expect(current).toEqual({
      type: 'oauth2',
      flows: {
        authorizationCode: {
          authorizationUrl: 'https://example.com/oauth/authorize',
          tokenUrl: 'https://example.com/oauth/token',
          'x-scalar-secret-client-id': 'auth-code-client-id',
        },
      },
    })

    // Password flow should not be added
    expect('password' in (current.flows as Record<string, unknown>)).toBe(false)
  })

  it('does not merge non-secret keys from stored', () => {
    const current = {
      type: 'apiKey',
      name: 'Authorization',
      in: 'header',
      'x-scalar-secret-token': '',
    }

    const stored = {
      type: 'apiKey',
      name: 'X-API-Key', // Different name in stored
      in: 'query', // Different location in stored
      'x-scalar-secret-token': 'my-secret-token',
    }

    mergeSecrets(current, stored)

    // Only secret should be merged, not name or in
    expect(current).toEqual({
      type: 'apiKey',
      name: 'Authorization', // Unchanged
      in: 'header', // Unchanged
      'x-scalar-secret-token': 'my-secret-token', // Merged
    })
  })
})
