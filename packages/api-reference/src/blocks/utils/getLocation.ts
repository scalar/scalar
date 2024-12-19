import { ERRORS } from '@/blocks/constants'
import { escapeJsonPointer } from '@scalar/openapi-parser'
import type { OpenAPI } from '@scalar/openapi-types'

/**
 * Encodes a location string with paths
 *
 * @example
 * getLocation('GET', '/planets/1')
 *
 * '#/paths/get/~1planets~1{foo}'
 */
export function getLocation(
  method: Lowercase<OpenAPI.HttpMethods> | Uppercase<OpenAPI.HttpMethods>,
  path: string,
): `#/paths/${string}/${string}` {
  if (!path.trim()) {
    throw new Error(ERRORS.EMPTY_PATH)
  }

  const escapedJsonPath = escapeJsonPointer(path)

  return `#/paths/${escapedJsonPath}/${method.toLowerCase()}`
}
