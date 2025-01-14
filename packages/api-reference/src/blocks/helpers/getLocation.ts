import { ERRORS } from '@/blocks/constants'
import { escapeJsonPointer } from '@scalar/openapi-parser'

// import type { OpenAPI } from '@scalar/openapi-types'

/**
 * OpenAPI paths that we support.
 *
 * @example
 * ['paths', '/planets/{foo}', 'get']
 * ['components', 'schemas', 'Planet]
 */
type ValidOpenApiPaths =
  // TODO: Add this
  // | ['paths', string, OpenAPI.HttpMethods | Uppercase<OpenAPI.HttpMethods>]
  // TODO: Instead of this:
  ['paths', string, string] | ['components', 'schemas', string]

/**
 * Encodes a location string with paths
 *
 * @example
 * getLocation(['paths', '/planets/{foo}', 'get'])
 *
 * '#/paths/~1planets~1{foo}/get'
 */
export function getLocation(path: ValidOpenApiPaths) {
  const pointer = [
    '#',
    ...path
      .map((p) => p.trim())
      .filter(Boolean)
      .map(escapeJsonPointer),
  ].join('/')

  if (pointer === '#') {
    throw new Error(ERRORS.EMPTY_PATH)
  }

  return pointer as `#/${string}`
}
