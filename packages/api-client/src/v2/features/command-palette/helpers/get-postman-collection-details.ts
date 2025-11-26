import { isPostmanCollection } from '@/v2/features/command-palette/helpers/is-postman-collection'

/**
 * Extracts document details from a Postman collection JSON string.
 * Returns an object with type, title, and version if it's a valid Postman collection,
 * otherwise returns null.
 *
 * @param content - The JSON string representing the Postman collection
 * @returns {object|null} An object with type, title, and version or null if invalid
 */
export function getPostmanDocumentDetails(content: string): {
  type: string
  title: string
  version: string
} | null {
  try {
    if (isPostmanCollection(content)) {
      const parsed = JSON.parse(content)
      return {
        type: 'json',
        title: parsed.info?.name || 'Postman Collection',
        version: parsed.info?.version || '1.0',
      }
    }
    return null
  } catch {
    return null
  }
}
