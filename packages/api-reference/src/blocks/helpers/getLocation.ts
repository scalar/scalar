import { ERRORS } from '@/blocks/constants'
import { escapeJsonPointer } from '@scalar/openapi-parser'
import type { OpenAPI } from '@scalar/openapi-types'

// import type { OpenAPI } from '@scalar/openapi-types'

/**
 * OpenAPI paths that we support.
 *
 * @example
 * ['paths', '/planets/{foo}', 'get']
 * ['components', 'schemas', 'Planet]
 */
type ValidOpenApiPaths =
  | ['paths', string, Lowercase<OpenAPI.HttpMethod> | string]
  | ['components', 'schemas', string]

/**
 * Encodes a location string with paths
 *
 * @example
 * getPointer(['paths', '/planets/{foo}', 'get'])
 *
 * '#/paths/~1planets~1{foo}/get'
 */
export function getPointer(path: ValidOpenApiPaths) {
  path.unshift('#')

  const pointer = path
    .map((p) => escapeJsonPointer(p.trim()))
    .filter(Boolean)
    .join('/')

  if (pointer === '#') {
    throw new Error(ERRORS.EMPTY_PATH)
  }

  return pointer as `#/${string}`
}
