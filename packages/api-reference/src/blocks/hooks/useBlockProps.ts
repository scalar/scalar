import type { StoreContext } from '@/blocks/lib/createStore'
import type { Request } from '@scalar/oas-utils/entities/spec'
import { unescapeJsonPointer } from '@scalar/openapi-parser'
import type { ThemeId } from '@scalar/themes'
import { type ComputedRef, computed } from 'vue'

export type BlockProps = {
  store: StoreContext
  location: string
  // TODO: Allow to pick a collection
  // TODO: Add collection prop
}

/** TODO: Write comment */
export function useBlockProps(props: BlockProps): {
  operation: ComputedRef<Request | undefined>
  theme: ComputedRef<ThemeId>
  serverUrl: ComputedRef<string | undefined>
} {
  const operation = computed<Request | undefined>(() => {
    if (!props.store?.collections || !props.store.requests) {
      return undefined
    }

    // TODO: Use optional collection prop to determine which operation to display
    const firstCollection = Object.values(props.store.collections)[0]

    const collectionRequests = Object.values(props.store.requests).filter(
      (request) => firstCollection.requests.includes(request.uid),
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

  const serverUrl = computed(() => {
    const firstCollection = Object.values(props.store.collections)[0]
    const firstServer = props.store.servers[firstCollection.servers[0]]

    return firstServer?.url
  })

  return {
    operation,
    theme,
    serverUrl,
  }
}
