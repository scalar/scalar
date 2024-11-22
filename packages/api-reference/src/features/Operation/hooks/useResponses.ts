import type { OpenAPI } from '@scalar/openapi-types'
import type {
  RequestBodyMimeTypes,
  TransformedOperation,
} from '@scalar/types/legacy'
import { computed } from 'vue'

/**
 * Generates the responses for the request from the parameters in the OpenAPI document
 */
export function useResponses(operation: TransformedOperation) {
  const r = computed(() => {
    if (!operation.information) return []

    const { responses } = operation.information

    const res: {
      name: string
      description: string
      content: RequestBodyMimeTypes
      headers?: { [key: string]: OpenAPI.HeaderObject }
    }[] = []

    if (!responses) return res

    Object.entries(responses).forEach(([statusCode, response]) => {
      res.push({
        name: statusCode,
        description: response.description,
        content: response.content,
        headers: response.headers,
      })
    })

    return res
  })

  return { responses: r }
}
