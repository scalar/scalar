import { parseJsonPointerSegments } from '@scalar/helpers/json/parse-json-pointer-segments'

import type { JsonPath } from './json-ast'

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

  return parseJsonPointerSegments(extracted)
}
