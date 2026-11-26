import { unescapeJsonPointerSegment } from '@scalar/helpers/json/unescape-json-pointer-segment'

/** Decode a previously validated non-root JSON Pointer into literal property keys. */
export const pointerSegments = (pointer: string): string[] =>
  pointer === '' ? [] : pointer.slice(1).split('/').map(unescapeJsonPointerSegment)

/** Look up own properties only, returning undefined when a target does not exist. */
export const pointerValue = (value: unknown, segments: readonly string[]): unknown => {
  if (!segments.length) {
    return value
  }
  const [key, ...rest] = segments
  if (key === undefined || value === null || typeof value !== 'object' || !Object.hasOwn(value, key)) {
    return undefined
  }
  return pointerValue((value as Record<string, unknown>)[key], rest)
}
