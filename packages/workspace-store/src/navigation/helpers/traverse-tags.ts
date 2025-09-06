import type { TagsMap, TraverseSpecOptions } from '@/navigation/types'
import type { TraversedEntry, TraversedTag } from '@/schemas/navigation'
import type { OpenApiDocument, TagObject } from '@/schemas/v3.1/strict/openapi-document'

import { getTag } from './get-tag'

type Options = Pick<TraverseSpecOptions, 'getTagId' | 'tagsSorter' | 'operationsSorter'>

/** Creates a traversed tag entry from an OpenAPI tag object.
 *
 * @param tag - The OpenAPI tag object
 * @param titlesMap - Map to store tag IDs and titles for mobile header navigation
 * @param getTagId - Function to generate unique IDs for tags
 * @param children - Array of child entries (operations, webhooks, etc.)
 * @param isGroup - Whether this tag represents a group of tags
 * @returns A traversed tag entry with ID, title, name and children
 */
const createTagEntry = (
  tag: TagObject,
  titlesMap: Map<string, string>,
  getTagId: TraverseSpecOptions['getTagId'],
  children: TraversedEntry[],
  isGroup = false,
): TraversedTag => {
  const id = getTagId(tag)
  const title = tag['x-displayName'] ?? tag.name ?? 'Untitled Tag'
  titlesMap.set(id, title)

  return {
    id,
    title,
    name: tag.name || title,
    children,
    isGroup,
    type: 'tag',
  }
}

/** Sorts and processes tags to create a hierarchical structure of tag entries.
 *
 * This function handles:
 * - Sorting tags alphabetically or using a custom sort function
 * - Ensuring the default tag appears last
 * - Sorting operations within tags by title, method, or custom function
 * - Filtering out internal and ignored tags
 * - Creating tag entries with their associated operations
 *
 * @param _keys - Array of tag keys to process
 * @param tagsMap - Map of tags and their entries
 * @param tagsDict - Dictionary of OpenAPI tags by name
 * @param titlesMap - Map of titles for the mobile header
 * @param options - Sorting and ID generation options
 * @returns Array of processed and sorted tag entries
 */
/** Sorts tags and returns entries */
const getSortedTagEntries = (
  _keys: string[],
  /** Map of tags and their entries */
  tagsMap: TagsMap,
  /** Map of titles for the mobile header */
  titlesMap: Map<string, string>,
  { getTagId, tagsSorter, operationsSorter }: Options,
) => {
  // Ensure that default is last if it exists
  const hasDefault = _keys.includes('default')
  const keys = hasDefault ? _keys.filter((key) => key !== 'default') : _keys

  // Alpha sort
  if (tagsSorter === 'alpha') {
    keys.sort((a, b) => {
      const nameA = getTag(tagsMap, a).tag['x-displayName'] || a || 'Untitled Tag'
      const nameB = getTag(tagsMap, b).tag['x-displayName'] || b || 'Untitled Tag'
      return nameA.localeCompare(nameB)
    })
  }
  // Custom sort
  else if (typeof tagsSorter === 'function') {
    keys.sort((a, b) => tagsSorter(getTag(tagsMap, a).tag, getTag(tagsMap, b).tag))
  }

  if (hasDefault) {
    keys.push('default')
  }

  /**
   * Process each tag and its entries:
   * - Skip internal and ignored tags
   * - Sort operations within tags
   * - Create tag entries with sorted operations
   */
  return keys.flatMap((key) => {
    const { tag, entries } = getTag(tagsMap, key)

    // Skip if the tag is internal or scalar-ignore
    if (tag['x-internal'] || tag['x-scalar-ignore']) {
      return []
    }

    // Alpha sort
    if (operationsSorter === 'alpha') {
      entries.sort((a, b) => ('method' in a && 'method' in b ? a.title.localeCompare(b.title) : 0))
    }
    // Method sort
    else if (operationsSorter === 'method') {
      entries.sort((a, b) => ('method' in a && 'method' in b ? a.method.localeCompare(b.method) : 0))
    }
    // Custom sort
    else if (typeof operationsSorter === 'function') {
      entries.sort((a, b) => {
        // Guard against tags
        if ((a.type !== 'operation' && a.type !== 'webhook') || (b.type !== 'operation' && b.type !== 'webhook')) {
          return 0
        }

        // Handle webhooks as well as operations
        const pathA = a.type === 'operation' ? a.path : a.name
        const pathB = b.type === 'operation' ? b.path : b.name

        return operationsSorter(
          { method: a.method, path: pathA, ref: a.ref, httpVerb: a.method },
          { method: b.method, path: pathB, ref: b.ref, httpVerb: b.method },
        )
      })
    }

    return entries.length ? createTagEntry(tag, titlesMap, getTagId, entries) : []
  })
}

/**
 * Traverses the tags map to create navigation entries, handling both grouped and ungrouped tags.
 *
 * This function processes the OpenAPI document's tags to:
 * - Handle tag groups if specified via x-tagGroups
 * - Sort tags and their operations according to provided sorters
 * - Create navigation entries for each tag or tag group
 * - Flatten default tag entries if it's the only tag present
 */
export const traverseTags = (
  content: OpenApiDocument,
  /** Map of tags and their entries */
  tagsMap: TagsMap,
  /** Map of titles for the mobile title */
  titlesMap: Map<string, string>,
  { getTagId, tagsSorter, operationsSorter }: Options,
): TraversedEntry[] => {
  // x-tagGroups
  if (content['x-tagGroups']) {
    const tagGroups = content['x-tagGroups']

    return tagGroups.flatMap((tagGroup) => {
      const entries = getSortedTagEntries(tagGroup.tags ?? [], tagsMap, titlesMap, {
        getTagId,
        tagsSorter,
        operationsSorter,
      })
      return entries.length ? createTagEntry(tagGroup, titlesMap, getTagId, entries, true) : []
    })
  }

  // Ungrouped regular tags
  const keys = Array.from(tagsMap.keys())
  const tags = getSortedTagEntries(keys, tagsMap, titlesMap, { getTagId, tagsSorter, operationsSorter })

  // Flatten if we only have default tag
  if (tags.length === 1 && tags[0]?.title === 'default') {
    return tags[0]?.children ?? []
  }

  return tags
}
