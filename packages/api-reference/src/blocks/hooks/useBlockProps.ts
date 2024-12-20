import type { StoreContext } from '@/blocks/lib/createStore'
import { getLocation } from '@/blocks/utils/getLocation'
import { createRequestOperation } from '@scalar/api-client/libs'
import type {
  Collection,
  Request as RequestEntity,
  Server,
} from '@scalar/oas-utils/entities/spec'
import { unescapeJsonPointer } from '@scalar/openapi-parser'
import type { ThemeId } from '@scalar/themes'
import { type ComputedRef, computed } from 'vue'

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
   */
  collection?: string
}

/** TODO: Write comment */
export function useBlockProps(props: BlockProps): {
  schema: ComputedRef<any>
  collection: ComputedRef<Collection | undefined>
  server: ComputedRef<Server | undefined>
  operation: ComputedRef<RequestEntity | undefined>
  request: ComputedRef<Request | undefined>
  theme: ComputedRef<ThemeId>
} {
  // TODO: Use optional collection prop to determine which operation to display
  const collection = computed(() => {
    return Object.values(props.store.collections).find(
      ({ name }) => name === props.collection ?? 'default',
    )
  })

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
      const specifiedMethod = props.location.split('/')[3]

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

  const theme = computed(() => {
    return Object.values(props.store.workspaces)[0].themeId
  })

  const schema = computed(() => {
    // TODO: This is not very reliable
    const schemaName = props.location.split('/')[3]

    // @ts-expect-error TODO: Fix this
    return collection.value?.components?.schemas?.[schemaName]
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
