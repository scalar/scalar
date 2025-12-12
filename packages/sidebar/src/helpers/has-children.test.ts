import { describe, expect, it } from 'vitest'

import { hasChildren } from '@/helpers/has-children'
import type { Item } from '@/types'

describe('hasChildren', () => {
  it('should return true if the item has children', () => {
    const item = {
      id: '1',
      type: 'tag',
      title: 'Item 1',
      name: 'Item 1',
      isGroup: false,
      children: [{ id: '2', type: 'operation', title: 'Item 2', ref: 'ref-1', method: 'get', path: '/path' }],
    } satisfies Item

    expect(hasChildren(item)).toBe(true)
  })

  it('should return false if the item does not have children', () => {
    const item = {
      id: '1',
      type: 'tag',
      title: 'Item 1',
      name: 'Item 1',
      isGroup: false,
      children: [],
    } satisfies Item

    expect(hasChildren(item)).toBe(false)
  })

  it('should return false if the item has no children property at all', () => {
    const item = {
      id: '1',
      type: 'tag',
      title: 'Item 1',
      name: 'Item 1',
      isGroup: false,
    } satisfies Item

    expect(hasChildren(item)).toBe(false)
  })
})
