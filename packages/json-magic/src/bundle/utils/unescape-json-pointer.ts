/**
 * Unescape JSON pointer
 *
 * Examples:
 * /foo~1bar~0baz -> /foo/bar~baz
 */
export function unescapeJsonPointer(uri: string) {
  return decodeURI(uri.replace(/~1/g, '/').replace(/~0/g, '~'))
}
