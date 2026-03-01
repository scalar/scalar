/**
 * Escapes a JSON pointer string.
 *
 * Example: `/foo/bar~baz` -> `~1foo~1bar~0baz`
 */
export const escapeJsonPointer = (str: string): string => str.replace(/~/g, '~0').replace(/\//g, '~1')
