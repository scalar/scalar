import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import { traverseDescription } from './traverse-description'
import { traversePaths } from './traverse-paths'
import { traverseSchemas } from './traverse-schemas'
import { traverseTags } from './traverse-tags'
import { traverseWebhooks } from './traverse-webhooks'
import type { TagsMap, TraverseSpecOptions, TraversedEntry } from '@/features/traverse-schema/types'

/**
 * Travers the OpenAPI Document and ensure we only do it once
 *
 * We are generating the following:
 * - the sidebar
 * - the search index (todo)
 *
 * Currently its called by createSidebar, but we can move this into the de-reference process as a plugin for even more gains
 */
export const traverseDocument = (
  document: OpenAPIV3_1.Document,
  { config, getHeadingId, getOperationId, getWebhookId, getModelId, getTagId }: TraverseSpecOptions,
) => {
  /** Map it ID to title for the mobile header */
  const titles = new Map<string, string>()

  /** Map of tags and their entries */
  const tagsMap: TagsMap = new Map(
    document.tags?.map((tag: OpenAPIV3_1.TagObject) => [tag.name ?? 'Untitled Tag', { tag, entries: [] }]) ?? [],
  )
  traversePaths(document, tagsMap, titles, getOperationId)

  const entries: TraversedEntry[] = traverseDescription(document.info?.description, titles, getHeadingId)
  const untaggedWebhooks = traverseWebhooks(document, tagsMap, titles, getWebhookId)
  const tagsEntries = traverseTags(document, tagsMap, titles, {
    getTagId,
    tagsSorter: config.value.tagsSorter,
    operationsSorter: config.value.operationsSorter,
  })

  // Add tagged operations, webhooks and tagGroups
  entries.push(...tagsEntries)

  // Add untagged webhooks
  if (untaggedWebhooks.length) {
    entries.push({
      id: getWebhookId(),
      isWebhooks: true,
      title: 'Webhooks',
      children: untaggedWebhooks,
    })
  }

  // Add models if they are not hidden
  if (!config.value.hideModels && document.components?.schemas) {
    const models = traverseSchemas(document, tagsMap, titles, getModelId)

    if (models.length) {
      entries.push({
        id: getModelId(),
        title: 'Models',
        children: models,
      })
    }
  }

  return { entries, titles }
}
