/**
 * @vitest-environment jsdom
 */
import { Type } from '@scalar/typebox'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  clearStore,
  closeDB,
  countItems,
  deleteItem,
  getAllItems,
  getItem,
  hasItem,
  openDB,
  setItem,
} from '@/persistence/indexdb'

import 'fake-indexeddb/auto'

describe('indexdb', { concurrent: false }, () => {
  const dbName = 'test-db'
  const storeName = 'test-store'
  let db: IDBDatabase

  beforeEach(async () => {
    db = await openDB({ dbName, storeName })
  })

  afterEach(async () => {
    closeDB(db)
    await new Promise<void>((resolve, reject) => {
      const deleteRequest = indexedDB.deleteDatabase(dbName)
      deleteRequest.onsuccess = () => resolve()
      deleteRequest.onerror = () => reject(deleteRequest.error)
    })
  })

  describe('openDB', () => {
    it('opens a database successfully', async () => {
      const testDb = await openDB({ dbName: 'new-db', storeName: 'new-store' })

      expect(testDb).toBeDefined()
      expect(testDb.name).toBe('new-db')
      expect(testDb.objectStoreNames.contains('new-store')).toBe(true)

      closeDB(testDb)
      await new Promise<void>((resolve) => {
        const deleteRequest = indexedDB.deleteDatabase('new-db')
        deleteRequest.onsuccess = () => resolve()
      })
    })

    it('creates object store with custom version', async () => {
      const testDb = await openDB({ dbName: 'version-db', storeName: 'store', version: 2 })

      expect(testDb.version).toBe(2)

      closeDB(testDb)
      await new Promise<void>((resolve) => {
        const deleteRequest = indexedDB.deleteDatabase('version-db')
        deleteRequest.onsuccess = () => resolve()
      })
    })

    it('creates indexes when specified', async () => {
      const testDb = await openDB({
        dbName: 'index-db',
        storeName: 'store',
        indexes: [
          { name: 'email', keyPath: 'email', unique: true },
          { name: 'name', keyPath: 'name', unique: false },
        ],
      })

      const tx = testDb.transaction('store', 'readonly')
      const store = tx.objectStore('store')

      expect(store.indexNames.contains('email')).toBe(true)
      expect(store.indexNames.contains('name')).toBe(true)

      closeDB(testDb)
      await new Promise<void>((resolve) => {
        const deleteRequest = indexedDB.deleteDatabase('index-db')
        deleteRequest.onsuccess = () => resolve()
      })
    })
  })

  describe('setItem and getItem', () => {
    it('stores and retrieves an item without schema validation', async () => {
      await setItem(db, storeName, 'item-1', { name: 'Test Item', value: 42 })

      const retrieved = await getItem(db, storeName, 'item-1')

      expect(retrieved).toEqual({
        id: 'item-1',
        name: 'Test Item',
        value: 42,
      })
    })

    it('stores and retrieves an item with schema validation', async () => {
      const schema = Type.Object({
        name: Type.String(),
        value: Type.Number(),
      })

      await setItem(db, storeName, 'item-2', { name: 'Validated Item', value: 100 }, schema)

      const retrieved = await getItem(db, storeName, 'item-2', schema)

      expect(retrieved).toEqual({
        id: 'item-2',
        name: 'Validated Item',
        value: 100,
      })
    })

    it('returns undefined for non-existent item', async () => {
      const retrieved = await getItem(db, storeName, 'non-existent')

      expect(retrieved).toBeUndefined()
    })

    it('overwrites existing item with same ID', async () => {
      await setItem(db, storeName, 'item-3', { name: 'Original', value: 1 })
      await setItem(db, storeName, 'item-3', { name: 'Updated', value: 2 })

      const retrieved = await getItem(db, storeName, 'item-3')

      expect(retrieved).toEqual({
        id: 'item-3',
        name: 'Updated',
        value: 2,
      })
    })

    it('coerces values when using schema', async () => {
      const schema = Type.Object({
        name: Type.String(),
        age: Type.Number(),
        active: Type.Boolean(),
      })

      await setItem(
        db,
        storeName,
        'item-4',
        {
          name: 'User',
          age: '25' as any,
          active: 'true' as any,
        },
        schema,
      )

      const retrieved = await getItem(db, storeName, 'item-4', schema)

      expect(retrieved).toEqual({
        id: 'item-4',
        name: 'User',
        age: 0,
        active: false,
      })
    })

    it('handles complex nested objects', async () => {
      const complexData = {
        name: 'Complex',
        nested: {
          deep: {
            value: 'deeply nested',
            array: [1, 2, 3],
          },
        },
        tags: ['tag1', 'tag2'],
      }

      await setItem(db, storeName, 'complex-1', complexData)

      const retrieved = await getItem(db, storeName, 'complex-1')

      expect(retrieved).toEqual({
        id: 'complex-1',
        ...complexData,
      })
    })
  })

  describe('getAllItems', () => {
    it('retrieves all items from empty store', async () => {
      const items = await getAllItems(db, storeName)

      expect(items).toEqual([])
    })

    it('retrieves all items from populated store', async () => {
      await setItem(db, storeName, 'item-1', { name: 'Item 1' })
      await setItem(db, storeName, 'item-2', { name: 'Item 2' })
      await setItem(db, storeName, 'item-3', { name: 'Item 3' })

      const items = await getAllItems(db, storeName)

      expect(items).toHaveLength(3)
      expect(items.map((item) => item.id)).toEqual(['item-1', 'item-2', 'item-3'])
    })

    it('retrieves all items with schema validation', async () => {
      const schema = Type.Object({
        name: Type.String(),
      })

      await setItem(db, storeName, 'item-1', { name: 'Item 1' }, schema)
      await setItem(db, storeName, 'item-2', { name: 'Item 2' }, schema)

      const items = await getAllItems(db, storeName, schema)

      expect(items).toHaveLength(2)
      expect(items[0]).toEqual({ id: 'item-1', name: 'Item 1' })
      expect(items[1]).toEqual({ id: 'item-2', name: 'Item 2' })
    })
  })

  describe('deleteItem', () => {
    it('deletes an existing item', async () => {
      await setItem(db, storeName, 'item-1', { name: 'To Delete' })

      expect(await getItem(db, storeName, 'item-1')).toBeDefined()

      await deleteItem(db, storeName, 'item-1')

      expect(await getItem(db, storeName, 'item-1')).toBeUndefined()
    })

    it('handles deleting non-existent item without error', async () => {
      await expect(deleteItem(db, storeName, 'non-existent')).resolves.not.toThrow()
    })

    it('deletes only the specified item', async () => {
      await setItem(db, storeName, 'item-1', { name: 'Item 1' })
      await setItem(db, storeName, 'item-2', { name: 'Item 2' })
      await setItem(db, storeName, 'item-3', { name: 'Item 3' })

      await deleteItem(db, storeName, 'item-2')

      const items = await getAllItems(db, storeName)
      expect(items).toHaveLength(2)
      expect(items.map((item) => item.id)).toEqual(['item-1', 'item-3'])
    })
  })

  describe('clearStore', () => {
    it('clears all items from the store', async () => {
      await setItem(db, storeName, 'item-1', { name: 'Item 1' })
      await setItem(db, storeName, 'item-2', { name: 'Item 2' })
      await setItem(db, storeName, 'item-3', { name: 'Item 3' })

      expect(await getAllItems(db, storeName)).toHaveLength(3)

      await clearStore(db, storeName)

      expect(await getAllItems(db, storeName)).toHaveLength(0)
    })

    it('does not throw when clearing an empty store', async () => {
      await expect(clearStore(db, storeName)).resolves.not.toThrow()
    })
  })

  describe('hasItem', () => {
    it('returns true for existing item', async () => {
      await setItem(db, storeName, 'item-1', { name: 'Exists' })

      const exists = await hasItem(db, storeName, 'item-1')

      expect(exists).toBe(true)
    })

    it('returns false for non-existent item', async () => {
      const exists = await hasItem(db, storeName, 'non-existent')

      expect(exists).toBe(false)
    })

    it('returns false after item is deleted', async () => {
      await setItem(db, storeName, 'item-1', { name: 'To Delete' })

      expect(await hasItem(db, storeName, 'item-1')).toBe(true)

      await deleteItem(db, storeName, 'item-1')

      expect(await hasItem(db, storeName, 'item-1')).toBe(false)
    })
  })

  describe('countItems', () => {
    it('returns 0 for empty store', async () => {
      const count = await countItems(db, storeName)

      expect(count).toBe(0)
    })

    it('returns correct count for populated store', async () => {
      await setItem(db, storeName, 'item-1', { name: 'Item 1' })
      await setItem(db, storeName, 'item-2', { name: 'Item 2' })
      await setItem(db, storeName, 'item-3', { name: 'Item 3' })

      const count = await countItems(db, storeName)

      expect(count).toBe(3)
    })

    it('returns updated count after adding items', async () => {
      expect(await countItems(db, storeName)).toBe(0)

      await setItem(db, storeName, 'item-1', { name: 'Item 1' })
      expect(await countItems(db, storeName)).toBe(1)

      await setItem(db, storeName, 'item-2', { name: 'Item 2' })
      expect(await countItems(db, storeName)).toBe(2)
    })

    it('returns updated count after deleting items', async () => {
      await setItem(db, storeName, 'item-1', { name: 'Item 1' })
      await setItem(db, storeName, 'item-2', { name: 'Item 2' })
      await setItem(db, storeName, 'item-3', { name: 'Item 3' })

      expect(await countItems(db, storeName)).toBe(3)

      await deleteItem(db, storeName, 'item-2')

      expect(await countItems(db, storeName)).toBe(2)
    })

    it('returns 0 after clearing store', async () => {
      await setItem(db, storeName, 'item-1', { name: 'Item 1' })
      await setItem(db, storeName, 'item-2', { name: 'Item 2' })

      expect(await countItems(db, storeName)).toBe(2)

      await clearStore(db, storeName)

      expect(await countItems(db, storeName)).toBe(0)
    })
  })

  describe('closeDB', () => {
    it('closes database connection without error', async () => {
      const testDb = await openDB({ dbName: 'close-test-db', storeName: 'store' })

      expect(() => closeDB(testDb)).not.toThrow()

      await new Promise<void>((resolve) => {
        const deleteRequest = indexedDB.deleteDatabase('close-test-db')
        deleteRequest.onsuccess = () => resolve()
      })
    })
  })

  describe('edge cases and error handling', () => {
    it('handles empty string as item ID', async () => {
      await setItem(db, storeName, '', { name: 'Empty ID' })

      const retrieved = await getItem(db, storeName, '')

      expect(retrieved).toEqual({
        id: '',
        name: 'Empty ID',
      })
    })

    it('handles special characters in item ID', async () => {
      const specialId = 'item-!@#$%^&*()_+-=[]{}|;:,.<>?'

      await setItem(db, storeName, specialId, { name: 'Special' })

      const retrieved = await getItem(db, storeName, specialId)

      expect(retrieved).toEqual({
        id: specialId,
        name: 'Special',
      })
    })

    it('handles null values in data', async () => {
      await setItem(db, storeName, 'null-test', { name: 'Test', value: null })

      const retrieved = await getItem(db, storeName, 'null-test')

      expect(retrieved).toEqual({
        id: 'null-test',
        name: 'Test',
        value: null,
      })
    })

    it('handles undefined values in data', async () => {
      await setItem(db, storeName, 'undefined-test', { name: 'Test', value: undefined })

      const retrieved = await getItem(db, storeName, 'undefined-test')

      // IndexedDB does not store undefined values, they are omitted
      expect(retrieved).toEqual({
        id: 'undefined-test',
        name: 'Test',
      })
    })

    it('handles arrays in data', async () => {
      await setItem(db, storeName, 'array-test', {
        name: 'Array Test',
        items: [1, 2, 3, 4, 5],
      })

      const retrieved = await getItem(db, storeName, 'array-test')

      expect(retrieved).toEqual({
        id: 'array-test',
        name: 'Array Test',
        items: [1, 2, 3, 4, 5],
      })
    })

    it('handles dates in data', async () => {
      const now = new Date()

      await setItem(db, storeName, 'date-test', {
        name: 'Date Test',
        timestamp: now,
      })

      const retrieved = await getItem(db, storeName, 'date-test')

      expect(retrieved).toEqual({
        id: 'date-test',
        name: 'Date Test',
        timestamp: now,
      })
    })

    it('handles very long strings', async () => {
      const longString = 'a'.repeat(100000)

      await setItem(db, storeName, 'long-string', { content: longString })

      const retrieved = await getItem(db, storeName, 'long-string', Type.Object({ content: Type.String() }))

      expect(retrieved).toBeDefined()

      expect(retrieved?.content).toBe(longString)
    })

    it('handles large objects', async () => {
      const largeObject = {
        items: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          value: Math.random(),
        })),
      }

      await setItem(db, storeName, 'large-object', largeObject)

      const retrieved = await getItem(db, storeName, 'large-object')

      expect(retrieved).toEqual({
        id: 'large-object',
        ...largeObject,
      })
    })
  })

  describe('concurrent operations', () => {
    it('handles concurrent writes to different items', async () => {
      await Promise.all([
        setItem(db, storeName, 'item-1', { name: 'Item 1' }),
        setItem(db, storeName, 'item-2', { name: 'Item 2' }),
        setItem(db, storeName, 'item-3', { name: 'Item 3' }),
        setItem(db, storeName, 'item-4', { name: 'Item 4' }),
        setItem(db, storeName, 'item-5', { name: 'Item 5' }),
      ])

      const count = await countItems(db, storeName)
      expect(count).toBe(5)
    })

    it('handles concurrent reads', async () => {
      await setItem(db, storeName, 'item-1', { name: 'Item 1' })

      const results = await Promise.all([
        getItem(db, storeName, 'item-1'),
        getItem(db, storeName, 'item-1'),
        getItem(db, storeName, 'item-1'),
      ])

      results.forEach((result) => {
        expect(result).toEqual({
          id: 'item-1',
          name: 'Item 1',
        })
      })
    })
  })
})
