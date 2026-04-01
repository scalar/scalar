import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { useSearchIndex } from './useSearchIndex'

describe('useSearchIndex', () => {
  it('initializes with empty search state and watches for items changes', async () => {
    const { query, results } = useSearchIndex({
      'x-scalar-navigation': {
        children: [
          {
            type: 'operation',
            id: 'scalar-test/test-operation',
            title: 'Test Operation',
            method: 'get',
            path: '/test',
          },
        ],
      },
    } as any)

    await vi.waitFor(() => {
      expect(results.value).toHaveLength(1)
    })

    // Initial state should be empty
    expect(query.value).toBe('')
    expect(results.value).toMatchObject([
      {
        item: {
          id: 'scalar-test/test-operation',
          method: 'get',
          path: '/test',
          title: 'Test Operation',
          type: 'operation',
        },
      },
    ])
  })

  it('loads search index only after being enabled', async () => {
    const enabled = ref(false)

    const { results } = useSearchIndex(
      {
        'x-scalar-navigation': {
          children: [
            {
              type: 'operation',
              id: 'scalar-test/test-operation',
              title: 'Test Operation',
              method: 'get',
              path: '/test',
            },
          ],
        },
      } as any,
      enabled,
    )

    expect(results.value).toEqual([])

    enabled.value = true

    await vi.waitFor(() => {
      expect(results.value).toHaveLength(1)
    })
  })
})
