import type { TraversedDocument, TraversedEntry, TraversedOperation, TraversedWebhook } from '@/schemas/navigation'

/**
 * Builds a map of all operations and webhooks in a document, indexed by path/name and method.
 *
 * This function recursively traverses the document structure and collects all operation and webhook
 * entries. Multiple entries can share the same path|method key (for example, when operations are
 * duplicated across different tags or groups).
 *
 * Performance note: If this function is called frequently, consider generating this map once when
 * creating the sidebar state rather than recalculating it in mutators.
 *
 * @param document - The traversed OpenAPI document to extract operations from
 * @returns A map where keys are `path|method` (for operations) or `name|method` (for webhooks),
 *          and values are arrays of matching entries. The pipe separator is used to create a
 *          unique composite key from the two parts.
 *
 * @example
 * const entries = getOperationEntries(document)
 * const getUsers = entries.get('/users|get') // Array of all GET /users operations
 */
export const getOperationEntries = (
  document: TraversedDocument,
): Map<string, (TraversedOperation | TraversedWebhook)[]> => {
  const map = new Map<string, (TraversedOperation | TraversedWebhook)[]>()

  /**
   * Helper function to add an entry to the map under the specified key.
   * If the key already exists, appends to the array; otherwise creates a new array.
   *
   * @param key - The composite key (path|method or name|method)
   * @param entry - The operation or webhook entry to add
   */
  const addToMap = (key: string, entry: TraversedOperation | TraversedWebhook): void => {
    const existing = map.get(key)
    if (existing) {
      existing.push(entry)
    } else {
      map.set(key, [entry])
    }
  }

  /**
   * Recursively traverses the document tree to find all operations and webhooks.
   * Handles three entry types:
   * - operations: collected into the map using path|method as key
   * - webhooks: collected into the map using name|method as key
   * - containers (tags, groups): recursively traversed for their children
   *
   * @param entries - Array of entries to traverse (may be undefined for empty sections)
   */
  const traverse = (entries: TraversedEntry[] | undefined): void => {
    if (!entries) {
      return
    }

    for (const entry of entries) {
      // Handle operations - use path and method to create unique key
      if (entry.type === 'operation') {
        const key = `${entry.path}|${entry.method}`
        addToMap(key, entry)
      }
      // Handle webhooks - use name and method to create unique key
      else if (entry.type === 'webhook') {
        const key = `${entry.name}|${entry.method}`
        addToMap(key, entry)
      }
      // Handle containers - recursively traverse children
      else if ('children' in entry && entry.children) {
        traverse(entry.children)
      }
    }
  }

  // Start traversal from document root
  traverse(document.children)

  return map
}
