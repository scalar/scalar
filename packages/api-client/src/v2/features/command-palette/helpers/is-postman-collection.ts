/**
 * Checks if the given string content is a Postman collection.
 *
 * We primarily rely on the official Postman collection schema URL and the
 * collection item tree because exported collections are not guaranteed to
 * include `_postman_id`.
 *
 * @param content - The JSON string which may be a Postman collection
 * @returns True if the content is a valid Postman collection
 */
export const isPostmanCollection = (content: string): boolean => {
  try {
    const parsed = JSON.parse(content)

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return false
    }

    const hasPostmanId = parsed.info?._postman_id !== undefined
    const hasItemTree = Array.isArray(parsed.item)
    const schema = parsed.info?.schema
    const hasValidSchema = typeof schema === 'string' && new URL(schema).host === 'schema.getpostman.com'

    return hasValidSchema && (hasPostmanId || hasItemTree)
  } catch {
    return false
  }
}
