import { getWebhooks } from '@/features/Content/helpers/get-webhooks'
import { getHeadingsFromMarkdown, getLowestHeadingLevel } from '@/helpers'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { Collection } from '@scalar/store'
import type { Heading } from '@scalar/types/legacy'
import { computed } from 'vue'
import { type OperationSortOption, getOperationsByTag } from './get-operations-by-tag'
import { getSchemas } from './get-schemas'
import { type TagSortOption, getTags } from './get-tags'

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
 * Creates a sidebar entry for a single operation
 */
function createOperationEntry(
  titlesById: Record<string, string>,
  tag: OpenAPIV3_1.TagObject,
  item: { method: string; path: string; operation: OpenAPIV3_1.OperationObject },
): SidebarEntry {
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
}

type TaggedEntry = {
  id: string
  title: string
  displayTitle?: string
  show: boolean
  children: SidebarEntry[]
}

type TagGroup = {
  name: string
  tags: string[]
}

type ExtendedDocument = OpenAPIV3_1.Document & {
  'x-tagGroups'?: TagGroup[]
}

/**
 * Creates sidebar entries for tag groups
 */
function createTagGroupEntries(
  document: ExtendedDocument,
  titlesById: Record<string, string>,
  tags: OpenAPIV3_1.TagObject[],
  operationSort?: OperationSortOption['sort'],
): SidebarEntry[] {
  if (!document['x-tagGroups']?.length) {
    return []
  }

  // Create a map of tags by name for quick lookup
  const tagMap = new Map(tags.map((tag) => [tag.name, tag]))

  return document['x-tagGroups'].map((group) => {
    const children: SidebarEntry[] = []

    // Handle regular tags
    const groupTags = group.tags
      .filter((tagName) => tagName !== 'webhooks')
      .map((tagName) => tagMap.get(tagName))
      .filter((tag): tag is OpenAPIV3_1.TagObject => tag !== undefined)

    const tagEntries = groupTags
      .map((tag) => {
        const operations = getOperationsByTag(document, tag, {
          sort: operationSort,
          filter: (operation) => !operation['x-internal'] && !operation['x-scalar-ignore'],
        })

        return {
          id: tag.name ?? 'untitled-tag',
          title: tag.name ?? 'Untitled Tag',
          displayTitle: tag['x-displayName'] ?? tag.name ?? 'Untitled Tag',
          show: true,
          children: operations.map((item) => createOperationEntry(titlesById, tag, item)),
        }
      })
      .filter((entry) => entry.children.length > 0)

    children.push(...tagEntries)

    // Handle webhooks if they're in the group
    if (group.tags.includes('webhooks')) {
      const webhookEntry = createWebhookEntries(document, titlesById)
      if (webhookEntry) {
        children.push(webhookEntry)
      }
    }

    return {
      id: `group-${group.name}`,
      title: group.name,
      show: true,
      isGroup: true,
      children,
    }
  })
}

/**
 * Creates sidebar entries for tagged operations
 */
function createTaggedEntries(
  document: ExtendedDocument,
  titlesById: Record<string, string>,
  tags: OpenAPIV3_1.TagObject[],
  operationSort?: OperationSortOption['sort'],
): SidebarEntry[] {
  // If we have tag groups, use those instead of flat tags
  if (document['x-tagGroups']?.length) {
    return createTagGroupEntries(document, titlesById, tags, operationSort)
  }

  return tags
    .map((tag): TaggedEntry | null => {
      const operations = getOperationsByTag(document, tag, {
        sort: operationSort,
        filter: (operation) => !operation['x-internal'] && !operation['x-scalar-ignore'],
      })

      if (!operations.length) {
        return null
      }

      return {
        id: tag.name ?? 'untitled-tag',
        title: tag.name ?? 'Untitled Tag',
        displayTitle: tag['x-displayName'] ?? tag.name ?? 'Untitled Tag',
        show: true,
        children: operations.map((item) => createOperationEntry(titlesById, tag, item)),
      }
    })
    .filter((entry): entry is TaggedEntry => entry !== null)
}

/**
 * Creates sidebar entries for untagged operations
 */
function createUntaggedEntries(
  document: OpenAPIV3_1.Document,
  titlesById: Record<string, string>,
  hasTaggedOperations: boolean,
  operationSort?: OperationSortOption['sort'],
): SidebarEntry[] {
  const untaggedOperations = getOperationsByTag(
    document,
    { name: 'default' },
    {
      sort: operationSort,
      filter: (operation) => {
        return !operation['x-internal'] && !operation['x-scalar-ignore'] && !operation.tags?.length
      },
    },
  )

  if (!untaggedOperations.length) {
    return []
  }

  if (hasTaggedOperations) {
    return [
      {
        id: 'default',
        title: 'default',
        show: true,
        children: untaggedOperations.map((item) => createOperationEntry(titlesById, { name: 'default' }, item)),
      },
    ]
  }

  return untaggedOperations.map((item) => createOperationEntry(titlesById, { name: 'untagged' }, item))
}

type WebhookEntry = {
  id: string
  title: string
  httpVerb: string
  show: boolean
}

/**
 * Creates sidebar entries for webhooks
 */
function createWebhookEntries(document: OpenAPIV3_1.Document, titlesById: Record<string, string>): SidebarEntry | null {
  const webhooks = getWebhooks(document, {
    filter: (webhook) => !webhook['x-internal'] && !webhook['x-scalar-ignore'],
  })

  if (Object.keys(webhooks).length === 0) {
    return null
  }

  const webhookEntries = Object.entries(webhooks).flatMap(([name, webhook]) => {
    return Object.entries(webhook)
      .map(([method, operation]): WebhookEntry | null => {
        if (typeof operation !== 'object') {
          return null
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
      .filter((entry): entry is WebhookEntry => entry !== null)
  })

  return {
    id: 'webhooks',
    title: 'Webhooks',
    show: true,
    children: webhookEntries,
  }
}

/**
 * Creates sidebar entries for schemas
 */
function createSchemaEntries(document: OpenAPIV3_1.Document, titlesById: Record<string, string>): SidebarEntry | null {
  const schemas = getSchemas(document, {
    filter: (schema) => !schema['x-internal'] && !schema['x-scalar-ignore'],
  })

  if (Object.keys(schemas).length === 0) {
    return null
  }

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

  return {
    id: 'models',
    title: 'Models',
    show: true,
    children: schemaEntries,
  }
}

/**
 * Creates sidebar entries from markdown headings in the OpenAPI description.
 * Only includes the top two levels of headings (e.g. h1 and h2).
 *
 * @param description - The markdown description from the OpenAPI document
 * @param getHeadingId - Function to generate heading IDs
 * @returns Array of sidebar entries for the headings
 */
function createHeadingEntries(
  description: string | undefined,
  getHeadingId: (heading: Heading) => string,
): SidebarEntry[] {
  if (!description?.trim()) {
    return []
  }

  const headings = getHeadingsFromMarkdown(description)
  const lowestLevel = getLowestHeadingLevel(headings)

  // Filter headings to only include top two levels
  const relevantHeadings = headings.filter(
    (heading) => heading.depth === lowestLevel || heading.depth === lowestLevel + 1,
  )

  if (!relevantHeadings.length) {
    return []
  }

  const entries: SidebarEntry[] = []
  let currentParent: SidebarEntry | null = null

  for (const heading of relevantHeadings) {
    const entry: SidebarEntry = {
      id: getHeadingId(heading),
      title: heading.value,
      show: true,
    }

    // If this is a top-level heading, add it as a parent
    if (heading.depth === lowestLevel) {
      entry.children = []
      entries.push(entry)
      currentParent = entry
    }
    // If this is a second-level heading and we have a parent, add it as a child
    else if (currentParent) {
      currentParent.children?.push(entry)
    }
  }

  return entries
}

/**
 * Creates a new instance of the sidebar hook with the given collection.
 * This allows multiple components to use the same computed state.
 */
export function createSidebar(options?: InputOption & SortOptions) {
  const items = computed(() => {
    if (!options?.collection?.document) {
      return { entries: [], titles: {} }
    }

    const titlesById: Record<string, string> = {}
    const document = options.collection.document as OpenAPIV3_1.Document

    // Get sorted tags
    const tags = getTags(document, {
      sort: options.tagSort,
      filter: (tag) => !tag['x-internal'] && !tag['x-scalar-ignore'],
    })

    // Check if we have any tagged operations
    const hasTaggedOperations = tags.some(
      (tag) =>
        getOperationsByTag(document, tag, {
          filter: (operation) => !operation['x-internal'] && !operation['x-scalar-ignore'],
        }).length > 0,
    )

    // Create heading entries from the description
    const headingEntries = createHeadingEntries(document.info?.description, (heading) => `description/${heading.slug}`)

    const entries: SidebarEntry[] = [
      // Add heading entries first
      ...headingEntries,
      // Then add tagged operations
      ...createTaggedEntries(document, titlesById, tags, options.operationSort),
    ]

    // Untagged operations
    if (!tags.some((tag) => tag.name === 'default')) {
      entries.push(...createUntaggedEntries(document, titlesById, hasTaggedOperations, options.operationSort))
    }

    // Webhooks
    const webhookEntry = createWebhookEntries(document, titlesById)
    if (webhookEntry) {
      entries.push(webhookEntry)
    }

    // Models
    const schemaEntry = createSchemaEntries(document, titlesById)
    if (schemaEntry) {
      entries.push(schemaEntry)
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
