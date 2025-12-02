/**
 * Checks if the given string content is a Postman collection.
 *
 * Validates by checking for the `_postman_id` in the info object
 * and ensuring the schema URL's host matches 'schema.getpostman.com'.
 *
 * @param content - The JSON string which may be a Postman collection
 * @returns True if the content is a valid Postman collection
 */
export const isPostmanCollection = (content: string): boolean => {
  try {
    const parsed = JSON.parse(content)

    const hasPostmanId = parsed.info?._postman_id !== undefined
    const hasValidSchema = parsed.info?.schema && new URL(parsed.info.schema).host === 'schema.getpostman.com'

    return hasPostmanId && hasValidSchema
  } catch {
    return false
  }
}
