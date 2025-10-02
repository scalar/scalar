import { getNavigationOptions } from '@/navigation/get-navigation-options'
import type { TagsMap } from '@/navigation/types'
import type { TraversedEntry } from '@/schemas/navigation'
import type { OpenApiDocument } from '@/schemas/v3.1/strict/openapi-document'
import type { DocumentConfiguration } from '@/schemas/workspace-specification/config'

import { traverseDescription } from './traverse-description'
import { traversePaths } from './traverse-paths'
import { traverseSchemas } from './traverse-schemas'
import { traverseTags } from './traverse-tags'
import { traverseWebhooks } from './traverse-webhooks'

/**
 * Traverses an OpenAPI Document to generate navigation structure and metadata.
 *
 * This function processes the OpenAPI document to create:
 * - A hierarchical navigation structure for the sidebar
 * - A mapping of IDs to titles for mobile header navigation
 * - Tag-based organization of operations and webhooks
 * - Optional schema/model documentation
 */
export const traverseDocument = (document: OpenApiDocument, config?: DocumentConfiguration) => {
  const { hideModels, tagsSorter, operationsSorter, getHeadingId, getOperationId, getWebhookId, getModelId, getTagId } =
    getNavigationOptions(config)

  /** Map of tags and their entries */
  const tagsMap: TagsMap = new Map(
    document.tags?.map((tag) => [tag.name ?? 'Untitled Tag', { tag, entries: [] }]) ?? [],
  )

  const entries: TraversedEntry[] = traverseDescription(document.info?.description, getHeadingId)
  traversePaths(document, tagsMap, getOperationId)
  const untaggedWebhooks = traverseWebhooks(document, tagsMap, getWebhookId)
  const tagsEntries = traverseTags(document, tagsMap, {
    getTagId,
    tagsSorter,
    operationsSorter,
  })

  // Add tagged operations, webhooks and tagGroups
  entries.push(...tagsEntries)

  // Add untagged webhooks
  if (untaggedWebhooks.length) {
    entries.push({
      type: 'tag',
      id: getWebhookId({ name: '' }),
      title: 'Webhooks',
      name: 'Webhooks',
      children: untaggedWebhooks,
      isGroup: false,
      isWebhooks: true,
    })
  }

  // Add models if they are not hidden
  if (!hideModels && document.components?.schemas) {
    const untaggedModels = traverseSchemas(document, tagsMap, getModelId)

    if (untaggedModels.length) {
      entries.push({
        type: 'text',
        id: 'models',
        title: 'Models',
        children: untaggedModels,
      })
    }
  }

  return { entries }
}
