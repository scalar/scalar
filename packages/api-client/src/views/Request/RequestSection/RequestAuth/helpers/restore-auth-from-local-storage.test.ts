import { CLIENT_LS_KEYS } from '@scalar/helpers/object/local-storage'
import type { Collection, SecurityScheme } from '@scalar/oas-utils/entities/spec'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { WorkspaceStore } from '@/store/store'

import { restoreAuthFromLocalStorage } from './restore-auth-from-local-storage'

vi.mock('@scalar/helpers/object/local-storage', async () => {
  const actual = await vi.importActual('@scalar/helpers/object/local-storage')
  return {
    ...actual,
    safeLocalStorage: vi.fn(),
  }
})

describe('restoreAuthFromLocalStorage', () => {
  let mockStore: WorkspaceStore
  let mockLocalStorage: {
    getItem: ReturnType<typeof vi.fn>
    setItem: ReturnType<typeof vi.fn>
    removeItem: ReturnType<typeof vi.fn>
  }
  const collectionUid = 'test-collection-uid' as Collection['uid']

  beforeEach(async () => {
    // Setup mock localStorage
    mockLocalStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    }

    // Mock safeLocalStorage to return our mock
    const { safeLocalStorage } = await import('@scalar/helpers/object/local-storage')
    vi.mocked(safeLocalStorage).mockReturnValue(mockLocalStorage)

    // Setup mock store
    mockStore = {
      collectionMutators: {
        edit: vi.fn(),
      },
      securitySchemes: {},
      securitySchemeMutators: {
        edit: vi.fn(),
      },
    } as unknown as WorkspaceStore

    // Clear console.error mock
    vi.spyOn(console, 'error').mockImplementation(() => {
      // Suppress console.error output during tests
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('successful restoration', () => {
    it('should restore auth data from local storage successfully', () => {
      // Arrange
      const mockSecurityScheme: SecurityScheme = {
        uid: 'scheme-uid-1',
        nameKey: 'apiKey',
      } as SecurityScheme

      mockStore.securitySchemes = {
        'scheme-uid-1': mockSecurityScheme,
      }

      const mockAuthData = {
        apiKey: {
          'value': 'test-api-key',
          'name': 'X-API-Key',
        },
      }

      const mockSelectedSchemes = ['apiKey']

      mockLocalStorage.getItem
        .mockReturnValueOnce(JSON.stringify(mockAuthData)) // AUTH key
        .mockReturnValueOnce(JSON.stringify(mockSelectedSchemes)) // SELECTED_SECURITY_SCHEMES key

      // Act
      restoreAuthFromLocalStorage(mockStore, collectionUid)

      // Assert
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(CLIENT_LS_KEYS.AUTH)
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(CLIENT_LS_KEYS.SELECTED_SECURITY_SCHEMES)
      expect(mockStore.securitySchemeMutators.edit).toHaveBeenCalledWith('scheme-uid-1', 'value', 'test-api-key')
      expect(mockStore.securitySchemeMutators.edit).toHaveBeenCalledWith('scheme-uid-1', 'name', 'X-API-Key')
      expect(mockStore.collectionMutators.edit).toHaveBeenCalledWith(collectionUid, 'selectedSecuritySchemeUids', [
        'scheme-uid-1',
      ])
    })

    it('should handle multiple security schemes', () => {
      // Arrange
      const mockSecuritySchemes = {
        'scheme-uid-1': { uid: 'scheme-uid-1', nameKey: 'apiKey' } as SecurityScheme,
        'scheme-uid-2': { uid: 'scheme-uid-2', nameKey: 'bearerAuth' } as SecurityScheme,
      }

      mockStore.securitySchemes = mockSecuritySchemes

      const mockAuthData = {
        apiKey: {
          'value': 'test-api-key',
        },
        bearerAuth: {
          'token': 'bearer-token',
        },
      }

      const mockSelectedSchemes = ['apiKey', 'bearerAuth']

      mockLocalStorage.getItem
        .mockReturnValueOnce(JSON.stringify(mockAuthData))
        .mockReturnValueOnce(JSON.stringify(mockSelectedSchemes))

      // Act
      restoreAuthFromLocalStorage(mockStore, collectionUid)

      // Assert
      expect(mockStore.securitySchemeMutators.edit).toHaveBeenCalledWith('scheme-uid-1', 'value', 'test-api-key')
      expect(mockStore.securitySchemeMutators.edit).toHaveBeenCalledWith('scheme-uid-2', 'token', 'bearer-token')
      expect(mockStore.collectionMutators.edit).toHaveBeenCalledWith(collectionUid, 'selectedSecuritySchemeUids', [
        'scheme-uid-1',
        'scheme-uid-2',
      ])
    })

    it('should handle array of selected scheme UIDs', () => {
      // Arrange
      const mockSecuritySchemes = {
        'scheme-uid-1': { uid: 'scheme-uid-1', nameKey: 'oauth1' } as SecurityScheme,
        'scheme-uid-2': { uid: 'scheme-uid-2', nameKey: 'oauth2' } as SecurityScheme,
      }

      mockStore.securitySchemes = mockSecuritySchemes

      const mockAuthData = {}
      const mockSelectedSchemes = [['oauth1', 'oauth2']]

      mockLocalStorage.getItem
        .mockReturnValueOnce(JSON.stringify(mockAuthData))
        .mockReturnValueOnce(JSON.stringify(mockSelectedSchemes))

      // Act
      restoreAuthFromLocalStorage(mockStore, collectionUid)

      // Assert
      expect(mockStore.collectionMutators.edit).toHaveBeenCalledWith(collectionUid, 'selectedSecuritySchemeUids', [
        ['scheme-uid-1', 'scheme-uid-2'],
      ])
    })

    it('should filter out undefined values when mapping name keys to UIDs', () => {
      // Arrange
      const mockSecuritySchemes = {
        'scheme-uid-1': { uid: 'scheme-uid-1', nameKey: 'apiKey' } as SecurityScheme,
      }

      mockStore.securitySchemes = mockSecuritySchemes

      const mockAuthData = {
        apiKey: { 'value': 'test-key' },
        unknownKey: { 'value': 'unknown-value' }, // This should be ignored
      }

      const mockSelectedSchemes = ['apiKey', 'unknownKey'] // unknownKey should be filtered out

      mockLocalStorage.getItem
        .mockReturnValueOnce(JSON.stringify(mockAuthData))
        .mockReturnValueOnce(JSON.stringify(mockSelectedSchemes))

      // Act
      restoreAuthFromLocalStorage(mockStore, collectionUid)

      // Assert
      expect(mockStore.securitySchemeMutators.edit).toHaveBeenCalledWith('scheme-uid-1', 'value', 'test-key')
      expect(mockStore.securitySchemeMutators.edit).toHaveBeenCalledTimes(1) // Only called once for the valid scheme
      expect(mockStore.collectionMutators.edit).toHaveBeenCalledWith(collectionUid, 'selectedSecuritySchemeUids', [
        'scheme-uid-1',
      ])
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle empty local storage gracefully', () => {
      // Arrange
      mockLocalStorage.getItem
        .mockReturnValueOnce(null) // AUTH key returns null
        .mockReturnValueOnce(null) // SELECTED_SECURITY_SCHEMES key returns null

      // Act
      restoreAuthFromLocalStorage(mockStore, collectionUid)

      // Assert - should not throw and should handle empty state properly
      // When localStorage returns null, the fallback is '{}' for AUTH and '[]' for SELECTED_SECURITY_SCHEMES
      // This results in empty auth data and empty selected scheme UIDs
      expect(mockStore.securitySchemeMutators.edit).not.toHaveBeenCalled()
      expect(mockStore.collectionMutators.edit).toHaveBeenCalledWith(collectionUid, 'selectedSecuritySchemeUids', [])
      expect(console.error).not.toHaveBeenCalled()
    })

    it('should handle invalid JSON in local storage', () => {
      // Arrange
      mockLocalStorage.getItem
        .mockReturnValueOnce('invalid-json') // Invalid JSON for AUTH
        .mockReturnValueOnce('[]') // Valid JSON for SELECTED_SECURITY_SCHEMES

      // Act
      restoreAuthFromLocalStorage(mockStore, collectionUid)

      // Assert
      expect(console.error).toHaveBeenCalled()
      expect(mockStore.securitySchemeMutators.edit).not.toHaveBeenCalled()
    })

    it('should handle empty security schemes object', () => {
      // Arrange
      mockStore.securitySchemes = {}

      const mockAuthData = {
        apiKey: { 'value': 'test-key' },
      }

      const mockSelectedSchemes = ['apiKey']

      mockLocalStorage.getItem
        .mockReturnValueOnce(JSON.stringify(mockAuthData))
        .mockReturnValueOnce(JSON.stringify(mockSelectedSchemes))

      // Act
      restoreAuthFromLocalStorage(mockStore, collectionUid)

      // Assert
      expect(mockStore.securitySchemeMutators.edit).not.toHaveBeenCalled()
      expect(mockStore.collectionMutators.edit).toHaveBeenCalledWith(collectionUid, 'selectedSecuritySchemeUids', [])
    })

    it('should handle security schemes without nameKey', () => {
      // Arrange
      const mockSecuritySchemes = {
        'scheme-uid-1': { uid: 'scheme-uid-1' } as SecurityScheme, // Missing nameKey
      }

      mockStore.securitySchemes = mockSecuritySchemes

      const mockAuthData = {
        apiKey: { 'value': 'test-key' },
      }

      const mockSelectedSchemes = ['apiKey']

      mockLocalStorage.getItem
        .mockReturnValueOnce(JSON.stringify(mockAuthData))
        .mockReturnValueOnce(JSON.stringify(mockSelectedSchemes))

      // Act
      restoreAuthFromLocalStorage(mockStore, collectionUid)

      // Assert
      expect(mockStore.securitySchemeMutators.edit).not.toHaveBeenCalled()
      expect(mockStore.collectionMutators.edit).toHaveBeenCalledWith(collectionUid, 'selectedSecuritySchemeUids', [])
    })

    it('should handle mixed array and string selected schemes', () => {
      // Arrange
      const mockSecuritySchemes = {
        'scheme-uid-1': { uid: 'scheme-uid-1', nameKey: 'apiKey' } as SecurityScheme,
        'scheme-uid-2': { uid: 'scheme-uid-2', nameKey: 'bearerAuth' } as SecurityScheme,
        'scheme-uid-3': { uid: 'scheme-uid-3', nameKey: 'oauth1' } as SecurityScheme,
        'scheme-uid-4': { uid: 'scheme-uid-4', nameKey: 'oauth2' } as SecurityScheme,
      }

      mockStore.securitySchemes = mockSecuritySchemes

      const mockAuthData = {}
      const mockSelectedSchemes = ['apiKey', ['oauth1', 'oauth2'], 'bearerAuth']

      mockLocalStorage.getItem
        .mockReturnValueOnce(JSON.stringify(mockAuthData))
        .mockReturnValueOnce(JSON.stringify(mockSelectedSchemes))

      // Act
      restoreAuthFromLocalStorage(mockStore, collectionUid)

      // Assert
      expect(mockStore.collectionMutators.edit).toHaveBeenCalledWith(collectionUid, 'selectedSecuritySchemeUids', [
        'scheme-uid-1',
        ['scheme-uid-3', 'scheme-uid-4'],
        'scheme-uid-2',
      ])
    })

    it('should handle empty string for selected security schemes', () => {
      // Arrange
      mockStore.securitySchemes = {
        'scheme-uid-1': { uid: 'scheme-uid-1', nameKey: 'apiKey' } as SecurityScheme,
      }

      const mockAuthData = {
        apiKey: { 'value': 'test-key' },
      }

      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(mockAuthData)).mockReturnValueOnce('') // Empty string for SELECTED_SECURITY_SCHEMES

      // Act
      restoreAuthFromLocalStorage(mockStore, collectionUid)

      // Assert
      // AUTH data is processed first successfully, then JSON.parse('') throws an error
      // This causes the function to exit early in the catch block before setting selected schemes
      expect(mockStore.securitySchemeMutators.edit).toHaveBeenCalledWith('scheme-uid-1', 'value', 'test-key')
      expect(mockStore.collectionMutators.edit).not.toHaveBeenCalled()
      expect(console.error).toHaveBeenCalled()
    })

    it('should handle null values in selected schemes array', () => {
      // Arrange
      const mockSecuritySchemes = {
        'scheme-uid-1': { uid: 'scheme-uid-1', nameKey: 'apiKey' } as SecurityScheme,
      }

      mockStore.securitySchemes = mockSecuritySchemes

      const mockAuthData = {}
      // Simulate a scenario where some selected schemes might be null/undefined
      const mockSelectedSchemes = ['apiKey', null, undefined, 'unknownKey']

      mockLocalStorage.getItem
        .mockReturnValueOnce(JSON.stringify(mockAuthData))
        .mockReturnValueOnce(JSON.stringify(mockSelectedSchemes))

      // Act
      restoreAuthFromLocalStorage(mockStore, collectionUid)

      // Assert
      expect(mockStore.collectionMutators.edit).toHaveBeenCalledWith(collectionUid, 'selectedSecuritySchemeUids', [
        'scheme-uid-1',
      ])
    })
  })

  describe('localStorage interaction', () => {
    it('should call localStorage.getItem with correct keys', () => {
      // Arrange
      mockLocalStorage.getItem.mockReturnValue(null)

      // Act
      restoreAuthFromLocalStorage(mockStore, collectionUid)

      // Assert
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(CLIENT_LS_KEYS.AUTH)
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(CLIENT_LS_KEYS.SELECTED_SECURITY_SCHEMES)
      expect(mockLocalStorage.getItem).toHaveBeenCalledTimes(2)
    })

    it('should handle localStorage throwing an error', () => {
      // Arrange
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('LocalStorage error')
      })

      // Act & Assert - should not throw
      expect(() => restoreAuthFromLocalStorage(mockStore, collectionUid)).not.toThrow()
      expect(console.error).toHaveBeenCalledWith(expect.any(Error))
    })
  })

  describe('store mutations', () => {
    it('should call securitySchemeMutators.edit for each auth entry', () => {
      // Arrange
      const mockSecurityScheme: SecurityScheme = {
        uid: 'scheme-uid-1',
        nameKey: 'apiKey',
      } as SecurityScheme

      mockStore.securitySchemes = {
        'scheme-uid-1': mockSecurityScheme,
      }

      const mockAuthData = {
        apiKey: {
          'value': 'test-value',
          'name': 'test-name',
          'in': 'header',
        },
      }

      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(mockAuthData)).mockReturnValueOnce('[]')

      // Act
      restoreAuthFromLocalStorage(mockStore, collectionUid)

      // Assert
      expect(mockStore.securitySchemeMutators.edit).toHaveBeenCalledWith('scheme-uid-1', 'value', 'test-value')
      expect(mockStore.securitySchemeMutators.edit).toHaveBeenCalledWith('scheme-uid-1', 'name', 'test-name')
      expect(mockStore.securitySchemeMutators.edit).toHaveBeenCalledWith('scheme-uid-1', 'in', 'header')
      expect(mockStore.securitySchemeMutators.edit).toHaveBeenCalledTimes(3)
    })

    it('should call collectionMutators.edit with correct parameters', () => {
      // Arrange
      const mockSecurityScheme: SecurityScheme = {
        uid: 'scheme-uid-1',
        nameKey: 'apiKey',
      } as SecurityScheme

      mockStore.securitySchemes = {
        'scheme-uid-1': mockSecurityScheme,
      }

      mockLocalStorage.getItem.mockReturnValueOnce('{}').mockReturnValueOnce(JSON.stringify(['apiKey']))

      // Act
      restoreAuthFromLocalStorage(mockStore, collectionUid)

      // Assert
      expect(mockStore.collectionMutators.edit).toHaveBeenCalledWith(collectionUid, 'selectedSecuritySchemeUids', [
        'scheme-uid-1',
      ])
      expect(mockStore.collectionMutators.edit).toHaveBeenCalledTimes(1)
    })
  })
})
