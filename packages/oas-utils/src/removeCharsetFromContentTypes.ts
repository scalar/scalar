import type { ContentType } from './types'

/**
 * Remove charset from content types
 *
 * Warning: This modifies the given object!
 *
 * Example: `application/json; charset=utf-8` -> `application/json`
 */
export function removeCharsetFromContentTypes(
  content?: Record<ContentType, any>,
) {
  if (!content) {
    return
  }

  Object.keys(content).forEach((key) => {
    const newKey = key.split(';')[0] as ContentType

    content[newKey] = content[key as ContentType]

    if (key !== newKey) {
      delete content[key as ContentType]
    }
  })
}
