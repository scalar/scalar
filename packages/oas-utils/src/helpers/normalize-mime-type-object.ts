import type { ContentType } from '@scalar/types/legacy'

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
  const newContent = {
    ...content,
  }

  Object.keys(newContent).forEach((key) => {
    // Input: 'application/problem+json; charset=utf-8'
    // Output: 'application/json'
    const newKey = normalizeMimeType(key)

    // We need a new key to replace the old one
    if (newKey === undefined) {
      return
    }

    // Move the content
    newContent[newKey] = newContent[key as ContentType]

    // Remove the old key
    if (key !== newKey) {
      delete newContent[key as ContentType]
    }
  })

  return newContent
}
