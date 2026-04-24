import type { Static, TObject, TRecord } from '@scalar/typebox'

/**
 * Declarative shape for a table at its CURRENT (latest) version.
 *
 * This is used purely for TypeScript typing and runtime key serialization in
 * the wrapper API returned by `get(name)`. IndexedDB schema (object stores,
 * keyPaths, indexes) is NOT derived from this config — every schema change is
 * expressed in a migration. That keeps fresh installs and upgraded installs on
 * exactly the same code path and makes the TypeScript types safe to evolve
 * without accidentally reshaping the underlying database.
 */
type TableEntry<S extends TObject, K extends readonly (keyof Static<S>)[]> = {
  schema: S
  keyPath: K
}

/**
 * Context passed to every migration. The upgrade `transaction` lives for as
 * long as any IDB request on it is pending, so migrations may schedule async
 * cursor / getAll work and still mutate the same transaction afterwards.
 */
export type MigrationContext = {
  db: IDBDatabase
  transaction: IDBTransaction
  oldVersion: number
  newVersion: number
}

/**
 * A single, atomic schema (and/or data) change.
 *
 * Every structural change to the database — creating an object store, adding
 * or removing an index, renaming a field, re-keying records — lives inside a
 * migration. Fresh installs run the full chain from v1 up; existing installs
 * run only the migrations whose position is past their current version.
 *
 * The version of a migration is its 1-based position in the `migrations`
 * array passed to `createIndexDbConnection` — there is no `version` field to
 * keep in sync. Append to the end to add a new migration; never reorder or
 * insert in the middle (each position represents a real schema state that
 * shipped to users).
 */
export type Migration = {
  /** Short human-readable summary surfaced in errors / logs. */
  description?: string
  /** Runs synchronously inside the upgrade transaction. */
  up: (context: MigrationContext) => void
}

/**
 * Initializes and manages an IndexedDB database connection for table-based persistence.
 *
 * The database version is derived from `migrations.length`, so callers cannot
 * accidentally drift between the declared version and the migrations that
 * define it. Every structural change — including the initial schema — must
 * be expressed as a migration; append new ones to the end of the array.
 *
 * Example:
 * ```ts
 * const connection = await createIndexDbConnection({
 *   name: 'my-app-db',
 *   tables: {
 *     users: { schema: UserSchema, keyPath: ['id'] as const },
 *   },
 *   migrations: [
 *     {
 *       description: 'Initial schema',
 *       up: ({ db }) => {
 *         if (!db.objectStoreNames.contains('users')) {
 *           db.createObjectStore('users', { keyPath: 'id' })
 *         }
 *       },
 *     },
 *   ],
 * })
 * ```
 */
export const createIndexDbConnection = async <T extends Record<string, TableEntry<any, readonly (keyof any)[]>>>({
  name = 'scalar-workspace-store',
  tables,
  migrations,
}: {
  name: string
  tables: T
  migrations: readonly Migration[]
}) => {
  if (migrations.length === 0) {
    throw new Error(
      `createIndexDbConnection("${name}"): at least one migration is required. The initial schema must be defined as the first migration.`,
    )
  }

  // The 1-based array position is the schema version. `migrations[0]` is v1,
  // `migrations[1]` is v2, and so on. The latest version is just the length.
  const latestVersion = migrations.length

  const request = indexedDB.open(name, latestVersion)

  request.onupgradeneeded = (event) => {
    const transaction = request.transaction
    if (!transaction) {
      // IDB always provides the upgrade transaction here; this is a guard for
      // exotic environments and keeps types honest.
      return
    }

    const context: MigrationContext = {
      db: request.result,
      transaction,
      oldVersion: event.oldVersion,
      newVersion: event.newVersion ?? latestVersion,
    }

    for (const [index, migration] of migrations.entries()) {
      const version = index + 1
      if (version <= event.oldVersion) {
        continue
      }
      try {
        migration.up(context)
      } catch (error) {
        // Abort the upgrade transaction so we do not leave the DB in a half-
        // migrated state. Re-throw so `onerror` / the `open` Promise reject.
        transaction.abort()
        const label = migration.description ? `v${version} (${migration.description})` : `v${version}`
        throw new Error(`Migration ${label} failed: ${(error as Error)?.message ?? error}`, { cause: error })
      }
    }
  }

  await new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(true)
    request.onerror = () => reject(request.error)
    // If another tab holds an older-version connection open we would otherwise
    // hang forever waiting for the upgrade. Surface it as a clear rejection so
    // the app can react (reload, notify the user, ...) instead of freezing.
    request.onblocked = () =>
      reject(
        new Error(
          `IndexedDB upgrade for "${name}" is blocked by another open connection. Close other tabs and try again.`,
        ),
      )
  })

  return {
    get: <Name extends keyof T>(name: Name) => {
      // Surface a helpful error if a caller asks for a table that is not in
      // the typed config — the underlying IDB call would otherwise throw a
      // generic `NotFoundError` from a lazy `transaction()`.
      if (!Object.hasOwn(tables, name as string)) {
        throw new Error(`Unknown table "${String(name)}". Add it to the \`tables\` config of "${name as string}".`)
      }
      return createTableWrapper<T[Name]['schema'], T[Name]['keyPath'][number]>(name as string, request.result)
    },
    closeDatabase: () => {
      request.result.close()
    },
  }
}

/**
 * Utility wrapper for interacting with an IndexedDB object store, typed by the schema.
 *
 * @template T TypeBox schema type for objects in the store
 * @template K Key property names that compose the primary key
 */
function createTableWrapper<T extends TRecord | TObject, const K extends keyof Static<T>>(
  name: string,
  db: IDBDatabase,
) {
  /**
   * Gets the object store from the latest DB connection, for the given transaction mode.
   */
  const getStore = (mode: IDBTransactionMode): IDBObjectStore => {
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
    const store = getStore('readwrite')
    const finalValue = { ...value, ...key }
    await requestAsPromise(store.put(finalValue))

    return finalValue
  }

  /**
   * Retrieves a single item by composite key.
   * @param key - Key values. For a single key: { id: '...' }
   * @returns The found object or undefined
   */
  function getItem(key: Record<K, IDBValidKey>): Promise<Static<T> | undefined> {
    const store = getStore('readonly')
    const keyValues = Object.values(key)
    // For single keys, pass value directly; for compound keys, pass array
    const keyToUse = keyValues.length === 1 ? keyValues[0] : keyValues
    return requestAsPromise(store.get(keyToUse as IDBValidKey))
  }

  /**
   * Returns all records matching a partial (prefix) key. Use for composite keys.
   * For non-compound keys, pass single-element array: getRange(['some-id'])
   * For prefix search, pass subset of key parts.
   */
  function getRange(partialKey: IDBValidKey[], indexName?: string): Promise<Static<T>[]> {
    const store = getStore('readonly')
    const objectStoreOrIndex = indexName ? store.index(indexName as string) : store

    const results: Static<T>[] = []

    // Construct upper bound to match all keys starting with partialKey
    const upperBound = [...partialKey]
    upperBound.push([]) // ensures upper bound includes all keys with this prefix
    const range = IDBKeyRange.bound(partialKey, upperBound, false, true)

    return new Promise((resolve, reject) => {
      const req = objectStoreOrIndex.openCursor(range)
      req.onerror = () => reject(req.error)
      req.onsuccess = (event) => {
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
   */
  async function deleteItem(key: Record<K, IDBValidKey>): Promise<void> {
    const store = getStore('readwrite')
    const keyValues = Object.values(key)
    // For single keys, pass value directly; for compound keys, pass array
    const keyToUse = keyValues.length === 1 ? keyValues[0] : keyValues
    await requestAsPromise(store.delete(keyToUse as IDBValidKey))
  }

  /**
   * Deletes all records matching a partial (prefix) key. Use for composite keys.
   */
  function deleteRange(partialKey: IDBValidKey[]): Promise<number> {
    const store = getStore('readwrite')
    let deletedCount = 0

    // Construct upper bound to match all keys starting with partialKey
    const upperBound = [...partialKey]
    upperBound.push([]) // ensures upper bound includes all keys with this prefix
    const range = IDBKeyRange.bound(partialKey, upperBound, false, true)

    return new Promise((resolve, reject) => {
      const req = store.openCursor(range)
      req.onerror = () => reject(req.error)
      req.onsuccess = (event) => {
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
   * Deletes all items from the table.
   */
  async function deleteAll(): Promise<void> {
    const store = getStore('readwrite')
    await requestAsPromise(store.clear())
  }

  /**
   * Retrieves all items from the table.
   */
  function getAll(): Promise<Static<T>[]> {
    const store = getStore('readonly')
    return requestAsPromise(store.getAll())
  }

  return {
    addItem,
    getItem,
    getRange,
    deleteItem,
    deleteRange,
    getAll,
    deleteAll,
  }
}

function requestAsPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}
