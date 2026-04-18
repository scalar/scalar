/**
 * Checks whether a JSON string looks like a Postman collection.
 *
 * Exported collections are not guaranteed to include `_postman_id`,
 * so we accept either `_postman_id` or a top-level `item` array,
 * as long as the schema host matches Postman.
 */
export const isPostmanCollection = (content: string): boolean => {
  try {
    const parsed = JSON.parse(content)

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return false
    }

    const hasPostmanId = (parsed as { info?: { _postman_id?: unknown } }).info?._postman_id !== undefined
    const hasItemTree = Array.isArray((parsed as { item?: unknown }).item)
    const schema = (parsed as { info?: { schema?: unknown } }).info?.schema
    const hasValidSchema = typeof schema === 'string' && new URL(schema).host === 'schema.getpostman.com'

    return hasValidSchema && (hasPostmanId || hasItemTree)
  } catch {
    return false
  }
}
