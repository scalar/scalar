import { getXKeysFromObject } from '@/navigation/helpers/get-x-keys'
import type { TagsMap, TraverseSpecOptions } from '@/navigation/types'
import type { TraversedEntry, TraversedTag } from '@/schemas/navigation'
import type { OpenApiDocument, TagObject } from '@/schemas/v3.1/strict/openapi-document'

import { getTag } from './get-tag'

type Options = Pick<TraverseSpecOptions, 'tagsSorter' | 'operationsSorter' | 'generateId'>

/** Creates a traversed tag entry from an OpenAPI tag object.
 *
 * @param tag - The OpenAPI tag object
 * @param entriesMap - Map to store tag IDs and titles for mobile header navigation
 * @param getTagId - Function to generate unique IDs for tags
 * @param children - Array of child entries (operations, webhooks, etc.)
 * @param isGroup - Whether this tag represents a group of tags
 * @returns A traversed tag entry with ID, title, name and children
 */
const createTagEntry = ({
  tag,
  generateId,
  children,
  isGroup = false,
  parentId,
}: {
  tag: TagObject
  generateId: TraverseSpecOptions['generateId']
  children: TraversedEntry[]
  isGroup: boolean
  parentId: string
}): TraversedTag => {
  const id = generateId({
    type: 'tag',
    tag,
    parentId,
  })
  const title = tag['x-displayName'] ?? tag.name ?? 'Untitled Tag'

  // Update the order of the children based on the items
  // This will ensure that the sort order is always in sync with the items
  tag['x-scalar-order'] = children.map((child) => child.id)

  const entry = {
    id,
    title,
    name: tag.name || title,
    description: tag.description,
    children,
    isGroup,
    isWebhooks: false,
    type: 'tag',
    xKeys: getXKeysFromObject(tag),
  } satisfies TraversedTag

  return entry
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
const getSortedTagEntries = ({
  _keys,
  tagsMap,
  options: { tagsSorter, operationsSorter, generateId },
  documentId,
  sortOrder,
}: {
  _keys: string[]
  /** Map of tags and their entries */
  tagsMap: TagsMap
  options: Options
  documentId: string
  sortOrder: string[] | undefined
}) => {
  /**
   * Process each tag and its entries:
   * - Skip internal and ignored tags
   * - Sort operations within tags
   * - Create tag entries with sorted operations
   */
  const entries = _keys.flatMap((key) => {
    const { tag, entries } = getTag({ tagsMap, name: key, documentId, generateId })

    // Skip if the tag is internal or scalar-ignore
    if (tag['x-internal'] || tag['x-scalar-ignore']) {
      return []
    }

    const sortOrder = tag['x-scalar-order']

    if (sortOrder !== undefined) {
      // Sort the entries by the sort order if it is provided
      entries.sort((a, b) => {
        const idxA = sortOrder.indexOf(a.id)
        const idxB = sortOrder.indexOf(b.id)
        // Items not found in sortOrder should come last (after all found items)
        const safeIdxA = idxA === -1 ? Number.POSITIVE_INFINITY : idxA
        const safeIdxB = idxB === -1 ? Number.POSITIVE_INFINITY : idxB
        return safeIdxA - safeIdxB
      })
    } else {
      // Alpha sort
      if (operationsSorter === 'alpha') {
        entries.sort((a, b) => (a.type === 'operation' && b.type === 'operation' ? a.title.localeCompare(b.title) : 0))
      }
      // Method sort
      else if (operationsSorter === 'method') {
        entries.sort((a, b) =>
          a.type === 'operation' && b.type === 'operation' ? a.method.localeCompare(b.method) : 0,
        )
      }
      // Custom sort
      else if (typeof operationsSorter === 'function') {
        entries.sort((a, b) => {
          // Guard against tags
          if (!(a.type === 'operation' || a.type === 'webhook') || !(b.type === 'operation' || b.type === 'webhook')) {
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
    }

    return entries.length
      ? createTagEntry({
          tag,
          generateId,
          children: entries,
          parentId: documentId,
          isGroup: false,
        })
      : []
  })

  // Sort the entries by the sort order
  // Ensure that default is last if it exists
  const defaultEntry = entries.find((entry) => entry.title === 'default')
  const withoutDefault = defaultEntry ? entries.filter((entry) => entry.title !== 'default') : entries

  // If sort order is provided, use it to sort the entries
  if (sortOrder) {
    entries.sort((a, b) => {
      const indexA = sortOrder.indexOf(a.id)
      const indexB = sortOrder.indexOf(b.id)
      // If an id is not found, treat it as "infinity" so those items go last.
      const safeIndexA = indexA === -1 ? Number.POSITIVE_INFINITY : indexA
      const safeIndexB = indexB === -1 ? Number.POSITIVE_INFINITY : indexB
      return safeIndexA - safeIndexB
    })
    return entries
  }

  // Alpha sort
  if (tagsSorter === 'alpha') {
    withoutDefault.sort((a, b) => {
      const nameA =
        getTag({
          tagsMap,
          name: a.title,
          documentId,
          generateId,
        }).tag['x-displayName'] ||
        a.title ||
        'Untitled Tag'
      const nameB =
        getTag({ tagsMap, name: b.title, documentId, generateId }).tag['x-displayName'] || b.title || 'Untitled Tag'
      return nameA.localeCompare(nameB)
    })
  }
  // Custom sort
  else if (typeof tagsSorter === 'function') {
    withoutDefault.sort((a, b) =>
      tagsSorter(
        getTag({ tagsMap, name: a.name, documentId, generateId }).tag,
        getTag({ tagsMap, name: b.name, documentId, generateId }).tag,
      ),
    )
  }

  return defaultEntry ? [...withoutDefault, defaultEntry] : withoutDefault
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
export const traverseTags = ({
  document,
  tagsMap,
  documentId,
  options: { generateId, tagsSorter, operationsSorter },
}: {
  document: OpenApiDocument
  /** Map of tags and their entries */
  tagsMap: TagsMap
  documentId: string
  options: Options
}): TraversedEntry[] => {
  // x-tagGroups
  if (document['x-tagGroups']) {
    const tagGroups = document['x-tagGroups']

    return tagGroups.flatMap((tagGroup) => {
      const entries = getSortedTagEntries({
        _keys: tagGroup.tags,
        tagsMap,
        options: { tagsSorter, operationsSorter, generateId },
        documentId: documentId,
        sortOrder: tagGroup['x-scalar-order'],
      })

      // Try to update the sort order of the tag group to keep it in sync with the items
      tagGroup['x-scalar-order'] = entries.map((entry) => entry.id)

      return entries.length
        ? createTagEntry({
            tag: tagGroup,
            generateId,
            children: entries,
            parentId: documentId,
            isGroup: true,
          })
        : []
    })
  }

  // Ungrouped regular tags
  const keys = Array.from(tagsMap.keys())
  const onlyDefaultTag = keys.length === 1 && keys[0] === 'default'

  if (onlyDefaultTag) {
    const tag = tagsMap.get('default')

    if (tag?.tag) {
      // Set the sort order of the default tag so we can sort the items even when the default tag is a fake tag
      tag.tag['x-scalar-order'] = document['x-scalar-order']
    }
  }

  const tags = getSortedTagEntries({
    _keys: keys,
    tagsMap,
    options: { generateId, tagsSorter, operationsSorter },
    documentId: documentId,
    sortOrder: onlyDefaultTag ? undefined : document['x-scalar-order'],
  })

  // Flatten if we only have default tag
  if (onlyDefaultTag) {
    const children = tags[0]?.children ?? []
    // Try to update the sort order of the children to keep it in sync with the items
    document['x-scalar-order'] = children.map((entry) => entry.id)
    return children
  }

  // Try to update the sort order of the tags to keep it in sync with the items
  document['x-scalar-order'] = tags.map((entry) => entry.id)
  return tags
}
