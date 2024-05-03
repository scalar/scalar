import type { ContentType } from './types'

/**
 * Remove charset from content types
 *
 * Warning: This modifies the given object!
 *
 * Example: `application/json; charset=utf-8` -> `application/json`
 */
export function normalizeMimeTypeObject(content?: Record<ContentType, any>) {
  if (!content) {
    return
  }

  Object.keys(content).forEach((key) => {
    // Example: 'application/problem+json; charset=utf-8'

    const newKey = key
      // Remove '; charset=utf-8'
      .replace(/;.*$/, '')
      // Remove 'problem+'
      .replace(/\/.+\+/, '/')
      // Remove whitespace
      .trim() as ContentType

    content[newKey] = content[key as ContentType]

    if (key !== newKey) {
      delete content[key as ContentType]
    }
  })
}
