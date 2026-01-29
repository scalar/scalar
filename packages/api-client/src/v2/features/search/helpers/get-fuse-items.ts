import { API_CLIENT_TYPES_SET, type Item } from '@scalar/sidebar'
import type { TraversedEntry, WithParent } from '@scalar/workspace-store/schemas/navigation'
import type { FuseResult } from 'fuse.js'

import type { FuseData } from '@/v2/features/search/types'

/**
 * Recursively builds the parent chain for an entry.
 * Returns an array starting from the root parent down to (but not including) the entry itself.
 */
function getParentChain(parent: WithParent<TraversedEntry> | undefined): TraversedEntry[] {
  const chain: TraversedEntry[] = []
  let current = parent

  while (current) {
    chain.unshift(current)
    current = current.parent
  }

  return chain
}

/**
 * Takes the results from the fuse search and returns filtered entries for the sidebar.
 * Maintains hierarchical structure by including parent entries.
 */
export const getFuseItems = (results: FuseResult<FuseData>[]): Item[] => {
  const seenIds = new Set<string>()
  const items: Item[] = []

  results.forEach((result) => {
    if (!API_CLIENT_TYPES_SET.has(result.item.entry.type)) {
      return
    }

    // Get the parent chain for this result
    const parentChain = getParentChain(result.item.parent)

    // Add all parents that we haven't seen yet
    parentChain.forEach((parent) => {
      if (!seenIds.has(parent.id)) {
        seenIds.add(parent.id)
        items.push(parent)
      }
    })

    // Add the matched entry itself
    if (!seenIds.has(result.item.entry.id)) {
      seenIds.add(result.item.entry.id)
      items.push(result.item.entry)
    }
  })

  return items
}
