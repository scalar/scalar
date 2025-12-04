import type { Store } from '../libs/store'

/**
 * Public interface of the Store class (methods only, no private properties).
 */
type StoreInterface = Pick<Store, 'list' | 'get' | 'create' | 'update' | 'delete' | 'clear'>

/**
 * Represents a single store operation with its result.
 */
type StoreOperation = {
  /** The operation method name that was called. */
  operation: 'get' | 'create' | 'update' | 'delete' | 'list'
  /** The result of the operation. */
  result: any
}

/**
 * Tracks all store operations performed.
 */
export type StoreOperationTracking = {
  /** All operations performed, in order. */
  operations: StoreOperation[]
}

/**
 * Creates a wrapped store that tracks operations.
 * Returns both the wrapped store and a tracking object that gets updated as operations are performed.
 */
export function createStoreWrapper(store: Store): {
  wrappedStore: StoreInterface
  tracking: StoreOperationTracking
} {
  const tracking: StoreOperationTracking = {
    operations: [],
  }

  const wrappedStore = {
    list(collection: string) {
      const result = store.list(collection)
      tracking.operations.push({ operation: 'list', result })
      return result
    },

    get(collection: string, id: string) {
      const result = store.get(collection, id)
      tracking.operations.push({ operation: 'get', result })
      return result
    },

    create(collection: string, data: any) {
      const result = store.create(collection, data)
      tracking.operations.push({ operation: 'create', result })
      return result
    },

    update(collection: string, id: string, data: any) {
      const result = store.update(collection, id, data)
      tracking.operations.push({ operation: 'update', result })
      return result
    },

    delete(collection: string, id: string) {
      const result = store.delete(collection, id)
      tracking.operations.push({ operation: 'delete', result })
      return result
    },

    clear(collection?: string) {
      store.clear(collection)
      // clear() doesn't set tracking as it's not a typical CRUD operation
    },
  }

  return { wrappedStore, tracking }
}
