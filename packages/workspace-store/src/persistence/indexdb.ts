import type { Static, TObject, TRecord } from '@scalar/typebox'

type TableEntry<S extends TObject, K extends readonly (keyof Static<S>)[]> = {
  schema: S
  index: K
}

/**
 * Initializes and manages an IndexedDB database connection for table-based persistence.
 *
 * @param name - The database name. Defaults to 'scalar-workspace-store'.
 * @param tables - Table definitions: the tables to create and their key schemas.
 * @param version - The database version. Bump this to trigger upgrades (default: 1).
 * @param migrations - Optional migration steps to run for version upgrades.
 * @returns An object with the following methods:
 *   - `get(tableName)` — Get a wrapper to interact with the object store for the given table name.
 *   - `closeDatabase()` — Closes the database connection.
 *
 * Example usage:
 * ```ts
 * import { Type } from '@scalar/typebox'
 * import { createIndexDbConnection } from './indexdb'
 *
 * // Define a schema for a user
 * const UserSchema = Type.Object({
 *   id: Type.String(),
 *   name: Type.String(),
 *   age: Type.Number(),
 * })
 *
 * // Define tables in the database
 * const dbConfig = {
 *   users: {
 *     schema: UserSchema,
 *     index: ['id'] as const,
 *   },
 * }
 *
 * // Open the database connection and get table API
 * const { get, closeDatabase } = await createIndexDbConnection({
 *   name: 'my-app-db',
 *   tables: dbConfig,
 *   version: 1,
 * })
 *
 * // Get a strongly-typed users table API
 * const usersTable = get('users')
 *
 * // Add a user
 * await usersTable.addItem({ id: 'user-1' }, { name: 'Alice', age: 25 })
 *
 * // Retrieve a user by id
 * const user = await usersTable.getItem({ id: 'user-1' })
 *
 * // Don't forget to close the database when done!
 * closeDatabase()
 * ```
 */
export const createIndexDbConnection = async <T extends Record<string, TableEntry<any, readonly (keyof any)[]>>>({
  name = 'scalar-workspace-store',
  tables,
  version = 1,
  migrations = [],
}: {
  name: string
  tables: T
  version: number
  migrations?: { version: number; exec: (db: IDBDatabase, event: IDBVersionChangeEvent) => {} }[]
}) => {
  const db = indexedDB.open(name, version)

  db.onupgradeneeded = (e) => {
    // Initial setup of object stores
    if (e.oldVersion < 1) {
      const database = db.result

      // Initialize all the tables
      Object.entries(tables).forEach(([name, options]) => {
        if (!database.objectStoreNames.contains(name)) {
          database.createObjectStore(name, {
            keyPath: options.index.length === 1 ? (options.index[0] as string) : (options.index as string[]),
          })
        }
      })
    }

    // Run any future migrations here
    migrations.forEach((migration) => {
      if (e.oldVersion < migration.version) {
        migration.exec(db.result, e)
      }
    })
  }

  await new Promise((resolve, reject) => {
    db.onsuccess = () => resolve(true)
    db.onerror = () => reject(db.error)
  })

  return {
    get: <Name extends keyof T>(name: Name) => {
      return createTableWrapper<T[Name]['schema'], T[Name]['index'][number]>(name as string, db.result)
    },
    closeDatabase: () => {
      db.result.close()
    },
  }
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
  db: IDBDatabase,
) {
  /**
   * Gets the object store from the latest DB connection, for the given transaction mode.
   */
  const getStore = async (mode: IDBTransactionMode) => {
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
