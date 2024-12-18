/**
 * Encodes a location string with paths
 *
 * @example
 * getLocation('GET', '/planets/1')
 *
 * '#/paths/get/~1planets~1{foo}'
 */
export function getLocation(method: string, path: string): `#/paths/${string}` {
  // TODO: We could use proper helpers from the parser here.

  const encodedPath = path.replace(/\//g, '~1')

  return `#/paths/${method.toLowerCase()}/${encodedPath}`
}
