import type { OpenAPI, OpenAPIV3_1 } from '@scalar/openapi-types'
import type { RequestBodyMimeTypes, TransformedOperation } from '@scalar/types/legacy'
import { computed } from 'vue'

/**
 * Generates the responses for the request from the parameters in the OpenAPI document
 */
export function useResponses(operation: TransformedOperation) {
  const r = computed(() => {
    if (!operation.information) {
      return []
    }

    const { responses } = operation.information

    const res: {
      name: string
      description: string
      content: RequestBodyMimeTypes
      headers?: { [key: string]: OpenAPI.HeaderObject }
      schema?: OpenAPI.SchemaObject
    }[] = []

    if (!responses) {
      return res
    }

    Object.entries(responses).forEach(([statusCode, response]: [string, OpenAPIV3_1.ResponseObject]) => {
      res.push({
        name: statusCode,
        description: response.description ?? '',
        content: response.content ?? {},
        headers: response.headers,
        schema: response.content?.schema,
      })
    })

    return res
  })

  return { responses: r }
}
