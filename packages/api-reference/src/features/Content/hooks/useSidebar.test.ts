import type { Collection } from '@scalar/store'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, inject, provide } from 'vue'
import { type SortOptions, createSidebar } from '../helpers/create-sidebar'
import { SIDEBAR_SYMBOL, useSidebar } from './useSidebar'

// Mock Vue's provide and inject
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    provide: vi.fn(),
    inject: vi.fn(),
  }
})

// Mock the createSidebar function
vi.mock('../helpers/create-sidebar', () => ({
  createSidebar: vi.fn(),
}))

describe('useSidebar', () => {
  // Reset mocks before each test
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('when called with a collection', () => {
    it('creates and provides a new sidebar instance', () => {
      // Arrange
      const mockCollection = {} as Collection
      const mockSortOptions = { tagSort: 'alpha', operationSort: 'alpha' } as SortOptions
      const mockSidebar = {
        items: computed(() => ({
          entries: [],
          titles: {},
        })),
      }
      vi.mocked(createSidebar).mockReturnValue(mockSidebar)

      // Act
      const result = useSidebar(mockCollection, mockSortOptions)

      // Assert
      expect(createSidebar).toHaveBeenCalledWith({
        collection: mockCollection,
        ...mockSortOptions,
      })
      expect(provide).toHaveBeenCalledWith(SIDEBAR_SYMBOL, mockSidebar)
      expect(result).toBe(mockSidebar)
    })
  })

  describe('when called without a collection', () => {
    it('injects an existing sidebar instance', () => {
      // Arrange
      const mockSidebar = {
        items: computed(() => ({
          entries: [],
          titles: {},
        })),
      }
      vi.mocked(inject).mockReturnValue(mockSidebar)

      // Act
      const result = useSidebar()

      // Assert
      expect(inject).toHaveBeenCalledWith(SIDEBAR_SYMBOL)
      expect(result).toBe(mockSidebar)
    })

    it('throws an error when no sidebar instance is found', () => {
      // Arrange
      vi.mocked(inject).mockReturnValue(undefined)

      // Act & Assert
      expect(() => useSidebar()).toThrow(
        'useSidebar() was called without a collection and no sidebar instance was found. ' +
          'Make sure to call useSidebar(collection) in a parent component first.',
      )
    })
  })
})
