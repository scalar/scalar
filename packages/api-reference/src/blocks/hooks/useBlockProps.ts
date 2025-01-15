import { createRequestOperation } from '@scalar/api-client/libs'
import type { createWorkspaceStore } from '@scalar/api-client/store'
import type {
  Collection,
  Request as RequestEntity,
  Server,
} from '@scalar/oas-utils/entities/spec'
import { unescapeJsonPointer } from '@scalar/openapi-parser'
import type { ThemeId } from '@scalar/themes'
import { type ComputedRef, computed } from 'vue'

// TODO: Move this to a shared location
export type StoreContext = ReturnType<typeof createWorkspaceStore>

export type BlockProps = {
  /**
   * The store created by `createStore`
   */
  store: StoreContext
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
  schema: ComputedRef<any>
  collection: ComputedRef<Collection | undefined>
  server: ComputedRef<Server | undefined>
  operation: ComputedRef<RequestEntity | undefined>
  request: ComputedRef<Request | undefined>
  theme: ComputedRef<ThemeId>
} {
  // Just pick first collection for now
  const collection = computed(() => {
    return Object.values(props.store.collections)[0]
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

    // TODO: Fix this for pointers other than #/paths/path/get
    const result = collectionRequests.find((request) => {
      // TODO: This is not very reliable
      const specifiedPath = unescapeJsonPointer(props.location.split('/')[2])
      const specifiedMethod = props.location.split('/')[3].toLocaleLowerCase()

      return (
        request.method === specifiedMethod && request.path === specifiedPath
      )
    })

    // if (Object.values(collectionRequests).length > 0 && !result) {
    //   console.error(
    //     `No operation found for location ${props.location} in collection ${props.collection}.`,
    //   )
    //   console.table(
    //     Object.values(collectionRequests).map((r) => ({
    //       path: r.path,
    //       method: r.method,
    //       location: getLocation(['paths', r.path, r.method]),
    //     })),
    //   )
    // }

    return result
  })

  const server = computed(() => {
    return (
      props.store.servers[collection.value?.servers?.[0] ?? ''] ?? undefined
    )
  })

  // TODO: Make this dynamic
  const request = computed(() => {
    if (!operation.value) return undefined

    const firstExampleUid = operation.value.examples?.[0]
    const firstExample = props.store.requestExamples[firstExampleUid]

    if (!firstExample) return undefined

    const [_, requestOperation] = createRequestOperation({
      request: operation.value,
      example: firstExample,
      // TODO: Add environment
      environment: {},
      // TODO: Add cookies
      globalCookies: [],
      // TODO: Add securitySchemes
      securitySchemes: {},
      server: server.value,
    })

    return requestOperation?.request
  })

  const theme = computed(() => {
    return Object.values(props.store.workspaces)[0].themeId
  })

  const schema = computed(() => {
    const schemaName = props.location.split('/')[3]
    const schemas = collection.value?.components?.schemas ?? {}

    return typeof schemas === 'object' && schemaName in schemas
      ? schemas[schemaName as keyof typeof schemas]
      : undefined
  })

  return {
    schema,
    collection,
    server,
    operation,
    request,
    theme,
  }
}
