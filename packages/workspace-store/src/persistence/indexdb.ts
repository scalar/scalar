import type { Static, TObject, TRecord } from '@scalar/typebox'

/**
 * Creates a connection to an IndexedDB database for managing tables and persistence.
 *
 * @param dbName - Optional database name (default 'scalar-workspace-store')
 * @returns An object with `createTable` and `closeDatabase` functions.
 *
 * Example:
 * ```ts
 * import { Type } from '@scalar/typebox'
 * import { createIndexDbConnection } from './indexdb'
 *
 * // Define a schema
 * const UserSchema = Type.Object({
 *   id: Type.String(),
 *   name: Type.String(),
 *   age: Type.Number(),
 * })
 *
 * // Create the database connection
 * const { createTable, closeDatabase } = createIndexDbConnection()
 *
 * // Create (or open) a "users" table with "id" as key
 * const usersTable = await createTable('users', {
 *   schema: UserSchema,
 *   key: ['id'],
 * })
 *
 * // Use usersTable methods for CRUD (see createTableWrapper)
 * ```
 */
export function createIndexDbConnection(dbName = 'scalar-workspace-store') {
  let dbPromise: Promise<IDBDatabase>

  // Open DB without version first to detect existing version
  async function openDatabase(): Promise<IDBDatabase> {
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName)
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve(request.result)
      })
    }
    return dbPromise
  }

  /**
   * Creates an object store ("table") in the database if it doesn't exist, using the provided schema and key.
   * Returns a typed table wrapper for CRUD operations.
   *
   * @param name - Object store name
   * @param options - { schema, key } where schema is the TypeBox schema and key is array of key fields
   */
  async function createTable<T extends TRecord | TObject, const K extends keyof Static<T>>(
    name: string,
    options: {
      schema: T
      key: K[]
    },
  ) {
    let db = await openDatabase()

    if (!db.objectStoreNames.contains(name)) {
      // Need to create store -> increment version
      const newVersion = db.version + 1
      db.close()

      dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, newVersion)

        request.onupgradeneeded = () => {
          const upgradeDb = request.result
          if (!upgradeDb.objectStoreNames.contains(name)) {
            upgradeDb.createObjectStore(name, {
              keyPath: options.key.length === 1 ? (options.key[0] as string) : (options.key as string[]),
            })
          }
        }

        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })

      db = await dbPromise
    }

    return createTableWrapper<T, K>(name, openDatabase)
  }

  /**
   * Closes the database connection.
   * After calling this, a new connection will be opened on the next operation.
   */
  async function closeDatabase(): Promise<void> {
    if (dbPromise) {
      const db = await dbPromise
      db.close()
      // Reset the promise so next operation opens a fresh connection
      dbPromise = undefined as any
    }
  }

  return { createTable, closeDatabase }
}

/**
 * Utility wrapper for interacting with an IndexedDB object store, typed by the schema.
 *
 * Usage example:
 * ```
 * // Define a TypeBox schema for users
 * const UserSchema = Type.Object({
 *   id: Type.String(),
 *   name: Type.String(),
 *   age: Type.Number(),
 * })
 * 
 * // Open or create the users table
 * const usersTable = createTableWrapper<typeof UserSchema, 'id'>('users', openDatabase)
 * 
 * // Add a user
  await usersTable.addItem({ id: 'user-1' }, { name: 'Alice', age: 24 })
 * 
 * // Get a user by id
 * const alic = await usersTable.getItem({ id: 'user-1' })
 * 
 * // Get users with a partial key (use [] if no composite key)
 * const users = await usersTable.getRange(['user-1'])
 * 
 * // Get all users
 * const allUsers = await usersTable.getAll()
 * ```
 *
 * @template T TypeBox schema type for objects in the store
 * @template K Key property names that compose the primary key
 *
 * @param name - Object store name
 * @param getDb - Function returning a Promise for the IDBDatabase
 * @returns Methods to interact with the object store
 */
function createTableWrapper<T extends TRecord | TObject, const K extends keyof Static<T>>(
  name: string,
  getDb: () => Promise<IDBDatabase>,
) {
  /**
   * Gets the object store from the latest DB connection, for the given transaction mode.
   */
  const getStore = async (mode: IDBTransactionMode) => {
    const db = await getDb()
    const tx = db.transaction(name, mode)
    return tx.objectStore(name)
  }

  /**
   * Adds or updates an item in the store.
   * @param key - The primary key values, as { key1, key2 }
   * @param value - The value for the other properties, omitting keys
   * @returns The full inserted/updated object
   */
  async function addItem(key: Record<K, IDBValidKey>, value: Omit<Static<T>, K>): Promise<Static<T>> {
    const store = await getStore('readwrite')
    const keyObj: any = { ...key }
    const finalValue = { ...keyObj, ...value }
    await requestAsPromise(store.put(finalValue))
    return finalValue
  }

  /**
   * Retrieves a single item by composite key.
   * @param key - Key values. For a single key: { id: '...' }
   * @returns The found object or undefined
   */
  async function getItem(key: Record<K, IDBValidKey>): Promise<Static<T> | undefined> {
    const store = await getStore('readonly')
    const keyValues = Object.values(key)
    // For single keys, pass value directly; for compound keys, pass array
    const keyToUse = keyValues.length === 1 ? keyValues[0] : keyValues
    return requestAsPromise(store.get(keyToUse as IDBValidKey))
  }

  /**
   * Returns all records matching a partial (prefix) key. Use for composite keys.
   * For non-compound keys, pass single-element array: getRange(['some-id'])
   * For prefix search, pass subset of key parts.
   * @param partialKey - Array of partial key values
   * @returns Matching objects
   *
   * Example (composite [a,b]):
   *   getRange(['foo']) // All with a === 'foo'
   *   getRange(['foo', 'bar']) // All with a === 'foo' and b === 'bar'
   */
  async function getRange(partialKey: IDBValidKey[]): Promise<Static<T>[]> {
    const store = await getStore('readonly')
    const results: Static<T>[] = []

    // Construct upper bound to match all keys starting with partialKey
    const upperBound = [...partialKey]
    upperBound.push([]) // ensures upper bound includes all keys with this prefix
    const range = IDBKeyRange.bound(partialKey, upperBound, false, true)

    return new Promise((resolve, reject) => {
      const request = store.openCursor(range)
      request.onerror = () => reject(request.error)
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result
        if (cursor) {
          results.push(cursor.value)
          cursor.continue()
        } else {
          resolve(results)
        }
      }
    })
  }

  /**
   * Deletes an item from the store by its composite key.
   * @param key - Key values. For a single key: { id: '...' }
   * @returns void
   */
  async function deleteItem(key: Record<K, IDBValidKey>): Promise<void> {
    const store = await getStore('readwrite')
    const keyValues = Object.values(key)
    // For single keys, pass value directly; for compound keys, pass array
    const keyToUse = keyValues.length === 1 ? keyValues[0] : keyValues
    await requestAsPromise(store.delete(keyToUse as IDBValidKey))
  }

  /**
   * Deletes all records matching a partial (prefix) key. Use for composite keys.
   * For non-compound keys, pass single-element array: deleteRange(['some-id'])
   * For prefix deletion, pass subset of key parts.
   * @param partialKey - Array of partial key values
   * @returns Number of deleted items
   *
   * Example (composite [a,b]):
   *   deleteRange(['foo']) // Delete all with a === 'foo'
   *   deleteRange(['foo', 'bar']) // Delete all with a === 'foo' and b === 'bar'
   */
  async function deleteRange(partialKey: IDBValidKey[]): Promise<number> {
    const store = await getStore('readwrite')
    let deletedCount = 0

    // Construct upper bound to match all keys starting with partialKey
    const upperBound = [...partialKey]
    upperBound.push([]) // ensures upper bound includes all keys with this prefix
    const range = IDBKeyRange.bound(partialKey, upperBound, false, true)

    return new Promise((resolve, reject) => {
      const request = store.openCursor(range)
      request.onerror = () => reject(request.error)
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result
        if (cursor) {
          cursor.delete()
          deletedCount++
          cursor.continue()
        } else {
          resolve(deletedCount)
        }
      }
    })
  }

  /**
   * Retrieves all items from the table.
   * @returns Array of all objects in the store
   */
  async function getAll(): Promise<Static<T>[]> {
    const store = await getStore('readonly')
    return requestAsPromise(store.getAll())
  }

  return {
    addItem,
    getItem,
    getRange,
    deleteItem,
    deleteRange,
    getAll,
  }
}

// ---- Utility ----
function requestAsPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}
