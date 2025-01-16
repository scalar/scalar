import type { createWorkspaceStore } from '@scalar/api-client/store'
import type {
  Collection,
  Request as RequestEntity,
} from '@scalar/oas-utils/entities/spec'
import { unescapeJsonPointer } from '@scalar/openapi-parser'
import { type ComputedRef, computed } from 'vue'

// TODO: Move this type to a shared location
export type StoreContext = ReturnType<typeof createWorkspaceStore>

export type BlockProps = {
  /**
   * The store created by `createStore`
   */
  store: StoreContext | undefined
  /**
   * The JSON pointer to the operation to use
   *
   * @example
   * ```
   * #/paths/test/get
   * ```
   */
  location: `#/${string}`
  /**
   * The name of the collection to use
   *
   * @default 'default'
   */
  collection?: string
}

/**
 * Provides computed properties for the block, based on the standardized interface of the `createStore` function.
 */
export function useBlockProps({ store, location }: BlockProps): {
  operation: ComputedRef<RequestEntity | undefined>
} {
  // Just pick first collection for now
  const collection = computed(() => {
    return Object.values(store?.collections ?? {})[0]
  }) as ComputedRef<Collection | undefined>

  // TODO: Use the collection name from the props
  //   const collection = computed(() => {
  //     return Object.values(store.collections).find(
  //       ({ name }) => name === (collection ?? 'default'),
  //     )
  //   })

  /** Resolve the operation (request) from the store */
  const operation = computed<RequestEntity | undefined>(() => {
    if (!store?.collections || !store.requests) {
      return undefined
    }

    const collectionRequests = Object.values(store.requests).filter((request) =>
      collection.value?.requests.includes(request.uid),
    )

    // Check whether we’re using the correct location
    if (!location.startsWith('#/paths/')) {
      throw new Error(
        `Invalid location, try using #/paths/$YOUR_ENDPOINT/$HTTP_METHOD. You can use the getPointer helper to generate a valid location: getPointer(['paths', '/planets/{planetId}', 'get'])`,
      )
    }

    // Resolve the matching operation from the collection
    const result = collectionRequests.find((request) => {
      const specifiedPath = unescapeJsonPointer(location.split('/')[2])
      const specifiedMethod = location.split('/')[3].toLocaleLowerCase()

      return (
        request.method === specifiedMethod && request.path === specifiedPath
      )
    })

    return result
  })

  return {
    operation,
  }
}
