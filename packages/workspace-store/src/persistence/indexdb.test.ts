import { Type } from '@scalar/typebox'
import { beforeEach, describe, expect, it } from 'vitest'
import 'fake-indexeddb/auto'

import { createIndexDbConnection } from './indexdb'

// Define test schemas
const UserSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  age: Type.Number(),
})

const OrderSchema = Type.Object({
  userId: Type.String(),
  orderId: Type.String(),
  amount: Type.Number(),
  status: Type.String(),
})

describe('indexdb', () => {
  const testDbName = 'test-db'
  let dbConnection: Awaited<
    ReturnType<
      typeof createIndexDbConnection<{
        users: { schema: typeof UserSchema; keyPath: ['id'] }
        orders: { schema: typeof OrderSchema; keyPath: ['userId', 'orderId'] }
      }>
    >
  >

  beforeEach(async () => {
    dbConnection = await createIndexDbConnection({
      name: testDbName,
      tables: {
        users: { schema: UserSchema, keyPath: ['id'] as const },
        orders: { schema: OrderSchema, keyPath: ['userId', 'orderId'] as const },
      },
      migrations: [
        {
          description: 'Initial test schema',
          up: ({ db }) => {
            db.createObjectStore('users', { keyPath: 'id' })
            db.createObjectStore('orders', { keyPath: ['userId', 'orderId'] })
          },
        },
      ],
    })

    return async () => {
      // Clean up: close connection and delete database
      dbConnection.closeDatabase()
      const deleteRequest = indexedDB.deleteDatabase(testDbName)
      await new Promise((resolve, reject) => {
        deleteRequest.onsuccess = () => resolve(undefined)
        deleteRequest.onerror = () => reject(deleteRequest.error)
      })
    }
  })

  it('adds and retrieves a single item', async () => {
    const user = await dbConnection.get('users').addItem({ id: 'user-1' }, { name: 'Alice', age: 30 })

    expect(user).toEqual({ id: 'user-1', name: 'Alice', age: 30 })

    const retrieved = await dbConnection.get('users').getItem({ id: 'user-1' })
    expect(retrieved).toEqual({ id: 'user-1', name: 'Alice', age: 30 })
  })

  it('updates an existing item when adding with same key', async () => {
    await dbConnection.get('users').addItem({ id: 'user-1' }, { name: 'Alice', age: 30 })
    await dbConnection.get('users').addItem({ id: 'user-1' }, { name: 'Alice Updated', age: 31 })

    const retrieved = await dbConnection.get('users').getItem({ id: 'user-1' })
    expect(retrieved).toEqual({ id: 'user-1', name: 'Alice Updated', age: 31 })
  })

  it('returns undefined when getting non-existent item', async () => {
    const usersTable = dbConnection.get('users')

    await usersTable.addItem({ id: 'user-1' }, { name: 'Alice', age: 30 })
    await usersTable.addItem({ id: 'user-1' }, { name: 'Alice Updated', age: 31 })

    const retrieved = await usersTable.getItem({ id: 'user-1' })
    expect(retrieved).toEqual({ id: 'user-1', name: 'Alice Updated', age: 31 })
  })

  it('returns undefined when getting non-existent item', async () => {
    const usersTable = await dbConnection.get('users')

    const retrieved = await usersTable.getItem({ id: 'non-existent' })
    expect(retrieved).toBeUndefined()
  })

  it('adds and retrieves multiple items', async () => {
    const usersTable = await dbConnection.get('users')

    await usersTable.addItem({ id: 'user-1' }, { name: 'Alice', age: 30 })
    await usersTable.addItem({ id: 'user-2' }, { name: 'Bob', age: 25 })
    await usersTable.addItem({ id: 'user-3' }, { name: 'Charlie', age: 35 })

    const user1 = await usersTable.getItem({ id: 'user-1' })
    const user2 = await usersTable.getItem({ id: 'user-2' })
    const user3 = await usersTable.getItem({ id: 'user-3' })

    expect(user1).toEqual({ id: 'user-1', name: 'Alice', age: 30 })
    expect(user2).toEqual({ id: 'user-2', name: 'Bob', age: 25 })
    expect(user3).toEqual({ id: 'user-3', name: 'Charlie', age: 35 })
  })

  it('retrieves range with composite key - partial match', async () => {
    const ordersTable = await dbConnection.get('orders')

    await ordersTable.addItem({ userId: 'user-1', orderId: 'order-1' }, { amount: 100, status: 'pending' })
    await ordersTable.addItem({ userId: 'user-1', orderId: 'order-2' }, { amount: 200, status: 'completed' })
    await ordersTable.addItem({ userId: 'user-2', orderId: 'order-1' }, { amount: 150, status: 'pending' })

    const user1Orders = await ordersTable.getRange(['user-1'])
    expect(user1Orders).toHaveLength(2)
    expect(user1Orders).toEqual([
      { userId: 'user-1', orderId: 'order-1', amount: 100, status: 'pending' },
      { userId: 'user-1', orderId: 'order-2', amount: 200, status: 'completed' },
    ])
  })

  it('retrieves range with composite key - full match', async () => {
    const ordersTable = await dbConnection.get('orders')

    await ordersTable.addItem({ userId: 'user-1', orderId: 'order-1' }, { amount: 100, status: 'pending' })
    await ordersTable.addItem({ userId: 'user-1', orderId: 'order-2' }, { amount: 200, status: 'completed' })

    const specificOrder = await ordersTable.getRange(['user-1', 'order-1'])
    expect(specificOrder).toHaveLength(1)
    expect(specificOrder[0]).toEqual({
      userId: 'user-1',
      orderId: 'order-1',
      amount: 100,
      status: 'pending',
    })
  })

  it('returns empty array for range with no matches', async () => {
    const usersTable = await dbConnection.get('users')

    await usersTable.addItem({ id: 'user-1' }, { name: 'Alice', age: 30 })

    const results = await usersTable.getRange(['admin'])
    expect(results).toEqual([])
  })

  it('deletes a single item', async () => {
    const usersTable = await dbConnection.get('users')

    await usersTable.addItem({ id: 'user-1' }, { name: 'Alice', age: 30 })
    await usersTable.addItem({ id: 'user-2' }, { name: 'Bob', age: 25 })

    await usersTable.deleteItem({ id: 'user-1' })

    const user1 = await usersTable.getItem({ id: 'user-1' })
    const user2 = await usersTable.getItem({ id: 'user-2' })

    expect(user1).toBeUndefined()
    expect(user2).toEqual({ id: 'user-2', name: 'Bob', age: 25 })
  })

  it('deletes item with composite key', async () => {
    const ordersTable = await dbConnection.get('orders')

    await ordersTable.addItem({ userId: 'user-1', orderId: 'order-1' }, { amount: 100, status: 'pending' })
    await ordersTable.addItem({ userId: 'user-1', orderId: 'order-2' }, { amount: 200, status: 'completed' })

    await ordersTable.deleteItem({ userId: 'user-1', orderId: 'order-1' })

    const deleted = await ordersTable.getItem({ userId: 'user-1', orderId: 'order-1' })
    const existing = await ordersTable.getItem({ userId: 'user-1', orderId: 'order-2' })

    expect(deleted).toBeUndefined()
    expect(existing).toBeDefined()
  })

  it('does not error when deleting non-existent item', async () => {
    const usersTable = await dbConnection.get('users')

    await expect(usersTable.deleteItem({ id: 'non-existent' })).resolves.toBeUndefined()
  })

  it('deletes range with composite key', async () => {
    const ordersTable = await dbConnection.get('orders')

    await ordersTable.addItem({ userId: 'user-1', orderId: 'order-1' }, { amount: 100, status: 'pending' })
    await ordersTable.addItem({ userId: 'user-1', orderId: 'order-2' }, { amount: 200, status: 'completed' })
    await ordersTable.addItem({ userId: 'user-2', orderId: 'order-1' }, { amount: 150, status: 'pending' })

    const deletedCount = await ordersTable.deleteRange(['user-1'])

    expect(deletedCount).toBe(2)

    const user1Orders = await ordersTable.getRange(['user-1'])
    const user2Orders = await ordersTable.getRange(['user-2'])

    expect(user1Orders).toEqual([])
    expect(user2Orders).toHaveLength(1)
  })

  it('returns zero when deleting range with no matches', async () => {
    const ordersTable = dbConnection.get('orders')

    await ordersTable.addItem({ userId: 'user-1', orderId: 'order-1' }, { amount: 100, status: 'pending' })

    const deletedCount = await ordersTable.deleteRange(['admin'])
    expect(deletedCount).toBe(0)
  })

  it('closes database connection', async () => {
    await dbConnection.get('users').addItem({ id: 'user-1' }, { name: 'Alice', age: 30 })

    expect(dbConnection.closeDatabase()).toBe(undefined)
  })

  it('handles multiple tables in same database', async () => {
    const usersTable = dbConnection.get('users')

    const ordersTable = dbConnection.get('orders')

    await usersTable.addItem({ id: 'user-1' }, { name: 'Alice', age: 30 })
    await ordersTable.addItem({ userId: 'user-1', orderId: 'order-1' }, { amount: 100, status: 'pending' })

    const user = await usersTable.getItem({ id: 'user-1' })
    const order = await ordersTable.getItem({ userId: 'user-1', orderId: 'order-1' })

    expect(user).toBeDefined()
    expect(order).toBeDefined()
  })

  it('gets all items from empty table', async () => {
    const usersTable = dbConnection.get('users')

    const allItems = await usersTable.getAll()

    expect(allItems).toEqual([])
  })

  it('gets all items from table with single key', async () => {
    const usersTable = dbConnection.get('users')

    await usersTable.addItem({ id: 'user-1' }, { name: 'Alice', age: 30 })
    await usersTable.addItem({ id: 'user-2' }, { name: 'Bob', age: 25 })
    await usersTable.addItem({ id: 'user-3' }, { name: 'Charlie', age: 35 })

    const allItems = await usersTable.getAll()

    expect(allItems).toHaveLength(3)
    expect(allItems).toEqual([
      { id: 'user-1', name: 'Alice', age: 30 },
      { id: 'user-2', name: 'Bob', age: 25 },
      { id: 'user-3', name: 'Charlie', age: 35 },
    ])
  })

  it('gets all items from table with composite key', async () => {
    const ordersTable = dbConnection.get('orders')

    await ordersTable.addItem({ userId: 'user-1', orderId: 'order-1' }, { amount: 100, status: 'pending' })
    await ordersTable.addItem({ userId: 'user-1', orderId: 'order-2' }, { amount: 200, status: 'completed' })
    await ordersTable.addItem({ userId: 'user-2', orderId: 'order-1' }, { amount: 150, status: 'pending' })

    const allItems = await ordersTable.getAll()

    expect(allItems).toHaveLength(3)
    expect(allItems).toEqual([
      { userId: 'user-1', orderId: 'order-1', amount: 100, status: 'pending' },
      { userId: 'user-1', orderId: 'order-2', amount: 200, status: 'completed' },
      { userId: 'user-2', orderId: 'order-1', amount: 150, status: 'pending' },
    ])
  })

  it('gets all items after some have been deleted', async () => {
    const usersTable = dbConnection.get('users')

    await usersTable.addItem({ id: 'user-1' }, { name: 'Alice', age: 30 })
    await usersTable.addItem({ id: 'user-2' }, { name: 'Bob', age: 25 })
    await usersTable.addItem({ id: 'user-3' }, { name: 'Charlie', age: 35 })

    await usersTable.deleteItem({ id: 'user-2' })

    const allItems = await usersTable.getAll()

    expect(allItems).toHaveLength(2)
    expect(allItems).toEqual([
      { id: 'user-1', name: 'Alice', age: 30 },
      { id: 'user-3', name: 'Charlie', age: 35 },
    ])
  })

  it('gets all items after range deletion', async () => {
    const ordersTable = dbConnection.get('orders')

    await ordersTable.addItem({ userId: 'user-1', orderId: 'order-1' }, { amount: 100, status: 'pending' })
    await ordersTable.addItem({ userId: 'user-1', orderId: 'order-2' }, { amount: 200, status: 'completed' })
    await ordersTable.addItem({ userId: 'user-2', orderId: 'order-1' }, { amount: 150, status: 'pending' })

    await ordersTable.deleteRange(['user-1'])

    const allItems = await ordersTable.getAll()

    expect(allItems).toHaveLength(1)
    expect(allItems).toEqual([{ userId: 'user-2', orderId: 'order-1', amount: 150, status: 'pending' }])
  })

  it('gets all items after updates', async () => {
    const usersTable = dbConnection.get('users')

    await usersTable.addItem({ id: 'user-1' }, { name: 'Alice', age: 30 })
    await usersTable.addItem({ id: 'user-2' }, { name: 'Bob', age: 25 })

    // Update user-1
    await usersTable.addItem({ id: 'user-1' }, { name: 'Alice Updated', age: 31 })

    const allItems = await usersTable.getAll()

    expect(allItems).toHaveLength(2)
    expect(allItems).toEqual([
      { id: 'user-1', name: 'Alice Updated', age: 31 },
      { id: 'user-2', name: 'Bob', age: 25 },
    ])
  })

  describe('migration runner', () => {
    /**
     * Helper to remove a database between sub-tests. The outer describe block
     * scopes a single `testDbName`; these tests open their own databases so
     * they can declare migration chains directly.
     */
    const deleteDatabase = (name: string) =>
      new Promise<void>((resolve, reject) => {
        const req = indexedDB.deleteDatabase(name)
        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error)
        req.onblocked = () => resolve()
      })

    /** Wraps an IDB request as a Promise so we can await it inside a migration. */
    const wrap = <T>(req: IDBRequest<T>) =>
      new Promise<T>((resolve, reject) => {
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      })

    it('awaits async migrations before running the next one', async () => {
      const dbName = 'migration-ordering-test'
      await deleteDatabase(dbName)

      // The first migration creates a store and writes a record asynchronously.
      // The second migration reads that record back. If the runner started v2
      // before v1 had a chance to finish its onsuccess work, v2 would see an
      // empty store — which is exactly the latent ordering bug we are guarding
      // against.
      const observedByV2: Array<{ id: string; name: string }> = []

      const connection = await createIndexDbConnection({
        name: dbName,
        tables: {
          users: { schema: UserSchema, keyPath: ['id'] as const },
        },
        migrations: [
          {
            description: 'create users and seed asynchronously',
            up: async ({ db, transaction }) => {
              db.createObjectStore('users', { keyPath: 'id' })
              // Mimic v2-team-to-local: do an IDB read first, then mutate.
              // Even though there is nothing to read yet, awaiting a getAll
              // forces the schema work below to happen across an await.
              await wrap(transaction.objectStore('users').getAll())
              await wrap(transaction.objectStore('users').put({ id: 'seed', name: 'Seed', age: 0 }))
            },
          },
          {
            description: 'observe seeded data',
            up: async ({ transaction }) => {
              const all = (await wrap(transaction.objectStore('users').getAll())) as Array<{
                id: string
                name: string
                age: number
              }>
              for (const record of all) {
                observedByV2.push({ id: record.id, name: record.name })
              }
            },
          },
        ],
      })

      try {
        expect(observedByV2).toEqual([{ id: 'seed', name: 'Seed' }])
      } finally {
        connection.closeDatabase()
        await deleteDatabase(dbName)
      }
    })

    it('surfaces the descriptive label when an async migration rejects', async () => {
      const dbName = 'migration-async-error-test'
      await deleteDatabase(dbName)

      try {
        await expect(
          createIndexDbConnection({
            name: dbName,
            tables: {
              users: { schema: UserSchema, keyPath: ['id'] as const },
            },
            migrations: [
              {
                description: 'create users',
                up: ({ db }) => {
                  db.createObjectStore('users', { keyPath: 'id' })
                },
              },
              {
                description: 'fail asynchronously',
                up: async ({ transaction }) => {
                  // First await keeps the upgrade transaction alive.
                  await wrap(transaction.objectStore('users').getAll())
                  throw new Error('boom')
                },
              },
            ],
          }),
        ).rejects.toThrow('Migration v2 (fail asynchronously) failed: boom')
      } finally {
        await deleteDatabase(dbName)
      }
    })

    it('surfaces the descriptive label when a synchronous migration throws', async () => {
      const dbName = 'migration-sync-error-test'
      await deleteDatabase(dbName)

      try {
        await expect(
          createIndexDbConnection({
            name: dbName,
            tables: {
              users: { schema: UserSchema, keyPath: ['id'] as const },
            },
            migrations: [
              {
                description: 'create users',
                up: ({ db }) => {
                  db.createObjectStore('users', { keyPath: 'id' })
                  throw new Error('sync boom')
                },
              },
            ],
          }),
        ).rejects.toThrow('Migration v1 (create users) failed: sync boom')
      } finally {
        await deleteDatabase(dbName)
      }
    })
  })
})
