import { escapeJsonPointer } from '@scalar/openapi-parser'

/**
 * Encodes a location string with paths
 *
 * @example
 * getLocation('GET', '/planets/1')
 *
 * '#/paths/get/~1planets~1{foo}'
 */
export function getLocation(method: string, path: string): `#/paths/${string}` {
  const escapedJsonPath = escapeJsonPointer(path)

  return `#/paths/${method.toLowerCase()}/${escapedJsonPath}`
}
