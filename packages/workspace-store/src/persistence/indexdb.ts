import { type Static, type TSchema, Type } from '@scalar/typebox'

import { coerceValue } from '@/schemas/typebox-coerce'

/**
 * Configuration options for opening an IndexedDB database.
 */
export type OpenDBConfig = {
  /** The name of the database to open or create. */
  dbName: string
  /** The name of the object store to create or use. */
  storeName: string
  /** Optional custom version number. Defaults to 1. */
  version?: number
  /** Optional indexes to create on the object store. */
  indexes?: ReadonlyArray<{
    name: string
    keyPath: string | string[]
    unique?: boolean
  }>
}

/**
 * Opens or creates an IndexedDB database with the specified configuration.
 * Creates the object store if it does not exist.
 * Supports adding indexes for efficient querying.
 *
 * @example
 * const db = await openDB({
 *   dbName: 'my-app',
 *   storeName: 'users',
 *   indexes: [{ name: 'email', keyPath: 'email', unique: true }]
 * })
 */
export async function openDB({ dbName, storeName, version = 1, indexes = [] }: OpenDBConfig): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(dbName, version)

    req.onupgradeneeded = () => {
      const db = req.result
      let objectStore: IDBObjectStore

      if (!db.objectStoreNames.contains(storeName)) {
        objectStore = db.createObjectStore(storeName, { keyPath: 'id' })
      } else {
        objectStore = req.transaction!.objectStore(storeName)
      }

      // Create indexes if they do not exist
      for (const index of indexes) {
        if (!objectStore.indexNames.contains(index.name)) {
          objectStore.createIndex(index.name, index.keyPath, {
            unique: index.unique ?? false,
          })
        }
      }
    }

    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('Failed to open database'))
  })
}

/**
 * Executes a function within a database transaction.
 * Automatically handles transaction lifecycle and error handling.
 *
 * This is a low-level utility. Most of the time you should use the higher-level
 * operations like getItem, setItem, etc.
 */
export async function withStore<T>(
  db: IDBDatabase,
  storeName: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, mode)
      const store = tx.objectStore(storeName)
      const req = fn(store)

      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error ?? new Error('Transaction failed'))
      tx.onerror = () => reject(tx.error ?? new Error('Transaction error'))
    } catch (error) {
      reject(error instanceof Error ? error : new Error('Unknown transaction error'))
    }
  })
}

/**
 * Stores an item in the database.
 * If an item with the same ID already exists, it will be replaced.
 *
 * @param db - The database instance
 * @param storeName - The name of the object store
 * @param id - The unique identifier for the item
 * @param data - The data to store (without the id field)
 * @param schema - Optional schema for validation before saving
 *
 * @example
 * await setItem(db, 'users', '123', { name: 'Alice', email: 'alice@example.com' })
 */
export async function setItem<T extends Record<string, unknown>>(
  db: IDBDatabase,
  storeName: string,
  id: string,
  data: T,
  schema?: TSchema,
): Promise<void> {
  const item = { id, ...data }

  // Validate against schema if provided
  if (schema) {
    const validationSchema = Type.Intersect([Type.Object({ id: Type.String() }), schema])
    try {
      coerceValue(validationSchema, item)
      await withStore(db, storeName, 'readwrite', (store) => store.put(item))
    } catch (error) {
      throw new Error(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

/**
 * Retrieves an item from the database by its ID.
 * Optionally validates the retrieved data against a schema.
 *
 * @param db - The database instance
 * @param storeName - The name of the object store
 * @param id - The unique identifier of the item to retrieve
 * @param schema - Optional schema for validation and type coercion
 * @returns The item if found, undefined otherwise
 *
 * @example
 * const user = await getItem(db, 'users', '123', UserSchema)
 */
export async function getItem<T extends TSchema>(
  db: IDBDatabase,
  storeName: string,
  id: string,
  schema?: T,
): Promise<(Static<T> & { id: string }) | undefined> {
  const item = await withStore(db, storeName, 'readonly', (store) => store.get(id))

  if (!item) {
    return undefined
  }

  if (schema) {
    const validationSchema = Type.Intersect([
      Type.Object({
        id: Type.String(),
      }),
      schema,
    ])
    return coerceValue(validationSchema, item) as Static<T> & { id: string }
  }

  // Without schema validation, we trust the data has the correct shape
  return item as unknown as Static<T> & { id: string }
}

/**
 * Retrieves all items from the object store.
 * Optionally validates each item against a schema.
 *
 * @param db - The database instance
 * @param storeName - The name of the object store
 * @param schema - Optional schema for validation and type coercion
 * @returns Array of all items in the store
 *
 * @example
 * const allUsers = await getAllItems(db, 'users', UserSchema)
 */
export async function getAllItems<T extends TSchema>(
  db: IDBDatabase,
  storeName: string,
  schema?: T,
): Promise<Array<Static<T> & { id: string }>> {
  const items = await withStore(db, storeName, 'readonly', (store) => store.getAll())

  if (!items || items.length === 0) {
    return []
  }

  if (schema) {
    const validationSchema = Type.Intersect([
      Type.Object({
        id: Type.String(),
      }),
      schema,
    ])
    return items.map((item) => coerceValue(validationSchema, item) as Static<T> & { id: string })
  }

  // Without schema validation, we trust the data has the correct shape
  return items as unknown as Array<Static<T> & { id: string }>
}

/**
 * Deletes an item from the database by its ID.
 *
 * @param db - The database instance
 * @param storeName - The name of the object store
 * @param id - The unique identifier of the item to delete
 *
 * @example
 * await deleteItem(db, 'users', '123')
 */
export async function deleteItem(db: IDBDatabase, storeName: string, id: string): Promise<void> {
  await withStore(db, storeName, 'readwrite', (store) => store.delete(id))
}

/**
 * Deletes all items from the object store.
 * Use with caution as this operation cannot be undone.
 *
 * @param db - The database instance
 * @param storeName - The name of the object store
 *
 * @example
 * await clearStore(db, 'users')
 */
export async function clearStore(db: IDBDatabase, storeName: string): Promise<void> {
  await withStore(db, storeName, 'readwrite', (store) => store.clear())
}

/**
 * Checks if an item exists in the database.
 *
 * @param db - The database instance
 * @param storeName - The name of the object store
 * @param id - The unique identifier to check
 * @returns true if the item exists, false otherwise
 *
 * @example
 * const exists = await hasItem(db, 'users', '123')
 */
export async function hasItem(db: IDBDatabase, storeName: string, id: string): Promise<boolean> {
  const key = await withStore(db, storeName, 'readonly', (store) => store.getKey(id))
  return key !== undefined
}

/**
 * Counts the total number of items in the object store.
 *
 * @param db - The database instance
 * @param storeName - The name of the object store
 * @returns The number of items in the store
 *
 * @example
 * const totalUsers = await countItems(db, 'users')
 */
export async function countItems(db: IDBDatabase, storeName: string): Promise<number> {
  return withStore(db, storeName, 'readonly', (store) => store.count())
}

/**
 * Closes the database connection.
 * Should be called when the database is no longer needed.
 *
 * @param db - The database instance to close
 *
 * @example
 * closeDB(db)
 */
export function closeDB(db: IDBDatabase): void {
  db.close()
}
