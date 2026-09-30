import type { ResponseObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

import { normalizeMimeType } from './normalize-mime-type'

/**
 * Normalize content type keys without mutating the source.
 * When keys normalize to the same value, the last entry wins.
 *
 * Example: `application/json; charset=utf-8` -> `application/json`
 */
export function normalizeMimeTypeObject(content?: ResponseObject['content']): ResponseObject['content'] {
  if (!content) {
    return content
  }

  return Object.fromEntries(Object.entries(content).map(([key, value]) => [normalizeMimeType(key) || key, value]))
}
