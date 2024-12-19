<<<<<<< HEAD
import type { createWorkspaceStore } from '@scalar/api-client/store'
import type {
  Collection,
  Request as RequestEntity,
=======
import type { StoreContext } from '@/blocks/lib/createStore'
import { createRequestOperation } from '@scalar/api-client/libs'
import type {
  Collection,
  Request as RequestEntity,
  Server,
>>>>>>> d7e7efe45 (feat: make code example request dynamic)
} from '@scalar/oas-utils/entities/spec'
import { unescapeJsonPointer } from '@scalar/openapi-parser'
import type { ThemeId } from '@scalar/themes'
import { type ComputedRef, computed } from 'vue'

// TODO: Move this type to a shared location
export type StoreContext = ReturnType<typeof createWorkspaceStore>

export type BlockProps = {
<<<<<<< HEAD
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
=======
  store: StoreContext
  location: `#/paths/${string}/${string}`
  // TODO: Allow to pick a collection
}

/** TODO: Write comment */
export function useBlockProps(props: BlockProps): {
  collection: ComputedRef<Collection | undefined>
  server: ComputedRef<Server | undefined>
  operation: ComputedRef<RequestEntity | undefined>
  request: ComputedRef<Request | undefined>
>>>>>>> d7e7efe45 (feat: make code example request dynamic)
  theme: ComputedRef<ThemeId>
} {
<<<<<<< HEAD
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
=======
  // TODO: Use optional collection prop to determine which operation to display
  const collection = computed(() => {
    return Object.values(props.store.collections)[0]
  })

  const operation = computed<RequestEntity | undefined>(() => {
    if (!props.store?.collections || !props.store.requests) {
      return undefined
    }

    const collectionRequests = Object.values(props.store.requests).filter(
      (request) => collection.value.requests.includes(request.uid),
>>>>>>> d7e7efe45 (feat: make code example request dynamic)
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

  const theme = computed(() => {
    return Object.values(props.store.workspaces)[0].themeId
  })

  const server = computed(() => {
    return props.store.servers[collection.value.servers[0]]
  })

  // TODO: Make this dynamic
  const request = computed(() => {
    if (!operation.value) return undefined

    const firstExampleUid = operation.value.examples?.[0]
    const firstExample = props.store.requestExamples[firstExampleUid]

    if (!firstExample) return undefined

    // TODO: Error handling
    const [error, requestOperation] = createRequestOperation({
      request: operation.value,
      example: firstExample,
      environment: {},
      globalCookies: [],
      securitySchemes: {}, // Add required securitySchemes property
      server: server.value,
    })

    return requestOperation?.request
  })

  return {
    collection,
    server,
    operation,
    request,
    theme,
  }
}
