import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import { httpMethods } from '@/types'

/**
 * Takes a dereferenced OpenAPI document and returns all operations.
 * Keys use their wire capitalization: fixed methods are uppercase, additional methods retain their case.
 * Ignores other attributes, like summary, parameters, etc.
 */
export const getOperations = (
  path?: OpenAPIV3_1.PathItemObject & {
    additionalOperations?: Record<string, OpenAPIV3_1.OperationObject>
  },
): Record<string, OpenAPIV3_1.OperationObject> => {
  const operations = new Map<string, OpenAPIV3_1.OperationObject>()

  for (const method of httpMethods) {
    if (path?.[method]) {
      operations.set(method.toUpperCase(), path[method])
    }
  }

  for (const [method, operation] of Object.entries(path?.additionalOperations ?? {})) {
    operations.set(method, operation)
  }

  return Object.fromEntries(operations)
}
