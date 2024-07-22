import type { OpenAPI } from '@scalar/openapi-parser'

import { type HttpMethod, httpMethods } from '../types'

/**
 * Takes a dereferenced OpenAPI document and returns all operations.
 * Ignores other attributes, like summary, parameters, etc.
 */
export function getOperations(
  path?: any,
): Record<HttpMethod, OpenAPI.Operation> {
  const operations = {} as Record<HttpMethod, OpenAPI.Operation>

  for (const method of httpMethods) {
    if (path?.[method]) {
      operations[method] = path?.[method]
    }
  }

  return operations
}
