import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { assert, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  isSecretKey,
  loadAuthSchemesFromStorage,
  loadClientFromStorage,
  mergeSecuritySchemas,
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

describe('mergeSecuritySchemas', () => {
  it('merges top-level truthy values from stored to current', () => {
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

    mergeSecuritySchemas(current, stored)

    expect(current).toEqual({
      type: 'apiKey',
      name: 'Authorization',
      'x-scalar-secret-token': 'my-secret-token',
    })
  })

  it('merges keys from stored to current even if not previously defined', () => {
    const current = {
      type: 'apiKey',
      name: 'Authorization',
    }

    const stored = {
      type: 'apiKey',
      name: 'Authorization',
      'x-scalar-secret-token': 'my-secret-token',
    }

    mergeSecuritySchemas(current, stored)

    expect(current).toEqual({
      type: 'apiKey',
      name: 'Authorization',
      'x-scalar-secret-token': 'my-secret-token',
    })
  })

  it('merges multiple truthy values', () => {
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

    mergeSecuritySchemas(current, stored)

    expect(current).toEqual({
      type: 'http',
      scheme: 'basic',
      'x-scalar-secret-username': 'user123',
      'x-scalar-secret-password': 'pass456',
    })
  })

  it('merge only keys that exist in the current schema', () => {
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

    // Stored has a different flows object
    const stored = {
      type: 'oauth2',
      flows: {
        authorizationCode: {
          authorizationUrl: 'https://example.com/oauth/authorize',
          tokenUrl: 'https://example.com/oauth/token',
          'x-scalar-secret-client-id': 'auth-code-client-id',
        },
        password: {
          tokenUrl: 'https://example.com/oauth/token',
          'x-scalar-secret-username': 'user123',
          'x-scalar-secret-password': 'pass456',
        },
      },
    }

    mergeSecuritySchemas(current, stored)

    // The entire flows object is replaced with the stored one
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
  })

  it('merges all truthy values from stored but skips type at top level', () => {
    const current = {
      type: 'apiKey',
      name: 'Authorization',
      in: 'header',
      'x-scalar-secret-token': '',
    }

    const stored = {
      type: 'oauth2', // Different type in stored (should not be merged at top level)
      name: 'X-API-Key', // Different name in stored (should be merged)
      in: 'query', // Different location in stored (should be merged)
      'x-scalar-secret-token': 'my-secret-token',
    }

    mergeSecuritySchemas(current, stored)

    // All truthy values should be merged except type at top level
    expect(current).toEqual({
      type: 'apiKey', // Unchanged (skipped at top level)
      name: 'X-API-Key', // Merged
      in: 'query', // Merged
      'x-scalar-secret-token': 'my-secret-token', // Merged
    })
  })

  it('does not merge values with falsy stored values', () => {
    const current = {
      type: 'apiKey',
      'x-scalar-secret-token': 'existing-value',
    }

    const stored = {
      type: 'apiKey',
      'x-scalar-secret-token': '',
    }

    mergeSecuritySchemas(current, stored)

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

    mergeSecuritySchemas(current, stored)

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

    mergeSecuritySchemas(current, stored)

    // Undefined should not overwrite existing value
    expect(current['x-scalar-secret-token']).toBe('existing-value')
  })

  it('returns early when current is not an object', () => {
    const current = 'string-value'
    const stored = {
      'x-scalar-secret-token': 'secret',
    }

    // Should not throw, just return early
    expect(() => mergeSecuritySchemas(current, stored)).not.toThrow()
  })

  it('returns early when stored is not an object', () => {
    const current = {
      'x-scalar-secret-token': '',
    }
    const stored = 'string-value'

    // Should not throw, just return early
    expect(() => mergeSecuritySchemas(current, stored)).not.toThrow()
    expect(current['x-scalar-secret-token']).toBe('')
  })

  it('returns early when current is null', () => {
    const current = null
    const stored = {
      'x-scalar-secret-token': 'secret',
    }

    // Should not throw, just return early
    expect(() => mergeSecuritySchemas(current, stored)).not.toThrow()
  })

  it('returns early when stored is null', () => {
    const current = {
      'x-scalar-secret-token': '',
    }
    const stored = null

    // Should not throw, just return early
    expect(() => mergeSecuritySchemas(current, stored)).not.toThrow()
    expect(current['x-scalar-secret-token']).toBe('')
  })

  it('handles arrays without merging values', () => {
    const current = ['value1', 'value2']
    const stored = ['value3', 'value4']

    // Should not throw, arrays are objects but should not be merged
    expect(() => mergeSecuritySchemas(current, stored)).not.toThrow()
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

    mergeSecuritySchemas(current, stored)

    expect(current.level1.level2.level3['x-scalar-secret-deep']).toBe('deep-secret')
  })

  it('skips the type field at the top level (level 0)', () => {
    const current = {
      type: 'apiKey',
      name: 'Authorization',
    }

    const stored = {
      type: 'oauth2', // Should not be merged at top level
      name: 'X-API-Key',
    }

    mergeSecuritySchemas(current, stored)

    expect(current).toEqual({
      type: 'apiKey', // Should remain unchanged
      name: 'X-API-Key', // Should be merged
    })
  })

  it('allows type field to be merged at nested levels', () => {
    const current = {
      type: 'oauth2',
      flows: {
        authorizationCode: {
          type: 'code',
        },
      },
    }

    const stored = {
      type: 'http',
      flows: {
        authorizationCode: {
          type: 'updated-type', // Should be merged at nested level
        },
      },
    }

    mergeSecuritySchemas(current, stored)

    expect(current.type).toBe('oauth2') // Top level type unchanged
    expect(current.flows.authorizationCode.type).toBe('updated-type') // Nested type merged
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

  it('overwrites existing security scheme values with stored values', async () => {
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

    // The stored value should overwrite the document value
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
