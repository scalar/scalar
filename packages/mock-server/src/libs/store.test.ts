import { beforeEach, describe, expect, it } from 'vitest'

import { store } from './store'

describe('store', () => {
  beforeEach(() => {
    store.clear()
  })

  it('list returns empty array for non-existent collection', () => {
    const result = store.list('items')
    expect(result).toEqual([])
  })

  it('list returns all items in collection', () => {
    store.create('items', { id: '1', name: 'Item 1' })
    store.create('items', { id: '2', name: 'Item 2' })

    const result = store.list('items')
    expect(result).toHaveLength(2)
    expect(result.map((item) => item.name)).toContain('Item 1')
    expect(result.map((item) => item.name)).toContain('Item 2')
  })

  it('get returns undefined for non-existent item', () => {
    const result = store.get('items', 'non-existent')
    expect(result).toBeUndefined()
  })

  it('get returns undefined for non-existent collection', () => {
    const result = store.get('items', '1')
    expect(result).toBeUndefined()
  })

  it('get returns item by id', () => {
    const created = store.create('items', { id: '1', name: 'Item 1' })

    const result = store.get('items', '1')
    expect(result).toEqual(created)
    expect(result?.name).toBe('Item 1')
  })

  it('create with id uses provided id', () => {
    const result = store.create('items', { id: 'custom-id', name: 'Item' })

    expect(result.id).toBe('custom-id')
    expect(result.name).toBe('Item')
  })

  it('create without id auto-generates uuid', () => {
    const result = store.create('items', { name: 'Item' })

    expect(result).toHaveProperty('id')
    expect(typeof result.id).toBe('string')
    expect(result.id.length).toBeGreaterThan(0)
    expect(result.name).toBe('Item')
  })

  it('create adds item to collection', () => {
    store.create('items', { id: '1', name: 'Item 1' })

    const items = store.list('items')
    expect(items).toHaveLength(1)
    expect(items[0].name).toBe('Item 1')
  })

  it('create handles multiple collections independently', () => {
    store.create('items', { id: '1', name: 'Item 1' })
    store.create('users', { id: '1', name: 'User 1' })

    const items = store.list('items')
    const users = store.list('users')

    expect(items).toHaveLength(1)
    expect(users).toHaveLength(1)
    expect(items[0].name).toBe('Item 1')
    expect(users[0].name).toBe('User 1')
  })

  it('update modifies existing item', () => {
    const created = store.create('items', { id: '1', name: 'Original' })

    const updated = store.update('items', '1', { name: 'Updated' })

    expect(updated.id).toBe('1')
    expect(updated.name).toBe('Updated')
    expect(updated).not.toEqual(created)
  })

  it('update preserves id when updating', () => {
    store.create('items', { id: '1', name: 'Item' })

    const updated = store.update('items', '1', { name: 'Updated', id: 'should-be-ignored' })

    expect(updated.id).toBe('1')
    expect(updated.name).toBe('Updated')
  })

  it('update merges new data with existing item', () => {
    store.create('items', { id: '1', name: 'Item', count: 5 })

    const updated = store.update('items', '1', { count: 10 })

    expect(updated.name).toBe('Item')
    expect(updated.count).toBe(10)
  })

  it('update returns null for non-existent item', () => {
    const result = store.update('items', 'non-existent', { name: 'Updated' })
    expect(result).toBeNull()
  })

  it('update returns null for non-existent collection', () => {
    const result = store.update('items', '1', { name: 'Updated' })
    expect(result).toBeNull()
  })

  it('delete returns true for existing item', () => {
    store.create('items', { id: '1', name: 'Item' })

    const result = store.delete('items', '1')

    expect(result).toBe(true)
  })

  it('delete removes item from collection', () => {
    store.create('items', { id: '1', name: 'Item 1' })
    store.create('items', { id: '2', name: 'Item 2' })

    store.delete('items', '1')

    const items = store.list('items')
    expect(items).toHaveLength(1)
    expect(items[0].id).toBe('2')
  })

  it('delete returns null for non-existent item', () => {
    const result = store.delete('items', 'non-existent')
    expect(result).toBeNull()
  })

  it('delete returns null for non-existent collection', () => {
    const result = store.delete('items', '1')
    expect(result).toBeNull()
  })

  it('clear removes all collections when no collection specified', () => {
    store.create('items', { id: '1', name: 'Item' })
    store.create('users', { id: '1', name: 'User' })

    store.clear()

    expect(store.list('items')).toHaveLength(0)
    expect(store.list('users')).toHaveLength(0)
  })

  it('clear removes specific collection when collection specified', () => {
    store.create('items', { id: '1', name: 'Item' })
    store.create('users', { id: '1', name: 'User' })

    store.clear('items')

    expect(store.list('items')).toHaveLength(0)
    expect(store.list('users')).toHaveLength(1)
  })

  it('clear handles non-existent collection', () => {
    expect(() => {
      store.clear('non-existent')
    }).not.toThrow()
  })

  it('create handles null data', () => {
    const result = store.create('items', null)

    expect(result).toHaveProperty('id')
    expect(typeof result.id).toBe('string')
    expect(result.id.length).toBeGreaterThan(0)
  })

  it('create handles undefined data', () => {
    const result = store.create('items', undefined)

    expect(result).toHaveProperty('id')
    expect(typeof result.id).toBe('string')
    expect(result.id.length).toBeGreaterThan(0)
  })

  it('update handles null data', () => {
    store.create('items', { id: '1', name: 'Item' })

    const updated = store.update('items', '1', null)

    expect(updated).not.toBeNull()
    expect(updated.id).toBe('1')
    expect(updated.name).toBe('Item')
  })

  it('update handles undefined data', () => {
    store.create('items', { id: '1', name: 'Item' })

    const updated = store.update('items', '1', undefined)

    expect(updated).not.toBeNull()
    expect(updated.id).toBe('1')
    expect(updated.name).toBe('Item')
  })
})
