import { CLIENT_LS_KEYS } from '@scalar/helpers/object/local-storage'
import { securitySchemeSchema } from '@scalar/types/entities'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import type { WorkspaceStore } from '@/store/store'
import { updateScheme } from './update-scheme'

describe('updateScheme', () => {
  // Mock localStorage
  const mockLocalStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
  }

  // Mock store
  const mockSecuritySchemeMutators = {
    edit: vi.fn(),
  }

  const scheme1 = securitySchemeSchema.parse({
    uid: 'scheme-1',
    nameKey: 'apiKey',
    type: 'apiKey',
    in: 'header',
    name: 'X-API-Key',
  })

  const scheme2 = securitySchemeSchema.parse({
    uid: 'scheme-2',
    nameKey: 'bearer',
    type: 'http',
    scheme: 'bearer',
  })

  const mockStore = {
    securitySchemeMutators: mockSecuritySchemeMutators,
    securitySchemes: {
      [scheme1.uid]: scheme1,
      [scheme2.uid]: scheme2,
    },
  } as unknown as WorkspaceStore

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks()
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should update security scheme in store without persisting to localStorage', () => {
    const uid = scheme1.uid
    const path = 'name'
    const value = 'New-API-Key'

    updateScheme(uid, path, value, mockStore)

    expect(mockSecuritySchemeMutators.edit).toHaveBeenCalledWith(uid, path, value)
    expect(mockLocalStorage.setItem).not.toHaveBeenCalled()
  })

  it('should update security scheme and persist to localStorage when persistAuth is true', () => {
    const uid = scheme1.uid
    const path = 'name'
    const value = 'New-API-Key'
    const existingAuth = {
      apiKey: {
        name: 'Old-API-Key',
      },
    }

    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingAuth))

    updateScheme(uid, path, value, mockStore, true)

    expect(mockSecuritySchemeMutators.edit).toHaveBeenCalledWith(uid, path, value)
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      CLIENT_LS_KEYS.AUTH,
      JSON.stringify({
        apiKey: {
          name: 'New-API-Key',
        },
      }),
    )
  })

  it('should create new auth entry in localStorage if none exists', () => {
    const uid = scheme1.uid
    const path = 'name'
    const value = 'New-API-Key'

    mockLocalStorage.getItem.mockReturnValue('{}')

    updateScheme(uid, path, value, mockStore, true)

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      CLIENT_LS_KEYS.AUTH,
      JSON.stringify({
        apiKey: {
          name: 'New-API-Key',
        },
      }),
    )
  })

  it('should handle different types of security schemes', () => {
    const uid = scheme2.uid
    const path = 'scheme'
    const value = 'basic'

    mockLocalStorage.getItem.mockReturnValue('{}')

    updateScheme(uid, path, value, mockStore, true)

    expect(mockSecuritySchemeMutators.edit).toHaveBeenCalledWith(uid, path, value)
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      CLIENT_LS_KEYS.AUTH,
      JSON.stringify({
        bearer: {
          scheme: 'basic',
        },
      }),
    )
  })

  it('should handle missing nameKey in security scheme', () => {
    const uid = scheme1.uid
    const path = 'name'
    const value = 'New-API-Key'
    const storeWithMissingNameKey = {
      ...mockStore,
      securitySchemes: {
        [scheme1.uid]: {
          ...scheme1,
          nameKey: undefined,
        },
      },
    } as unknown as WorkspaceStore

    updateScheme(uid, path, value, storeWithMissingNameKey, true)

    expect(mockSecuritySchemeMutators.edit).toHaveBeenCalledWith(uid, path, value)
    expect(mockLocalStorage.setItem).not.toHaveBeenCalled()
  })

  it('should handle invalid JSON in localStorage', () => {
    const uid = scheme1.uid
    const path = 'name'
    const value = 'New-API-Key'

    mockLocalStorage.getItem.mockReturnValue('invalid-json')

    updateScheme(uid, path, value, mockStore, true)

    expect(mockSecuritySchemeMutators.edit).toHaveBeenCalledOnce()
    expect(mockLocalStorage.setItem).not.toHaveBeenCalled()
  })

  it('should preserve existing auth data for other schemes', () => {
    const uid = scheme1.uid
    const path = 'name'
    const value = 'New-API-Key'
    const existingAuth = {
      apiKey: {
        name: 'Old-API-Key',
      },
      bearer: {
        scheme: 'bearer',
      },
    }

    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingAuth))

    updateScheme(uid, path, value, mockStore, true)

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      CLIENT_LS_KEYS.AUTH,
      JSON.stringify({
        apiKey: {
          name: 'New-API-Key',
        },
        bearer: {
          scheme: 'bearer',
        },
      }),
    )
  })
})
