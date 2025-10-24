import { describe, expect, it } from 'vitest'

import { useSearchIndex } from './useSearchIndex'

describe('useSearchIndex', () => {
  it('initializes with empty search state and watches for items changes', () => {
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
})
