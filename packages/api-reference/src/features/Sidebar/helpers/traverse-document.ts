import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import { traverseDescription } from '@/features/Sidebar/helpers/traverse-description'
import { traversePaths } from '@/features/Sidebar/helpers/traverse-paths'
import { traverseSchemas } from '@/features/Sidebar/helpers/traverse-schemas'
import { traverseTags } from '@/features/Sidebar/helpers/traverse-tags'
import { traverseWebhooks } from '@/features/Sidebar/helpers/traverse-webhooks'
import type { CreateSidebarOptions, SidebarEntry } from '@/features/Sidebar/types'

export const traverseDocument = (
  document: OpenAPIV3_1.Document,
  { config, getHeadingId, getOperationId, getWebhookId, getModelId, getTagId }: CreateSidebarOptions,
) => {
  /** Dictionary of name to tags */
  // TODO: type: remove this when types are fixed
  const tagsDict: Map<string, OpenAPIV3_1.TagObject> = new Map(
    document.tags?.map((tag: OpenAPIV3_1.TagObject) => [tag.name, tag]) ?? [],
  )

  /** Map it ID to title for the mobile header */
  const titles = new Map<string, string>()

  const entries: SidebarEntry[] = traverseDescription(document.info?.description, titles, getHeadingId)
  const tags = traversePaths(document, tagsDict, titles, getOperationId)
  const webhooks = traverseWebhooks(document, tags, tagsDict, titles, getWebhookId)
  const tagsEntries = traverseTags(document, tags, tagsDict, titles, {
    getTagId,
    tagsSorter: config.value.tagsSorter,
    operationsSorter: config.value.operationsSorter,
  })

  // Add tagged operations, webhooks and tagGroups
  entries.push(...tagsEntries)

  // Add untagged webhooks
  if (webhooks.length) {
    entries.push({
      id: getWebhookId(),
      title: 'Webhooks',
      children: webhooks,
    })
  }

  // Add models if they are not hidden
  if (!config.value.hideModels && document.components?.schemas) {
    const models = traverseSchemas(document, titles, getModelId)

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
