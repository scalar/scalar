import { traverseDescription } from './traverse-description'
import { traversePaths } from './traverse-paths'
import { traverseSchemas } from './traverse-schemas'
import { traverseTags } from './traverse-tags'
import { traverseWebhooks } from './traverse-webhooks'
import type { TagsMap, TraversedEntry, TraverseSpecOptions } from '@/navigation/types'
import type { OpenApiDocument } from '@/schemas/v3.1/strict/openapi-document'

/**
 * Traverses an OpenAPI Document to generate navigation structure and metadata.
 *
 * This function processes the OpenAPI document to create:
 * - A hierarchical navigation structure for the sidebar
 * - A mapping of IDs to titles for mobile header navigation
 * - Tag-based organization of operations and webhooks
 * - Optional schema/model documentation
 */
export const traverseDocument = (
  document: OpenApiDocument,
  {
    hideModels = false,
    tagsSorter = 'alpha',
    operationsSorter = 'alpha',
    getHeadingId = (heading) => heading.value,
    getOperationId = (operation) => operation.summary ?? '',
    getWebhookId = (webhook) => webhook?.name ?? 'webhooks',
    getModelId = (model) => model?.name ?? '',
    getTagId = (tag) => tag.name ?? '',
  }: Partial<TraverseSpecOptions>,
) => {
  /** Map it ID to title for the mobile header */
  const titles = new Map<string, string>()

  /** Map of tags and their entries */
  const tagsMap: TagsMap = new Map(
    document.tags?.map((tag) => [tag.name ?? 'Untitled Tag', { tag, entries: [] }]) ?? [],
  )

  const entries: TraversedEntry[] = traverseDescription(document.info?.description, titles, getHeadingId)
  traversePaths(document, tagsMap, titles, getOperationId)
  const untaggedWebhooks = traverseWebhooks(document, tagsMap, titles, getWebhookId)
  const tagsEntries = traverseTags(document, tagsMap, titles, {
    getTagId,
    tagsSorter,
    operationsSorter,
  })

  // Add tagged operations, webhooks and tagGroups
  entries.push(...tagsEntries)

  // Add untagged webhooks
  if (untaggedWebhooks.length) {
    entries.push({
      id: getWebhookId(),
      title: 'Webhooks',
      children: untaggedWebhooks,
      type: 'text',
    })
  }

  // Add models if they are not hidden
  if (!hideModels && document.components?.schemas) {
    const untaggedModels = traverseSchemas(document, tagsMap, titles, getModelId)

    if (untaggedModels.length) {
      entries.push({
        id: getModelId(),
        title: 'Models',
        children: untaggedModels,
        type: 'text',
      })
    }
  }

  return { entries, titles }
}
