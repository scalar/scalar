import { describe, it, expect } from 'vitest'
import type { TraversedEntry } from '@/features/traverse-schema/types'
import { getCurrentIndex } from './get-current-index'

// Mock data for testing
const createMockEntries = (): TraversedEntry[] => [
  {
    id: 'tag-pets',
    title: 'Pets',
    children: [],
    tag: {} as any,
    isGroup: true,
  },
  {
    id: 'operation-get-pets',
    title: 'Get Pets',
    method: 'get',
    path: '/pets',
    operation: {} as any,
  },
  {
    id: 'operation-post-pets',
    title: 'Create Pet',
    method: 'post',
    path: '/pets',
    operation: {} as any,
  },
  {
    id: 'models',
    title: 'Models',
    name: 'Models',
    schema: {} as any,
  },
  {
    id: 'tag-users',
    title: 'Users',
    children: [],
    tag: {} as any,
    isGroup: true,
  },
]

describe('getCurrentIndex', () => {
  const entries = createMockEntries()

  describe('when hash starts with "model"', () => {
    it('should return index of models section', () => {
      const result = getCurrentIndex('model-pet', entries)
      expect(result).toBe(3) // Index of the model entry
    })

    it('should handle model hash with additional segments', () => {
      const result = getCurrentIndex('model-pet.schema', entries)
      expect(result).toBe(3) // Should still find the model entry
    })

    it('should handle model hash with different model names', () => {
      const result = getCurrentIndex('model-user', entries)
      expect(result).toBe(3) // Should find the model entry even with different name
    })
  })

  describe('when hash contains parameter links', () => {
    it('should handle query parameter links', () => {
      const result = getCurrentIndex('operation-get-pets.query.limit', entries)
      expect(result).toBe(1) // Should find the operation entry
    })

    it('should handle path parameter links', () => {
      const result = getCurrentIndex('operation-post-pets.path.id', entries)
      expect(result).toBe(2) // Should find the operation entry
    })

    it('should handle headers parameter links', () => {
      const result = getCurrentIndex('operation-get-pets.headers.authorization', entries)
      expect(result).toBe(1) // Should find the operation entry
    })

    it('should handle cookies parameter links', () => {
      const result = getCurrentIndex('operation-post-pets.cookies.session', entries)
      expect(result).toBe(2) // Should find the operation entry
    })

    it('should handle body parameter links', () => {
      const result = getCurrentIndex('operation-post-pets.body', entries)
      expect(result).toBe(2) // Should find the operation entry
    })
  })

  describe('when hash is for tag entries', () => {
    it('should find tag entries using startsWith matching', () => {
      const result = getCurrentIndex('tag-pets', entries)
      expect(result).toBe(0) // Should find the pets tag
    })

    it('should find tag entries with additional segments', () => {
      const result = getCurrentIndex('tag-pets.operations', entries)
      expect(result).toBe(0) // Should find the pets tag using startsWith
    })

    it('should find different tag entries', () => {
      const result = getCurrentIndex('tag-users', entries)
      expect(result).toBe(4) // Should find the users tag
    })
  })

  describe('when hash is for operation entries', () => {
    it('should find operation entries with exact match', () => {
      const result = getCurrentIndex('operation-get-pets', entries)
      expect(result).toBe(1) // Should find the GET pets operation
    })

    it('should find different operation entries', () => {
      const result = getCurrentIndex('operation-post-pets', entries)
      expect(result).toBe(2) // Should find the POST pets operation
    })
  })

  describe('edge cases', () => {
    it('should return -1 for non-existent hash', () => {
      const result = getCurrentIndex('non-existent', entries)
      expect(result).toBe(-1)
    })

    it('should return -1 for empty hash', () => {
      const result = getCurrentIndex('', entries)
      expect(result).toBe(-1)
    })

    it('should handle empty entries array', () => {
      const result = getCurrentIndex('operation-get-pets', [])
      expect(result).toBe(-1)
    })

    it('should handle hash with multiple dots', () => {
      const result = getCurrentIndex('operation-get-pets.query.limit.page', entries)
      expect(result).toBe(1) // Should still find the operation
    })

    it('should handle hash with special characters', () => {
      const result = getCurrentIndex('operation-get-pets.query.limit[0]', entries)
      expect(result).toBe(1) // Should still find the operation
    })
  })

  describe('when hash matches multiple entries', () => {
    it('should return the first matching entry', () => {
      // Add a duplicate entry to test this scenario
      const entriesWithDuplicate = [
        ...entries,
        {
          id: 'operation-get-pets',
          title: 'Get Pets Duplicate',
          method: 'get',
          path: '/pets',
          operation: {} as any,
        },
      ]

      const result = getCurrentIndex('operation-get-pets', entriesWithDuplicate)
      expect(result).toBe(1) // Should return the first match
    })
  })

  describe('case sensitivity', () => {
    it('should be case sensitive for exact matches', () => {
      const result = getCurrentIndex('OPERATION-GET-PETS', entries)
      expect(result).toBe(-1) // Should not find due to case mismatch
    })

    it('should be case sensitive for tag matches', () => {
      const result = getCurrentIndex('TAG-PETS', entries)
      expect(result).toBe(-1) // Should not find due to case mismatch
    })
  })
})

// Test the regex pattern separately
describe('isParameterLinkRegex', () => {
  it('should match query parameters', () => {
    const hash = 'operation-get-pets.query.limit'
    const matches = hash.match(/^.*?(?=\.query|\.path|\.headers|\.cookies|\.body)/)
    expect(matches?.[0]).toBe('operation-get-pets')
  })

  it('should match path parameters', () => {
    const hash = 'operation-post-pets.path.id'
    const matches = hash.match(/^.*?(?=\.query|\.path|\.headers|\.cookies|\.body)/)
    expect(matches?.[0]).toBe('operation-post-pets')
  })

  it('should match headers parameters', () => {
    const hash = 'operation-get-pets.headers.authorization'
    const matches = hash.match(/^.*?(?=\.query|\.path|\.headers|\.cookies|\.body)/)
    expect(matches?.[0]).toBe('operation-get-pets')
  })

  it('should match cookies parameters', () => {
    const hash = 'operation-post-pets.cookies.session'
    const matches = hash.match(/^.*?(?=\.query|\.path|\.headers|\.cookies|\.body)/)
    expect(matches?.[0]).toBe('operation-post-pets')
  })

  it('should match body parameters', () => {
    const hash = 'operation-post-pets.body'
    const matches = hash.match(/^.*?(?=\.query|\.path|\.headers|\.cookies|\.body)/)
    expect(matches?.[0]).toBe('operation-post-pets')
  })

  it('should not match hashes without parameter suffixes', () => {
    const hash = 'operation-get-pets'
    const matches = hash.match(/^.*?(?=\.query|\.path|\.headers|\.cookies|\.body)/)
    expect(matches).toBeNull()
  })

  it('should handle multiple parameter types in same hash', () => {
    const hash = 'operation-get-pets.query.limit.path.id'
    const matches = hash.match(/^.*?(?=\.query|\.path|\.headers|\.cookies|\.body)/)
    expect(matches?.[0]).toBe('operation-get-pets')
  })
})

// Test the bug in getCurrentIndex - it should return the result of findIndex
describe('getCurrentIndex bug fix', () => {
  it('should return the correct index instead of undefined', () => {
    const entries = createMockEntries()
    const result = getCurrentIndex('operation-get-pets', entries)

    // The current implementation doesn't return the findIndex result
    // This test documents the expected behavior
    expect(result).toBe(1)
  })
})
