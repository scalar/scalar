import type { createWorkspaceStore } from '@scalar/api-client/store'
import type {
  Collection,
  Request as RequestEntity,
} from '@scalar/oas-utils/entities/spec'
import { unescapeJsonPointer } from '@scalar/openapi-parser'
import { type ComputedRef, computed } from 'vue'

// TODO: Move this to a shared location
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
export function useBlockProps(props: BlockProps): {
  operation: ComputedRef<RequestEntity | undefined>
} {
  // Just pick first collection for now
  const collection = computed(() => {
    return Object.values(props.store?.collections ?? {})[0]
  }) as ComputedRef<Collection | undefined>

  // TODO: Use the collection name from the props
  //   const collection = computed(() => {
  //     return Object.values(props.store.collections).find(
  //       ({ name }) => name === (props.collection ?? 'default'),
  //     )
  //   })

  const operation = computed<RequestEntity | undefined>(() => {
    if (!props.store?.collections || !props.store.requests) {
      return undefined
    }

    const collectionRequests = Object.values(props.store.requests).filter(
      (request) => collection.value?.requests.includes(request.uid),
    )

    // Check whether we’re using the correct location
    if (!props.location.startsWith('#/paths/')) {
      throw new Error(
        'Invalid location, try using #/paths/$YOUR_ENDPOINT/$HTTP_METHOD',
      )
    }

    // Resolve the matching operation from the collection
    const result = collectionRequests.find((request) => {
      const specifiedPath = unescapeJsonPointer(props.location.split('/')[2])
      const specifiedMethod = props.location.split('/')[3].toLocaleLowerCase()

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
