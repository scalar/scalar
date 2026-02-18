import type { TraversedDocument, TraversedEntry, TraversedTag, WithParent } from '@/schemas/navigation'

/** Maps tag names to all matching tag entries (with parent info) found in the document. */
export type TagEntriesMap = Map<string, WithParent<TraversedTag>[]>

/**
 * Builds a map of all tag entries in a document, indexed by tag name.
 *
 * Tags with the same name can appear more than once (for example, when the same tag
 * is referenced in multiple x-tagGroups), so each key maps to an array of matches.
 *
 * This is the tag-side counterpart to `getOperationEntries`. Keep them separate so
 * callers only pay for the traversal they actually need.
 *
 * @param document - The traversed OpenAPI document to extract tags from
 * @returns A map where keys are tag names and values are arrays of matching tag entries,
 *          each decorated with a `parent` reference for walking up the tree.
 *
 * @example
 * const tags = getTagEntries(document)
 * const userTagEntries = tags.get('Users') // All tag entries named "Users"
 */
export const getTagEntries = (document: TraversedDocument): TagEntriesMap => {
  const map: TagEntriesMap = new Map()

  /**
   * Appends an entry to the array stored at `key`, creating the array if needed.
   */
  const addToMap = (key: string, entry: WithParent<TraversedTag>): void => {
    const existing = map.get(key)
    if (existing) {
      existing.push(entry)
    } else {
      map.set(key, [entry])
    }
  }

  /**
   * Recursively walks the document tree collecting tag entries.
   * Tags can be nested (e.g. inside x-tagGroups), so we recurse into their children too.
   *
   * @param entries - The current level of entries to walk (may be undefined)
   * @param parent - The parent entry or document at this level
   */
  const traverse = (
    entries: TraversedEntry[] | undefined,
    parent: WithParent<TraversedEntry> | TraversedDocument,
  ): void => {
    if (!entries) {
      return
    }

    for (const entry of entries) {
      if (entry.type === 'tag') {
        // Record this tag entry, then keep walking its children — tags can be nested
        addToMap(entry.name, { ...entry, parent })
        traverse(entry.children, { ...entry, parent })
      } else if ('children' in entry && entry.children) {
        // Non-tag containers (models, documents) may still hold tags inside them
        traverse(entry.children, { ...entry, parent })
      }
    }
  }

  traverse(document.children, document)

  return map
}
