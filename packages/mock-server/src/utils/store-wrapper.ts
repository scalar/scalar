import type { Store } from '../libs/store'

/**
 * Public interface of the Store class (methods only, no private properties).
 */
export type StoreInterface = Pick<Store, 'list' | 'get' | 'create' | 'update' | 'delete' | 'clear'>

/**
 * Tracks the last store operation performed.
 */
export type StoreOperationTracking = {
  /** The last operation method name that was called. */
  lastOperation: 'get' | 'create' | 'update' | 'delete' | 'list' | null
  /** The result of the last operation. */
  lastResult: any
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
    lastOperation: null,
    lastResult: undefined,
  }

  const wrappedStore = {
    list(collection: string) {
      const result = store.list(collection)
      tracking.lastOperation = 'list'
      tracking.lastResult = result
      return result
    },

    get(collection: string, id: string) {
      const result = store.get(collection, id)
      tracking.lastOperation = 'get'
      tracking.lastResult = result
      return result
    },

    create(collection: string, data: any) {
      const result = store.create(collection, data)
      tracking.lastOperation = 'create'
      tracking.lastResult = result
      return result
    },

    update(collection: string, id: string, data: any) {
      const result = store.update(collection, id, data)
      tracking.lastOperation = 'update'
      tracking.lastResult = result
      return result
    },

    delete(collection: string, id: string) {
      const result = store.delete(collection, id)
      tracking.lastOperation = 'delete'
      tracking.lastResult = result
      return result
    },

    clear(collection?: string) {
      store.clear(collection)
      // clear() doesn't set tracking as it's not a typical CRUD operation
    },
  }

  return { wrappedStore, tracking }
}
