import type { Item } from '@scalar/sidebar'
import type { TraversedEntry, WithParent } from '@scalar/workspace-store/schemas/navigation'
import type { FuseResult } from 'fuse.js'

import type { FuseData } from '@/v2/features/search/types'

/** The types of items we want to show in the API client */
const API_CLIENT_TYPES_SET = new Set(['document', 'operation', 'example', 'tag'])

/**
 * Recursively builds the parent chain for an entry.
 * Returns an array starting from the root parent down to (but not including) the entry itself.
 */
function getParentChain(parent: WithParent<TraversedEntry> | undefined): TraversedEntry[] {
  const chain: TraversedEntry[] = []
  let current: WithParent<TraversedEntry> | TraversedEntry | undefined = parent

  while (current) {
    chain.unshift(current)
    // Check if current has a parent property before accessing it
    if ('parent' in current) {
      current = current.parent
    } else {
      // We've reached a TraversedDocument or other terminal node
      break
    }
  }

  return chain
}

/**
 * Helper to check if an entry has children property
 */
function hasChildren(entry: TraversedEntry): entry is TraversedEntry & { children?: TraversedEntry[] } {
  return 'children' in entry
}

/**
 * Takes the results from the fuse search and returns filtered entries for the sidebar.
 * Maintains hierarchical structure by including parent entries and grouping children under shared parents.
 */
export const getFuseItems = (results: FuseResult<FuseData>[]): Item[] => {
  const itemMap = new Map<string, TraversedEntry & { children: TraversedEntry[] }>()
  const rootItems: (TraversedEntry & { children: TraversedEntry[] })[] = []

  results.forEach((result) => {
    if (!API_CLIENT_TYPES_SET.has(result.item.entry.type)) {
      return
    }

    // Get the parent chain for this result
    const parentChain = getParentChain(result.item.parent)
    const matchedEntry = result.item.entry

    // Build the tree structure from root to leaf
    let currentLevel = rootItems

    // Process each parent in the chain
    parentChain.forEach((parent) => {
      if (!itemMap.has(parent.id)) {
        // Create a new parent entry with children array
        const parentWithChildren = { ...parent, children: [] }
        itemMap.set(parent.id, parentWithChildren)

        // Add to the appropriate level
        currentLevel.push(parentWithChildren)
      }

      // Move down to the next level
      const parentEntry = itemMap.get(parent.id)!
      currentLevel = parentEntry.children
    })

    // Add the matched entry itself
    if (!itemMap.has(matchedEntry.id)) {
      const entryWithChildren = {
        ...matchedEntry,
        children: hasChildren(matchedEntry) ? matchedEntry.children || [] : [],
      }
      itemMap.set(matchedEntry.id, entryWithChildren)
      currentLevel.push(entryWithChildren)
    }
  })

  return rootItems
}
