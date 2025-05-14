import { getWebhooks } from '@/features/Sidebar/helpers/get-webhooks'
import type { InputOption, OperationSortOption, SidebarEntry, SortOptions } from '@/features/Sidebar/types'
import { getHeadingsFromMarkdown, getLowestHeadingLevel } from '@/helpers'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { Heading } from '@scalar/types/legacy'
import { computed } from 'vue'
import { getOperationsByTag } from './get-operations-by-tag'
import { getSchemas } from './get-schemas'
import { getTags } from './get-tags'

/**
 * Represents a tag group in the OpenAPI specification.
 * Used to organize operations into logical groups.
 */
type TagGroup = {
  name: string
  tags: string[]
}

/**
 * Extended OpenAPI document that includes custom tag groups.
 */
type ExtendedDocument = OpenAPIV3_1.Document & {
  'x-tagGroups'?: TagGroup[]
}

/**
 * Represents a tagged entry in the sidebar with its children.
 */
type TaggedEntry = {
  id: string
  title: string
  displayTitle?: string
  show: boolean
  children: SidebarEntry[]
}

/**
 * Represents a webhook entry in the sidebar.
 */
type WebhookEntry = {
  id: string
  title: string
  httpVerb: string
  show: boolean
}

/**
 * Creates a sidebar entry for a single API operation.
 * Each operation is uniquely identified by its tag, method, and path.
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

/**
 * Creates sidebar entries for operations organized by tag groups.
 * Tag groups provide a hierarchical organization of API operations.
 */
function createTagGroupEntries(
  content: ExtendedDocument,
  titlesById: Record<string, string>,
  tags: OpenAPIV3_1.TagObject[],
  operationSort?: OperationSortOption['sort'],
): SidebarEntry[] {
  if (!content['x-tagGroups']?.length) {
    return []
  }

  const tagMap = new Map(tags.map((tag) => [tag.name, tag]))

  return content['x-tagGroups'].map((group) => {
    const children: SidebarEntry[] = []

    // Process regular tags
    const groupTags = group.tags
      .filter((tagName) => tagName !== 'webhooks')
      .map((tagName) => tagMap.get(tagName))
      .filter((tag): tag is OpenAPIV3_1.TagObject => tag !== undefined)

    const tagEntries = groupTags
      .map((tag) => {
        const operations = getOperationsByTag(content, tag, {
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

    // Add webhooks if present in the group
    if (group.tags.includes('webhooks')) {
      const webhookEntry = createWebhookEntries(content, titlesById)
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
 * Creates sidebar entries for operations organized by tags.
 * If tag groups are present, they are used instead of flat tags.
 */
function createTaggedEntries(
  content: ExtendedDocument,
  titlesById: Record<string, string>,
  tags: OpenAPIV3_1.TagObject[],
  operationSort?: OperationSortOption['sort'],
): SidebarEntry[] {
  if (content['x-tagGroups']?.length) {
    return createTagGroupEntries(content, titlesById, tags, operationSort)
  }

  return tags
    .map((tag): TaggedEntry | null => {
      const operations = getOperationsByTag(content, tag, {
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
 * Creates sidebar entries for operations that don't have tags.
 * These operations are either grouped under a 'default' tag or shown individually.
 */
function createUntaggedEntries(
  content: OpenAPIV3_1.Document,
  titlesById: Record<string, string>,
  hasTaggedOperations: boolean,
  operationSort?: OperationSortOption['sort'],
): SidebarEntry[] {
  const untaggedOperations = getOperationsByTag(
    content,
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

/**
 * Creates sidebar entries for webhooks.
 * Webhooks are grouped under a single 'Webhooks' section.
 */
function createWebhookEntries(content: OpenAPIV3_1.Document, titlesById: Record<string, string>): SidebarEntry | null {
  const webhooks = getWebhooks(content, {
    filter: (webhook) => !webhook['x-internal'] && !webhook['x-scalar-ignore'],
  })

  if (Object.keys(webhooks).length === 0) {
    return null
  }

  const webhookEntries = Object.entries(webhooks).flatMap(([name, webhook]) =>
    Object.entries(webhook)
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
      .filter((entry): entry is WebhookEntry => entry !== null),
  )

  return {
    id: 'webhooks',
    title: 'Webhooks',
    show: true,
    children: webhookEntries,
  }
}

/**
 * Creates sidebar entries for schema definitions.
 * Schemas are grouped under a single 'Models' section.
 */
function createSchemaEntries(content: OpenAPIV3_1.Document, titlesById: Record<string, string>): SidebarEntry | null {
  const schemas = getSchemas(content, {
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
 * Only includes the top two levels of headings for a clean hierarchy.
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

    if (heading.depth === lowestLevel) {
      entry.children = []
      entries.push(entry)
      currentParent = entry
    } else if (currentParent) {
      currentParent.children?.push(entry)
    }
  }

  return entries
}

/**
 * Creates a new instance of the sidebar with the given OpenAPI specification.
 * Returns a computed property that generates the sidebar structure.
 */
export function createSidebar(options?: InputOption & SortOptions) {
  const items = computed(() => {
    if (!options?.content) {
      return { entries: [], titles: {} }
    }

    const titlesById: Record<string, string> = {}
    const content = options.content as OpenAPIV3_1.Document

    // Get and filter tags
    const tags = getTags(content, {
      sort: options.tagSort,
      filter: (tag) => !tag['x-internal'] && !tag['x-scalar-ignore'],
    })

    // Check for tagged operations
    const hasTaggedOperations = tags.some(
      (tag) =>
        getOperationsByTag(content, tag, {
          filter: (operation) => !operation['x-internal'] && !operation['x-scalar-ignore'],
        }).length > 0,
    )

    // Build sidebar entries
    const entries: SidebarEntry[] = [
      // Add heading entries from description
      ...createHeadingEntries(content.info?.description, (heading) => `description/${heading.slug}`),
      // Add tagged operations
      ...createTaggedEntries(content, titlesById, tags, options.operationSort),
    ]

    // Add untagged operations if no default tag exists
    if (!tags.some((tag) => tag.name === 'default')) {
      entries.push(...createUntaggedEntries(content, titlesById, hasTaggedOperations, options.operationSort))
    }

    // Add webhooks and schemas if they exist
    const webhookEntry = createWebhookEntries(content, titlesById)
    if (webhookEntry) {
      entries.push(webhookEntry)
    }

    const schemaEntry = createSchemaEntries(content, titlesById)
    if (schemaEntry) {
      entries.push(schemaEntry)
    }

    return {
      entries,
      titles: titlesById,
    }
  })

  return { items }
}
