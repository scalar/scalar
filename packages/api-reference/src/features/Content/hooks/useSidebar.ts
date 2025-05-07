import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { Collection } from '@scalar/store'
import { computed } from 'vue'
import { type OperationSortOption, getOperationsByTag } from '../helpers/get-operations-by-tag'
import { type TagSortOption, getTags } from '../helpers/get-tags'

export type SidebarEntry = {
  id: string
  title: string
  displayTitle?: string
  children?: SidebarEntry[]
  select?: () => void
  httpVerb?: string
  show: boolean
  deprecated?: boolean
  isGroup?: boolean
}

export type InputOption = {
  collection: Collection
}

export type SortOptions = {
  tagSort?: TagSortOption['sort']
  operationSort?: OperationSortOption['sort']
}

/**
 * Provides the sidebar state and methods to control it.
 */
export function useSidebar(options?: InputOption & SortOptions) {
  const items = computed(() => {
    if (!options?.collection?.document) {
      return { entries: [], titles: {} }
    }

    const titlesById: Record<string, string> = {}
    const entries: SidebarEntry[] = []

    // Get sorted tags - use the correct type
    const tags = getTags(options.collection.document as OpenAPIV3_1.Document, {
      sort: options.tagSort,
    })

    // Create entries for each tag
    tags.forEach((tag: OpenAPIV3_1.TagObject) => {
      const operations = getOperationsByTag(options.collection.document as OpenAPIV3_1.Document, tag, {
        sort: options.operationSort,
      })

      // No operations for this tag, skip
      if (!operations.length) {
        return
      }

      const tagEntry: SidebarEntry = {
        id: tag.name ?? 'untitled-tag',
        title: tag.name ?? 'Untitled Tag',
        displayTitle: tag['x-displayName'] ?? tag.name ?? 'Untitled Tag',
        show: true,
        children: operations.map((item: { method: string; path: string; operation: OpenAPIV3_1.OperationObject }) => {
          const id = `${tag.name}-${item.method}-${item.path}`
          const title = item.operation.summary ?? item.path
          titlesById[id] = title

          return {
            id,
            title,
            httpVerb: item.method,
            show: true,
            // Add a basic select implementation
            select: () => {
              // For now, just log the selection
              console.log(`Selected operation: ${id}`)
            },
          }
        }),
      }

      entries.push(tagEntry)
    })

    return {
      entries,
      titles: titlesById,
    }
  })

  return {
    items,
  }
}
