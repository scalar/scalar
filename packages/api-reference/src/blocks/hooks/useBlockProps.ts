import type { BlockProps } from '@/blocks/types'
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
      // TODO: We could use proper helpers from the parser here.
      const specifiedMethod = props.location.split('/')[2]
      const specifiedPath = props.location.split('/')[3].replace(/~1/g, '/')

      return (
        request.method === specifiedMethod && request.path === specifiedPath
      )
    })
  })

  return {
    operation,
  }
}
