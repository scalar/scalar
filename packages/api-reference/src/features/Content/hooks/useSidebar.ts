import { getWebhooks } from '@/features/Content/helpers/get-webhooks'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { Collection } from '@scalar/store'
import { computed } from 'vue'
import { type OperationSortOption, getOperationsByTag } from '../helpers/get-operations-by-tag'
import { getSchemas } from '../helpers/get-schemas'
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
 * Creates a new instance of the sidebar hook with the given collection.
 * This allows multiple components to use the same computed state.
 */
export function createSidebar(options?: InputOption & SortOptions) {
  const items = computed(() => {
    // Empty
    if (!options?.collection?.document) {
      return { entries: [], titles: {} }
    }

    const titlesById: Record<string, string> = {}
    const entries: SidebarEntry[] = []

    // Get sorted tags
    const tags = getTags(options.collection.document as OpenAPIV3_1.Document, {
      sort: options.tagSort,
      filter: (tag) => !tag['x-internal'] && !tag['x-scalar-ignore'],
    })

    // Check if we have any tagged operations
    const hasTaggedOperations = tags.some(
      (tag) =>
        getOperationsByTag(options.collection.document as OpenAPIV3_1.Document, tag, {
          filter: (operation) => !operation['x-internal'] && !operation['x-scalar-ignore'],
        }).length > 0,
    )

    // Handle tagged operations
    tags.forEach((tag: OpenAPIV3_1.TagObject) => {
      const operations = getOperationsByTag(options.collection.document as OpenAPIV3_1.Document, tag, {
        sort: options.operationSort,
        filter: (operation) => {
          return !operation['x-internal'] && !operation['x-scalar-ignore']
        },
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
        children: operations.map((item) => {
          const id = `${tag.name}-${item.method}-${item.path}`
          const title = item.operation.summary ?? item.path
          titlesById[id] = title

          return {
            id,
            title,
            httpVerb: item.method,
            show: true,
            select: () => {
              console.log(`Selected operation: ${id}`)
            },
          }
        }),
      }

      entries.push(tagEntry)
    })

    // Only handle untagged operations if we don't have a default tag in the tags array
    if (!tags.some((tag) => tag.name === 'default')) {
      const untaggedOperations = getOperationsByTag(
        options.collection.document as OpenAPIV3_1.Document,
        { name: 'default' },
        {
          sort: options.operationSort,
          filter: (operation) => {
            return !operation['x-internal'] && !operation['x-scalar-ignore'] && !operation.tags?.length
          },
        },
      )

      // If we have untagged operations
      if (untaggedOperations.length > 0) {
        if (hasTaggedOperations) {
          // If we also have tagged operations, add them under a default tag
          entries.push({
            id: 'default',
            title: 'default',
            show: true,
            children: untaggedOperations.map((item) => {
              const id = `default-${item.method}-${item.path}`
              const title = item.operation.summary ?? item.path
              titlesById[id] = title

              return {
                id,
                title,
                httpVerb: item.method,
                show: true,
                select: () => {
                  console.log(`Selected operation: ${id}`)
                },
              }
            }),
          })
        } else {
          // If we only have untagged operations, add them directly to entries
          untaggedOperations.forEach((item) => {
            const id = `untagged-${item.method}-${item.path}`
            const title = item.operation.summary ?? item.path
            titlesById[id] = title

            entries.push({
              id,
              title,
              httpVerb: item.method,
              show: true,
              select: () => {
                console.log(`Selected operation: ${id}`)
              },
            })
          })
        }
      }
    }

    // Add webhooks section
    const webhooks = getWebhooks(options.collection.document as OpenAPIV3_1.Document, {
      filter: (webhook) => !webhook['x-internal'] && !webhook['x-scalar-ignore'],
    })

    if (Object.keys(webhooks).length > 0) {
      const webhookEntries = Object.entries(webhooks).flatMap(([name, webhook]) => {
        return Object.entries(webhook).map(([method, operation]) => {
          if (typeof operation !== 'object') {
            return []
          }

          const id = `webhook-${name}-${method}`
          titlesById[id] = name

          return {
            id,
            title: operation.summary ?? name,
            httpVerb: method,
            show: true,
          }
        })
      }) as SidebarEntry[]

      entries.push({
        id: 'webhooks',
        title: 'Webhooks',
        show: true,
        children: webhookEntries,
      })
    }

    // Add schemas section
    const schemas = getSchemas(options.collection.document as OpenAPIV3_1.Document, {
      filter: (schema) => !schema['x-internal'] && !schema['x-scalar-ignore'],
    })

    if (Object.keys(schemas).length > 0) {
      const schemaEntries = Object.entries(schemas).map(([name]) => {
        const id = `schema-${name}`
        titlesById[id] = name

        return {
          id,
          title: name,
          show: true,
          select: () => {
            console.log(`Selected schema: ${id}`)
          },
        }
      })

      entries.push({
        id: 'models',
        title: 'Models',
        show: true,
        children: schemaEntries,
      })
    }

    return {
      entries,
      titles: titlesById,
    }
  })

  return {
    items,
  }
}
