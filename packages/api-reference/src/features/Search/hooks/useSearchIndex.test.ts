import type { TraversedEntry } from '@/features/traverse-schema'
import { describe, expect, it } from 'vitest'
import { computed } from 'vue'
import { useSearchIndex } from './useSearchIndex'

describe('useSearchIndex', () => {
  it('initializes with empty search state and watches for items changes', () => {
    const mockEntries: TraversedEntry[] = [
      {
        id: 'test-operation',
        title: 'Test Operation',
        method: 'get',
        path: '/test',
        operation: {
          operationId: 'testOperation',
          description: 'A test operation',
        },
      },
    ]

    const mockItems = computed(() => ({
      entries: mockEntries,
      titles: new Map(),
    }))

    const { query, selectedIndex, searchResultsWithPlaceholderResults, resetSearch } = useSearchIndex(mockItems)

    // Initial state should be empty
    expect(query.value).toBe('')
    expect(selectedIndex.value).toBeUndefined()
    expect(searchResultsWithPlaceholderResults.value).toMatchObject([
      {
        item: {
          href: '#test-operation',
          id: 'testOperation',
          method: 'get',
          path: '/test',
          title: 'Test Operation',
          type: 'operation',
        },
      },
    ])

    // Test resetSearch function
    resetSearch()
    expect(query.value).toBe('')
    expect(selectedIndex.value).toBeUndefined()
  })
})
