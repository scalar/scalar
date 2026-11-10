import { unescapeJsonPointerSegment } from '@scalar/helpers/json/unescape-json-pointer-segment'

/** Split a JSON Pointer into property names. Decode URI fragments before passing them here. */
export const parseJsonPointer = (pointer: string): string[] =>
  pointer.split('/').slice(1).map(unescapeJsonPointerSegment)
