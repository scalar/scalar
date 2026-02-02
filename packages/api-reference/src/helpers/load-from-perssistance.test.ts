import { createWorkspaceStore } from '@scalar/workspace-store/client'
import type { Auth } from '@scalar/workspace-store/entities/auth'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { loadAuthFromStorage, loadClientFromStorage } from '@/helpers/load-from-perssistance'
import { authStorage, clientStorage } from '@/helpers/storage'

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

describe('loadAuthFromStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads auth from storage for the given slug', () => {
    const store = createWorkspaceStore()
    const slug = 'test-api'

    const authData: Auth = {
      secrets: {
        'apiKeyAuth': {
          type: 'apiKey',
          'x-scalar-secret-token': 'test-token-123',
        },
      },
      selected: {
        document: {
          selectedIndex: 0,
          selectedSchemes: [{ 'apiKeyAuth': [] }],
        },
        path: {
          '/users/{userId}': {
            'get': {
              selectedIndex: 0,
              selectedSchemes: [{ 'apiKeyAuth': [] }],
            },
          },
        },
      },
    }

    authStorage().setAuth(slug, authData)

    loadAuthFromStorage(store, slug)

    const secrets = store.auth.getAuthSecrets(slug, 'apiKeyAuth')

    expect(secrets).toEqual({
      type: 'apiKey',
      'x-scalar-secret-token': 'test-token-123',
    })

    const selectedSchemesDocument = store.auth.getAuthSelectedSchemas({ type: 'document', documentName: slug })

    expect(selectedSchemesDocument).toEqual({
      selectedIndex: 0,
      selectedSchemes: [{ 'apiKeyAuth': [] }],
    })

    const selectedSchemesPath = store.auth.getAuthSelectedSchemas({
      type: 'operation',
      documentName: slug,
      path: '/users/{userId}',
      method: 'get',
    })

    expect(selectedSchemesPath).toEqual({
      selectedIndex: 0,
      selectedSchemes: [{ 'apiKeyAuth': [] }],
    })
  })

  it('handles empty auth data from storage', () => {
    const store = createWorkspaceStore()
    const slug = 'empty-api'

    loadAuthFromStorage(store, slug)

    const loadedAuth = store.auth.export()[slug]
    expect(loadedAuth).toEqual({
      secrets: {},
      selected: {
        document: undefined,
        path: undefined,
      },
    })
  })

  it('loads different auth data for different slugs', () => {
    const store = createWorkspaceStore()
    const slug1 = 'api-one'
    const slug2 = 'api-two'

    authStorage().setAuth(slug1, {
      secrets: {
        'apiKeyAuth': {
          type: 'apiKey',
          'x-scalar-secret-token': 'test-token-123',
        },
      },
      selected: {
        document: {
          selectedIndex: 0,
          selectedSchemes: [{ 'apiKeyAuth': [] }],
        },
        path: {
          '/users/{userId}': {
            'get': {
              selectedIndex: 0,
              selectedSchemes: [{ 'apiKeyAuth': [] }],
            },
          },
        },
      },
    })
    authStorage().setAuth(slug2, {
      secrets: {
        'apiKeyAuth': {
          type: 'apiKey',
          'x-scalar-secret-token': 'test-token-456',
        },
      },
      selected: {
        document: undefined,
        path: undefined,
      },
    })

    loadAuthFromStorage(store, slug1)
    loadAuthFromStorage(store, slug2)

    const auth = store.auth.export()

    expect(auth[slug1]).toEqual({
      secrets: {
        'apiKeyAuth': {
          type: 'apiKey',
          'x-scalar-secret-token': 'test-token-123',
        },
      },
      selected: {
        document: {
          selectedIndex: 0,
          selectedSchemes: [{ 'apiKeyAuth': [] }],
        },
        path: {
          '/users/{userId}': {
            'get': {
              selectedIndex: 0,
              selectedSchemes: [{ 'apiKeyAuth': [] }],
            },
          },
        },
      },
    })

    expect(auth[slug2]).toEqual({
      secrets: {
        'apiKeyAuth': {
          type: 'apiKey',
          'x-scalar-secret-token': 'test-token-456',
        },
      },
      selected: {
        document: undefined,
        path: undefined,
      },
    })
  })
})
