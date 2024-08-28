/**
 * Escapes a JSON pointer string.
 *
 * Example: `/foo/bar~baz` -> `/foo~1bar~0baz`
 */
export function escapeJsonPointer(str: string) {
  return str.replace(/~/g, '~0').replace(/\//g, '~1')
}
