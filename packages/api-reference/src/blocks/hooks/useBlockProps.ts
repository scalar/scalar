import type { StoreContext } from '@/blocks/lib/createStore'
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
  store: StoreContext
  location: string
  // TODO: Allow to pick a collection
}

/** TODO: Write comment */
export function useBlockProps(props: BlockProps): {
  collection: ComputedRef<Collection | undefined>
  server: ComputedRef<Server | undefined>
  operation: ComputedRef<RequestEntity | undefined>
  request: ComputedRef<Request | undefined>
  theme: ComputedRef<ThemeId>
} {
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
    )

    return collectionRequests.find((request) => {
      const specifiedMethod = props.location.split('/')[3]
      const specifiedPath = unescapeJsonPointer(props.location.split('/')[2])

      return (
        request.method === specifiedMethod && request.path === specifiedPath
      )
    })
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
    console.log('foo', firstExample)

    if (!firstExample) return undefined

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
