import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { assert, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  isSecretKey,
  loadAuthSchemesFromStorage,
  loadClientFromStorage,
  mergeSecrets,
} from '@/helpers/load-from-perssistance'
import { authStorage, clientStorage } from '@/helpers/storage'

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

  it('does not merge secrets with falsy stored values', () => {
    const current = {
      type: 'apiKey',
      'x-scalar-secret-token': 'existing-value',
    }

    const stored = {
      type: 'apiKey',
      'x-scalar-secret-token': '',
    }

    mergeSecrets(current, stored)

    // Empty string should not overwrite existing value
    expect(current['x-scalar-secret-token']).toBe('existing-value')
  })

  it('handles null stored values gracefully', () => {
    const current = {
      type: 'apiKey',
      'x-scalar-secret-token': 'existing-value',
    }

    const stored = {
      type: 'apiKey',
      'x-scalar-secret-token': null,
    }

    mergeSecrets(current, stored)

    // Null should not overwrite existing value
    expect(current['x-scalar-secret-token']).toBe('existing-value')
  })

  it('handles undefined stored values gracefully', () => {
    const current = {
      type: 'apiKey',
      'x-scalar-secret-token': 'existing-value',
    }

    const stored = {
      type: 'apiKey',
      'x-scalar-secret-token': undefined,
    }

    mergeSecrets(current, stored)

    // Undefined should not overwrite existing value
    expect(current['x-scalar-secret-token']).toBe('existing-value')
  })

  it('returns early when current is not an object', () => {
    const current = 'string-value'
    const stored = {
      'x-scalar-secret-token': 'secret',
    }

    // Should not throw, just return early
    expect(() => mergeSecrets(current, stored)).not.toThrow()
  })

  it('returns early when stored is not an object', () => {
    const current = {
      'x-scalar-secret-token': '',
    }
    const stored = 'string-value'

    // Should not throw, just return early
    expect(() => mergeSecrets(current, stored)).not.toThrow()
    expect(current['x-scalar-secret-token']).toBe('')
  })

  it('returns early when current is null', () => {
    const current = null
    const stored = {
      'x-scalar-secret-token': 'secret',
    }

    // Should not throw, just return early
    expect(() => mergeSecrets(current, stored)).not.toThrow()
  })

  it('returns early when stored is null', () => {
    const current = {
      'x-scalar-secret-token': '',
    }
    const stored = null

    // Should not throw, just return early
    expect(() => mergeSecrets(current, stored)).not.toThrow()
    expect(current['x-scalar-secret-token']).toBe('')
  })

  it('handles arrays without merging secrets', () => {
    const current = ['value1', 'value2']
    const stored = ['value3', 'value4']

    // Should not throw, arrays are objects but should not be merged
    expect(() => mergeSecrets(current, stored)).not.toThrow()
    expect(current).toEqual(['value1', 'value2'])
  })

  it('handles deeply nested structures', () => {
    const current = {
      level1: {
        level2: {
          level3: {
            'x-scalar-secret-deep': '',
          },
        },
      },
    }

    const stored = {
      level1: {
        level2: {
          level3: {
            'x-scalar-secret-deep': 'deep-secret',
          },
        },
      },
    }

    mergeSecrets(current, stored)

    expect(current.level1.level2.level3['x-scalar-secret-deep']).toBe('deep-secret')
  })
})

describe('loadClientFromStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads client from storage when valid client exists and no default is set', () => {
    const store = createWorkspaceStore()

    clientStorage().set('js/fetch')

    loadClientFromStorage(store)

    expect(store.workspace['x-scalar-default-client']).toBe('js/fetch')
  })

  it('does not load client when default client is already set', () => {
    const store = createWorkspaceStore()
    store.update('x-scalar-default-client', 'js/fetch')

    clientStorage().set('php/guzzle')

    loadClientFromStorage(store)

    expect(store.workspace['x-scalar-default-client']).toBe('js/fetch')
  })

  it('does not load client when stored value is not a valid client', () => {
    const store = createWorkspaceStore()
    clientStorage().set('invalid-client')

    loadClientFromStorage(store)

    expect(store.workspace['x-scalar-default-client']).toBeUndefined()
  })
})

describe('loadAuthSchemesFromStorage', () => {
  it('does not restore when stored schemes or selected schemes are empty', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'my-doc',
      document: {
        openapi: '3.1.0',
        info: { title: 'My Document' },
        components: {
          securitySchemes: {
            apiKey: { type: 'apiKey', name: 'X-API-Key', in: 'header' },
          },
        },
      },
    })
    store.update('x-scalar-active-document', 'my-doc')

    authStorage().setSchemas('my-doc', {})
    authStorage().setSelectedSchemes('my-doc', {})

    loadAuthSchemesFromStorage(store)

    expect(store.workspace.activeDocument?.['x-scalar-selected-security']).toBeUndefined()
  })

  it('restores selected auth schemes when valid stored data exists', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'my-doc',
      document: {
        openapi: '3.1.0',
        info: { title: 'My Document' },
        components: {
          securitySchemes: {
            apiKey: { type: 'apiKey', name: 'X-API-Key', in: 'header' },
          },
        },
      },
    })
    store.update('x-scalar-active-document', 'my-doc')
    authStorage().setSchemas('my-doc', {
      apiKey: {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        'x-scalar-secret-token': 'my-secret-token',
      },
    })
    authStorage().setSelectedSchemes('my-doc', {
      'x-scalar-selected-security': {
        selectedIndex: 0,
        selectedSchemes: [{ apiKey: [] }],
      },
    })
    loadAuthSchemesFromStorage(store)

    expect(store.workspace.activeDocument!['x-scalar-selected-security']).toEqual({
      selectedIndex: 0,
      selectedSchemes: [{ apiKey: [] }],
    })
  })

  it('filters out invalid schemes from stored selected schemes', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'my-doc',
      document: {
        openapi: '3.1.0',
        info: { title: 'My Document' },
        components: {
          securitySchemes: {
            apiKey: { type: 'apiKey', name: 'X-API-Key', in: 'header' },
            oauth2: { type: 'oauth2', flows: { clientCredentials: { tokenUrl: 'https://example.com/oauth/token' } } },
          },
        },
      },
    })
    store.update('x-scalar-active-document', 'my-doc')
    authStorage().setSelectedSchemes('my-doc', {
      'x-scalar-selected-security': {
        selectedIndex: 0,
        selectedSchemes: [{ apiKey: [] }, { nonExisting: [] }],
      },
    })
    loadAuthSchemesFromStorage(store)

    expect(store.workspace.activeDocument!['x-scalar-selected-security']?.selectedSchemes).toEqual([{ apiKey: [] }])
    expect(store.workspace.activeDocument!['x-scalar-selected-security']?.selectedIndex).toBe(0)
  })

  it('does not overwrite existing x-scalar-selected-security', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'my-doc',
      document: {
        openapi: '3.1.0',
        info: { title: 'My Document' },
        components: {
          securitySchemes: {
            apiKey: { type: 'apiKey', name: 'X-API-Key', in: 'header', 'x-scalar-secret-token': 'my-secret-token' },
          },
        },
      },
    })
    store.update('x-scalar-active-document', 'my-doc')
    authStorage().setSchemas('my-doc', {
      apiKey: {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        'x-scalar-secret-token': 'another-secret-token',
      },
    })
    authStorage().setSelectedSchemes('my-doc', {
      'x-scalar-selected-security': {
        selectedIndex: 0,
        selectedSchemes: [{ apiKey: [] }],
      },
    })
    loadAuthSchemesFromStorage(store)

    expect(store.workspace.activeDocument!['x-scalar-selected-security']?.selectedIndex).toBe(0)
    expect(store.workspace.activeDocument!['x-scalar-selected-security']?.selectedSchemes).toEqual([{ apiKey: [] }])

    const documentApiKeySChema = getResolvedRef(store.workspace.activeDocument?.components?.securitySchemes?.apiKey)
    assert(documentApiKeySChema && documentApiKeySChema.type === 'apiKey')

    expect(documentApiKeySChema['x-scalar-secret-token']).toBe('my-secret-token')
  })

  it('does not set x-scalar-selected-security when all stored schemes are filtered out', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'my-doc',
      document: {
        openapi: '3.1.0',
        info: { title: 'My Document' },
        components: {
          securitySchemes: {
            apiKey: { type: 'apiKey', name: 'X-API-Key', in: 'header' },
          },
        },
      },
    })
    store.update('x-scalar-active-document', 'my-doc')

    // Store schemes that don't exist in the current document
    authStorage().setSchemas('my-doc', {
      nonExisting: {
        type: 'apiKey',
        name: 'X-Old-Key',
        in: 'header',
        'x-scalar-secret-token': '',
      },
    })
    authStorage().setSelectedSchemes('my-doc', {
      'x-scalar-selected-security': {
        selectedIndex: 0,
        selectedSchemes: [{ nonExisting: [] }],
      },
    })

    loadAuthSchemesFromStorage(store)

    // Should not set x-scalar-selected-security when all schemes are filtered out
    // This allows the default fallback logic in getSelectedSecurity to work correctly
    expect(store.workspace.activeDocument?.['x-scalar-selected-security']).toBeUndefined()
  })
})
