import type { ResponseObject } from '@scalar/workspace-store/schemas/v3.1/strict/response'
import { normalizeMimeType } from './normalize-mime-type'

/**
 * Remove charset from content types
 *
 * Example: `application/json; charset=utf-8` -> `application/json`
 */
export function normalizeMimeTypeObject(content?: ResponseObject['content']): ResponseObject['content'] {
  if (!content) {
    return content
  }

  // Clone the object
  const newContent: ResponseObject['content'] = {}

  Object.entries(newContent).forEach(([key, value]) => {
    newContent[normalizeMimeType(key)] = value
  })

  return newContent
}
