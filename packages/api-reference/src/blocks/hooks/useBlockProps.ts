import type { BlockProps } from '@/blocks/types'
import type { Request } from '@scalar/oas-utils/entities/spec'
import { unescapeJsonPointer } from '@scalar/openapi-parser'
import { type ComputedRef, computed } from 'vue'

/** TODO: Write comment */
export function useBlockProps(props: BlockProps): {
  operation: ComputedRef<Request | undefined>
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
      const specifiedMethod = props.location.split('/')[2]
      const specifiedPath = unescapeJsonPointer(props.location.split('/')[3])

      return (
        request.method === specifiedMethod && request.path === specifiedPath
      )
    })
  })

  return {
    operation,
  }
}
