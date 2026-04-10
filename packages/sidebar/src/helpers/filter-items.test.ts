import { describe, expect, it } from 'vitest'

import type { Item } from '@/types'

import { filterItems } from './filter-items'

describe('filter-items', () => {
  it('returns all items for reference layout', () => {
    const items: Item[] = [
      { id: '0', title: 'Document', type: 'document', name: 'test-document' },
      { id: '1', title: 'Description', type: 'text' },
      { id: '2', title: 'Operation', type: 'operation', method: 'get', path: '/test', ref: '' },
      { id: '3', title: 'Schema', type: 'model', name: 'TestSchema', ref: '' },
      { id: '4', title: 'Tag', type: 'tag', name: 'test-tag', isGroup: false },
      { id: '5', title: 'Webhook', type: 'webhook', method: 'post', name: 'test-webhook', ref: '' },
      { id: '6', title: 'Example', type: 'example', name: 'example-1' },
    ]

    const result = filterItems('reference', items)

    expect(result).toEqual(items)
    expect(result).toHaveLength(7)
  })

  it('filters to only documents, operations, examples, and tags for client layout', () => {
    const items: Item[] = [
      { id: '0', title: 'Document', type: 'document', name: 'test-document' },
      { id: '1', title: 'Description', type: 'text' },
      { id: '2', title: 'Operation', type: 'operation', method: 'get', path: '/test', ref: '' },
      { id: '3', title: 'Schema', type: 'model', name: 'TestSchema', ref: '' },
      { id: '4', title: 'Tag', type: 'tag', name: 'test-tag', isGroup: false },
      { id: '5', title: 'Webhook', type: 'webhook', method: 'post', name: 'test-webhook', ref: '' },
      { id: '6', title: 'Example', type: 'example', name: 'example-1' },
    ]

    const result = filterItems('client', items)

    expect(result).toHaveLength(4)
    expect(result).toEqual([
      { id: '0', title: 'Document', type: 'document', name: 'test-document' },
      { id: '2', title: 'Operation', type: 'operation', method: 'get', path: '/test', ref: '' },
      { id: '4', title: 'Tag', type: 'tag', name: 'test-tag', isGroup: false },
      { id: '6', title: 'Example', type: 'example', name: 'example-1' },
    ])
  })

  it('returns empty array for client layout when no matching types exist', () => {
    const items: Item[] = [
      { id: '1', title: 'Description', type: 'text' },
      { id: '2', title: 'Schema', type: 'model', name: 'TestSchema', ref: '' },
      { id: '3', title: 'Webhook', type: 'webhook', method: 'post', name: 'test-webhook', ref: '' },
    ]

    const result = filterItems('client', items)

    expect(result).toEqual([])
  })

  it('returns empty array for empty items array', () => {
    expect(filterItems('reference', [])).toEqual([])
    expect(filterItems('client', [])).toEqual([])
  })

  it('keeps only operations when only operations exist for client layout', () => {
    const items: Item[] = [
      { id: '1', title: 'GET users', type: 'operation', method: 'get', path: '/users', ref: '' },
      { id: '2', title: 'POST users', type: 'operation', method: 'post', path: '/users', ref: '' },
    ]

    const result = filterItems('client', items)

    expect(result).toHaveLength(2)
    expect(result).toEqual(items)
  })

  it('keeps only tags when only tags exist for client layout', () => {
    const items: Item[] = [
      { id: '1', title: 'Users', type: 'tag', name: 'users', isGroup: false },
      { id: '2', title: 'Products', type: 'tag', name: 'products', isGroup: false },
    ]

    const result = filterItems('client', items)

    expect(result).toHaveLength(2)
    expect(result).toEqual(items)
  })

  it('keeps only examples when only examples exist for client layout', () => {
    const items: Item[] = [
      { id: '1', title: 'Example 1', type: 'example', name: 'ex-1' },
      { id: '2', title: 'Example 2', type: 'example', name: 'ex-2' },
    ]

    const result = filterItems('client', items)

    expect(result).toHaveLength(2)
    expect(result).toEqual(items)
  })

  it('preserves item order in filtered results', () => {
    const items: Item[] = [
      { id: '1', title: 'Tag 1', type: 'tag', name: 'tag-1', isGroup: false },
      { id: '2', title: 'Description', type: 'text' },
      { id: '3', title: 'Operation', type: 'operation', method: 'get', path: '/test', ref: '' },
      { id: '4', title: 'Schema', type: 'model', name: 'Schema', ref: '' },
      { id: '5', title: 'Example', type: 'example', name: 'ex-1' },
    ]

    const result = filterItems('client', items)

    expect(result.map((item) => item.id)).toEqual(['1', '3', '5'])
  })

  it('hides a single default example when hideOperationDefaultExamples is true', () => {
    const items: Item[] = [{ id: '1', title: 'Default', type: 'example', name: 'default' }]

    expect(filterItems('client', items, true)).toStrictEqual([])
    expect(filterItems('reference', items, true)).toStrictEqual([])
  })

  it('keeps a single default example when hideOperationDefaultExamples is false', () => {
    const items: Item[] = [{ id: '1', title: 'Default', type: 'example', name: 'default' }]

    expect(filterItems('client', items, false)).toStrictEqual(items)
    expect(filterItems('reference', items, false)).toStrictEqual(items)
  })

  it('keeps a single default example when hideOperationDefaultExamples is undefined', () => {
    const items: Item[] = [{ id: '1', title: 'Default', type: 'example', name: 'default' }]

    expect(filterItems('client', items)).toStrictEqual(items)
    expect(filterItems('reference', items)).toStrictEqual(items)
  })

  it('keeps multiple examples even when one is the default and hideOperationDefaultExamples is true', () => {
    const items: Item[] = [
      { id: '1', title: 'Default', type: 'example', name: 'default' },
      { id: '2', title: 'Custom', type: 'example', name: 'custom' },
    ]

    expect(filterItems('reference', items, true)).toStrictEqual(items)
    expect(filterItems('client', items, true)).toStrictEqual(items)
  })

  it('keeps a single non-default example when hideOperationDefaultExamples is true', () => {
    const items: Item[] = [{ id: '1', title: 'Custom', type: 'example', name: 'custom' }]

    expect(filterItems('reference', items, true)).toStrictEqual(items)
    expect(filterItems('client', items, true)).toStrictEqual(items)
  })

  it('keeps a single non-example item when hideOperationDefaultExamples is true', () => {
    const items: Item[] = [{ id: '1', title: 'GET /users', type: 'operation', method: 'get', path: '/users', ref: '' }]

    expect(filterItems('reference', items, true)).toStrictEqual(items)
  })
})
