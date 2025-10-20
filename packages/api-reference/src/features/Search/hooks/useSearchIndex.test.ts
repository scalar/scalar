import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'
import { describe, expect, it } from 'vitest'
import { computed } from 'vue'

import { useSearchIndex } from './useSearchIndex'

describe('useSearchIndex', () => {
  it('initializes with empty search state and watches for items changes', () => {
    const mockEntries: TraversedEntry[] = [
      {
        type: 'operation',
        ref: 'testOperation',
        id: 'test-operation',
        title: 'Test Operation',
        method: 'get',
        path: '/test',
      },
    ]

    const mockItems = computed(() => mockEntries)

    const { query, selectedIndex, searchResultsWithPlaceholderResults, resetSearch } = useSearchIndex(mockItems, {
      paths: {
        '/test': {
          get: {
            operationId: 'test-operation',
          },
        },
      },
    } as any)

    // Initial state should be empty
    expect(query.value).toBe('')
    expect(selectedIndex.value).toBeUndefined()
    expect(searchResultsWithPlaceholderResults.value).toMatchObject([
      {
        item: {
          href: '#test-operation',
          id: 'test-operation',
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
