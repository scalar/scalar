import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import { traverseDescription } from './traverse-description'
import { traversePaths } from './traverse-paths'
import { traverseSchemas } from './traverse-schemas'
import { traverseTags } from './traverse-tags'
import { traverseWebhooks } from './traverse-webhooks'
import type { TraversedEntry, TraverseSpecOptions } from '@/traverse-schema/types'

/**
 * Traverse the OpenAPI Document and ensure we only do it once
 *
 * We are generating the following:
 * - the sidebar
 * - the search index (todo)
 *
 * Currently its called by createSidebar, but we can move this into the de-reference process as a plugin for even more gains
 */
export const traverseDocument = (
  document: OpenAPIV3_1.Document,
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
  /** Dictionary of name to tags */
  const tagsDict: Map<string, OpenAPIV3_1.TagObject> = new Map(
    document.tags?.map((tag: OpenAPIV3_1.TagObject) => [tag.name ?? 'Untitled Tag', tag]) ?? [],
  )

  /** Map it ID to title for the mobile header */
  const titles = new Map<string, string>()

  const entries: TraversedEntry[] = traverseDescription(document.info?.description, titles, getHeadingId)
  const tags = traversePaths(document, tagsDict, titles, getOperationId)
  const webhooks = traverseWebhooks(document, tags, tagsDict, titles, getWebhookId)
  const tagsEntries = traverseTags(document, tags, tagsDict, titles, {
    getTagId,
    tagsSorter: tagsSorter,
    operationsSorter: operationsSorter,
  })

  // Add tagged operations, webhooks and tagGroups
  entries.push(...tagsEntries)

  // Add untagged webhooks
  if (webhooks.length) {
    entries.push({
      id: getWebhookId(),
      title: 'Webhooks',
      children: webhooks,
      type: 'webhook',
    })
  }

  // Add models if they are not hidden
  if (!hideModels && document.components?.schemas) {
    const models = traverseSchemas(document, titles, getModelId)

    if (models.length) {
      entries.push({
        id: getModelId(),
        title: 'Models',
        children: models,
        type: 'model',
      })
    }
  }

  return { entries, titles }
}
