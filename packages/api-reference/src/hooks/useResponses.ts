import type { TransformedOperation } from '@scalar/oas-utils'
import { computed } from 'vue'

/**
 * This hook is used to generate the responses for the request from the parameters in the swagger file
 */
export function useResponses(operation: TransformedOperation) {
  const r = computed(() => {
    if (!operation.information) return []

    const { responses } = operation.information

    const res: { name: string; description: string }[] = []

    if (responses) {
      Object.keys(responses).forEach((statusCode: string) => {
        res.push({
          name: statusCode,
          description: responses[statusCode].description,
        })
      })
    }

    return res
  })

  return { responses: r }
}
