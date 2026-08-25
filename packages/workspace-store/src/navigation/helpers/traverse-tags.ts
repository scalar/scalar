import { sortByOrder } from '@scalar/helpers/array/sort-by-order'

import { isHidden } from '@/helpers/is-hidden'
import { unpackProxyObject } from '@/helpers/unpack-proxy'
import { getXKeysFromObject } from '@/navigation/helpers/get-x-keys'
import type { TagsMap, TraverseSpecOptions } from '@/navigation/types'
import type { TraversedEntry, TraversedTag } from '@/schemas/navigation'
import type { OpenApiDocument, TagObject } from '@/schemas/v3.2/strict/openapi-document'

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
  isTagGroup = false,
  parentId,
}: {
  tag: TagObject
  generateId: TraverseSpecOptions['generateId']
  children: TraversedEntry[]
  isGroup: boolean
  /** True only for legacy `x-tagGroups` wrapper nodes, which are not real tags. */
  isTagGroup?: boolean
  parentId: string
}): TraversedTag => {
  const id = generateId({
    type: 'tag',
    tag,
    parentId,
    isGroup,
    isTagGroup,
  })
  // `summary` is the OpenAPI 3.2 display label; `x-displayName` keeps precedence for backwards compatibility.
  const title = tag['x-displayName'] ?? tag.summary ?? tag.name ?? 'Untitled Tag'

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
    // Only tag on legacy `x-tagGroups` wrappers so the renderer can flatten them without a header.
    // Real OpenAPI 3.2 nested-tag sections keep this unset and render their summary heading.
    ...(isTagGroup ? { isTagGroup: true } : {}),
    isWebhooks: false,
    type: 'tag',
    xKeys: getXKeysFromObject(unpackProxyObject(tag)),
  } satisfies TraversedTag

  return entry
}

/** Sorts and processes tags to create a hierarchical structure of tag entries.
 *
 * This function handles:
 * - Sorting tags alphabetically or using a custom sort function
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
    if (isHidden(tag)) {
      return []
    }

    const sortOrder = tag['x-scalar-order']

    if (sortOrder === undefined) {
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

    return createTagEntry({
      tag,
      generateId,
      children: sortOrder ? sortByOrder(entries, sortOrder, (item) => item.id) : entries,
      parentId: documentId,
      isGroup: false,
    })
  })

  // If a custom 'x-scalar-order' is specified in the tag, sort the entries by this order using sortByOrder
  if (sortOrder) {
    return sortByOrder(entries, sortOrder, (item) => item.id)
  }

  // Alpha sort. `title` already resolves the display label (`x-displayName` first, then the
  // OpenAPI 3.2 `summary`, then `name`), so we compare it directly instead of looking the tag up
  // again by title, which would miss real tags and insert stray `tagsMap` entries.
  if (tagsSorter === 'alpha') {
    entries.sort((a, b) => (a.title || 'Untitled Tag').localeCompare(b.title || 'Untitled Tag'))
  }
  // Custom sort
  else if (typeof tagsSorter === 'function') {
    entries.sort((a, b) =>
      tagsSorter(
        getTag({ tagsMap, name: a.name, documentId, generateId }).tag,
        getTag({ tagsMap, name: b.name, documentId, generateId }).tag,
      ),
    )
  }

  return entries
}

/**
 * Maps each tag name to its OpenAPI 3.2 `parent` when that parent resolves to another
 * declared tag. Self-references and parents without a matching tag are ignored.
 */
const getParentMap = (tags: TagObject[]): Map<string, string> => {
  const names = new Set(tags.flatMap((tag) => (typeof tag.name === 'string' ? tag.name : [])))
  const parentOf = new Map<string, string>()

  for (const tag of tags) {
    if (tag.name && tag.parent && tag.parent !== tag.name && names.has(tag.parent)) {
      parentOf.set(tag.name, tag.parent)
    }
  }

  return parentOf
}

/** A tag is part of a cycle when walking up its parent chain returns to a tag already seen. */
const isCyclic = (parentOf: Map<string, string>, name: string): boolean => {
  const seen = new Set<string>([name])
  let current = parentOf.get(name)
  while (current) {
    if (seen.has(current)) {
      return true
    }
    seen.add(current)
    current = parentOf.get(current)
  }
  return false
}

/**
 * Nests tag entries according to the OpenAPI 3.2 `parent` field.
 *
 * Each tag may declare the `name` of another tag it is nested under. We build the flat
 * tag entries first (so operation sorting, hidden-tag filtering and IDs stay identical to
 * the ungrouped path) and then re-parent them by reference. A tag that nests other tags
 * but has no operations of its own is marked as a group so the renderer presents it as a
 * section rather than a leaf.
 *
 * Tags whose `parent` does not resolve to an existing tag, and tags caught in a circular
 * reference (which the spec forbids), are kept at the top level.
 */
const nestTagsByParent = ({
  flatEntries,
  document,
  originalOrders,
}: {
  flatEntries: TraversedEntry[]
  document: OpenApiDocument
  /** Tag-level `x-scalar-order` values captured before the flat traversal rewrote them. */
  originalOrders: Map<string, string[]>
}): TraversedEntry[] => {
  // Index real tag entries by name and remember which ones owned operations before nesting.
  const entriesByName = new Map<string, TraversedTag>()
  const hadOwnOperations = new Map<string, boolean>()
  for (const entry of flatEntries) {
    if (entry.type === 'tag') {
      entriesByName.set(entry.name, entry)
      hadOwnOperations.set(entry.name, (entry.children?.length ?? 0) > 0)
    }
  }

  const parentOf = getParentMap(document.tags ?? [])

  // Re-parent entries by reference, tracking which ones leave the top level.
  const nested = new Set<string>()
  const gainedNestedTags = new Set<string>()
  for (const [name, entry] of entriesByName) {
    const parentName = parentOf.get(name)
    if (parentName === undefined || isCyclic(parentOf, name)) {
      continue
    }
    const parent = entriesByName.get(parentName)
    if (!parent) {
      continue
    }
    // Append in place: rebuilding the array on every child is quadratic for wide parents.
    parent.children = parent.children ?? []
    parent.children.push(entry)
    nested.add(name)
    gainedNestedTags.add(parentName)
  }

  // Nested tags were appended after the parent's own operations, but the parent's persisted
  // `x-scalar-order` was written before nesting and knows nothing about them. Restore any
  // custom order that already references the nested tag ids, then sync the persisted order
  // with the final children so the nested ids are never dropped.
  const tagsByName = new Map<string, TagObject>()
  for (const tag of document.tags ?? []) {
    if (tag.name) {
      tagsByName.set(tag.name, tag)
    }
  }
  for (const parentName of gainedNestedTags) {
    const parent = entriesByName.get(parentName)
    if (!parent) {
      continue
    }
    const originalOrder = originalOrders.get(parentName)
    if (originalOrder) {
      parent.children = sortByOrder(parent.children ?? [], originalOrder, (item) => item.id)
    }
    const tag = tagsByName.get(parentName)
    if (tag) {
      tag['x-scalar-order'] = (parent.children ?? []).map((child) => child.id)
    }
  }

  // A tag that nests other tags but owns no operations is a section, not a leaf.
  for (const [name, entry] of entriesByName) {
    const hasChildTags = (entry.children ?? []).some((child) => child.type === 'tag')
    if (hasChildTags && !hadOwnOperations.get(name)) {
      entry.isGroup = true
    }
  }

  return flatEntries.filter((entry) => !(entry.type === 'tag' && nested.has(entry.name)))
}

/**
 * Traverses the tags map to create navigation entries, handling nested, grouped and ungrouped tags.
 *
 * This function processes the OpenAPI document's tags to:
 * - Nest tags via the OpenAPI 3.2 `parent` field (takes precedence)
 * - Otherwise handle tag groups if specified via x-tagGroups
 * - Sort tags and their operations according to provided sorters
 * - Create navigation entries for each tag or tag group
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
  // Native OpenAPI 3.2 tag nesting via `parent` takes precedence over x-tagGroups, but only
  // when at least one `parent` resolves to another declared tag outside a circular reference.
  // A stray or misspelled `parent` value must not disable the legacy `x-tagGroups` handling.
  const parentOf = getParentMap(document.tags ?? [])
  const hasNestedTags = Array.from(parentOf.keys()).some((name) => !isCyclic(parentOf, name))
  if (hasNestedTags) {
    // The flat traversal rewrites tag-level `x-scalar-order`, so capture the original values
    // first to keep any custom order that already references nested tag ids.
    const originalOrders = new Map<string, string[]>()
    for (const tag of document.tags ?? []) {
      if (tag.name && tag['x-scalar-order']) {
        originalOrders.set(tag.name, tag['x-scalar-order'])
      }
    }

    const flatEntries = getSortedTagEntries({
      _keys: Array.from(tagsMap.keys()),
      tagsMap,
      options: { generateId, tagsSorter, operationsSorter },
      documentId,
      sortOrder: document['x-scalar-order'],
    })

    return nestTagsByParent({ flatEntries, document, originalOrders })
  }

  // x-tagGroups (legacy)
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
            isTagGroup: true,
          })
        : []
    })
  }

  // Ungrouped regular tags
  const keys = Array.from(tagsMap.keys())

  const tags = getSortedTagEntries({
    _keys: keys,
    tagsMap,
    options: { generateId, tagsSorter, operationsSorter },
    documentId: documentId,
    sortOrder: document['x-scalar-order'],
  })

  return tags
}
