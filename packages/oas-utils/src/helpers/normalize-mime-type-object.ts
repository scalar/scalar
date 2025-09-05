import type { ResponseObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
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

  const newContent: ResponseObject['content'] = {
    ...content,
  }

  Object.entries(newContent).forEach(([key, value]) => {
    const normalizedKey = normalizeMimeType(key)
    if (normalizedKey) {
      newContent[normalizedKey] = value
    }
  })

  return newContent
}
