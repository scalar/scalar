import type { OpenAPI, OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from '@scalar/openapi-types'

import { type HttpMethod, httpMethods } from '@/types'

/**
 * Takes a dereferenced OpenAPI document and returns all operations.
 * Ignores other attributes, like summary, parameters, etc.
 */
export function getOperations(
  path?: OpenAPIV2.PathItemObject | OpenAPIV3.PathItemObject | OpenAPIV3_1.PathItemObject,
): Record<HttpMethod, OpenAPI.Operation> {
  const operations = {} as Record<HttpMethod, OpenAPI.Operation>

  for (const method of httpMethods) {
    if (path?.[method]) {
      operations[method] = path?.[method]
    }
  }

  return operations
}
