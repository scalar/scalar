/**
 * Checks if the given string content is a Postman collection.
 * It determines this by verifying the presence of `_postman_id` in the info object
 * and ensuring the schema URL's host matches 'schema.getpostman.com'.
 *
 * @param content - The JSON string which may be a Postman collection
 * @returns {boolean} True if the content is a valid Postman collection
 */
export function isPostmanCollection(content: string): boolean {
  try {
    const parsed = JSON.parse(content)
    const isPostman =
      parsed.info?._postman_id !== undefined && new URL(parsed.info?.schema).host === 'schema.getpostman.com'
    return isPostman
  } catch (_error) {
    return false
  }
}
