import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, inject, provide } from 'vue'
import { createSidebar } from '../helpers/create-sidebar'
import { SIDEBAR_SYMBOL, useSidebar } from './useSidebar'

const EXAMPLE_DOCUMENT = {
  openapi: '3.1.1',
  info: {
    title: 'Example',
    version: '1.0',
  },
  paths: {
    '/hello': {
      get: {
        summary: 'Hello World',
      },
    },
  },
} as OpenAPIV3_1.Document

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
      const mockSidebar = {
        items: computed(() => ({
          entries: [],
          titles: {},
        })),
      }
      vi.mocked(createSidebar).mockReturnValue(mockSidebar)

      // Act
      const result = useSidebar(EXAMPLE_DOCUMENT, { tagSort: 'alpha', operationSort: 'alpha' })

      // Assert
      expect(createSidebar).toHaveBeenCalledWith({
        content: EXAMPLE_DOCUMENT,
        tagSort: 'alpha',
        operationSort: 'alpha',
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
