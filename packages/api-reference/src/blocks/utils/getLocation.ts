import { ERRORS } from '@/blocks/constants'
import { escapeJsonPointer } from '@scalar/openapi-parser'

/**
 * Encodes a location string with paths
 *
 * @example
 * getLocation(['paths', 'get', '/planets/{foo}'])
 *
 * '#/paths/~1planets~1{foo}/get'
 */
export function getLocation(path: string[]) {
  return [
    '#',
    ...path
      .map((p) => p.trim())
      .filter(Boolean)
      .map(escapeJsonPointer),
  ].join('/') as `#/${string}`
}
