import type { BlockProps } from '@/blocks/types'
import { unescapeJsonPointer } from '@scalar/openapi-parser'
import { computed } from 'vue'

/** TODO: Write comment */
export function useBlockProps(props: BlockProps) {
  const operation = computed(() => {
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
