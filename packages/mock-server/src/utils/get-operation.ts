import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import { type HttpMethod, httpMethods } from '@/types'

/**
 * Takes a dereferenced OpenAPI document and returns all operations.
 * Ignores other attributes, like summary, parameters, etc.
 */
export function getOperations(path?: OpenAPIV3_1.PathItemObject): Record<HttpMethod, OpenAPIV3_1.OperationObject> {
  const operations = {} as Record<HttpMethod, OpenAPIV3_1.OperationObject>

  for (const method of httpMethods) {
    if (path?.[method]) {
      operations[method] = path?.[method]
    }
  }

  return operations
}
