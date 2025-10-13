import { escapeJsonPointer } from '@scalar/json-magic/helpers/escape-json-pointer'
import type { OpenAPI } from '@scalar/openapi-types'

import { ERRORS } from '@/blocks/constants'

/**
 * Pass an array of strings to get a valid OpenAPI pointer.
 *
 * Works with any path, but is typed to allow the paths that we support.
 *
 * @example
 * ['paths', '/planets/{foo}', 'get'] > '#/paths/~1planets~1{foo}/get'
 * ['components', 'schemas', 'Planet] > '#/components/schemas/Planet'
 */
type ValidOpenApiPaths = ['paths' | 'webhooks', string, OpenAPI.HttpMethod | string] | ['components', 'schemas', string]

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
