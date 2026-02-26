import type { JsonPath } from './json-path'

const decodeJsonPointerSegment = (segment: string): string => {
  // RFC 6901: ~1 => /, ~0 => ~
  return segment.replace(/~1/g, '/').replace(/~0/g, '~')
}

const extractPointer = (input: string): string | null => {
  const trimmed = input.trim()

  // Pure RFC6901 pointers
  if (trimmed.startsWith('/')) {
    return trimmed
  }

  // URI fragments like "#/paths/..."
  if (trimmed.startsWith('#')) {
    const fragment = trimmed.slice(1)
    return fragment.startsWith('/') ? fragment : null
  }

  // URIs with fragments like "file.json#/paths/..."
  const hashIndex = trimmed.indexOf('#')
  if (hashIndex === -1) {
    return null
  }

  const fragment = trimmed.slice(hashIndex + 1)
  return fragment.startsWith('/') ? fragment : null
}

/**
 * Parses a JSON Pointer (RFC 6901) and returns a "JSON path" compatible with this editor.
 * Supports raw pointers ("/paths/...") and URI fragments ("#/paths/...").
 */
export const parseJsonPointerPath = (pointer: string): JsonPath | null => {
  const extracted = extractPointer(pointer)
  if (!extracted) {
    return null
  }

  return extracted.split('/').slice(1).map(decodeJsonPointerSegment)
}
