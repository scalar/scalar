import { normalizeMimeType } from './normalizeMimeType'
import type { ContentType } from './types'

/**
 * Remove charset from content types
 *
 * Example: `application/json; charset=utf-8` -> `application/json`
 */
export function normalizeMimeTypeObject(content?: Record<ContentType, any>) {
  if (!content) {
    return content
  }

  // Clone the object
  const newContent = {
    ...content,
  }

  Object.keys(newContent).forEach((key) => {
    // Example: 'application/problem+json; charset=utf-8'

    const newKey = normalizeMimeType(key)

    newContent[newKey] = newContent[key as ContentType]

    if (key !== newKey) {
      delete newContent[key as ContentType]
    }
  })

  return newContent
}
