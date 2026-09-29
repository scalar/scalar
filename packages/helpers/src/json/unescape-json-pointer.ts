import { unescapeJsonPointerSegment } from './unescape-json-pointer-segment'

/**
 * Unescapes a JSON pointer and decodes URI-encoded values.
 * Use `unescapeJsonPointerSegment` for segments containing literal percent sequences.
 *
 * Examples:
 * /foo~1bar~0baz -> /foo/bar~baz
 */
export const unescapeJsonPointer = (uri: string): string => decodeURI(unescapeJsonPointerSegment(uri))
