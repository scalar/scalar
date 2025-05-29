import { traverseDescription } from '@/features/Sidebar/helpers/traverse-description'
import { traversePaths } from '@/features/Sidebar/helpers/traverse-paths'
import { traverseSchemas } from '@/features/Sidebar/helpers/traverse-schemas'
import { traverseTags } from '@/features/Sidebar/helpers/traverse-tags'
import { traverseWebhooks } from '@/features/Sidebar/helpers/traverse-webhooks'
import type { SidebarEntry } from '@/features/Sidebar/types'
import type { UseNavState } from '@/hooks/useNavState'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'

/**
 * Creating sidebar with only one traversal of the spec
 *
 * TODO:
 *  - defaultOpenAlltags
 *  - breadcrumb - move to the component
 *  - all the other useSidebar things
 *  - add the search index creation as well
 */
export const createSidebar = (
  content: OpenAPIV3_1.Document,
  {
    config,
    getHeadingId,
    getModelId,
    getOperationId,
    getTagId,
    getWebhookId,
  }: {
    config: Pick<ApiReferenceConfiguration, 'hideModels' | 'tagsSorter' | 'operationsSorter'>
  } & Pick<UseNavState, 'getHeadingId' | 'getModelId' | 'getOperationId' | 'getTagId' | 'getWebhookId'>,
) => {
  // Create tag dictionary
  const tagsDict = new Map(content.tags?.map((tag) => [tag.name, tag]) ?? [])

  /** Map it ID to title for the mobile header */
  const titles = new Map<string, string>()

  const entries: SidebarEntry[] = traverseDescription(content.info?.description, titles, getHeadingId)
  const tags = traversePaths(content, tagsDict, titles, getOperationId)
  const webhooks = traverseWebhooks(content, tags, tagsDict, titles, getWebhookId)
  const tagsEntries = traverseTags(content, tags, tagsDict, titles, {
    getTagId,
    tagsSorter: config.tagsSorter,
    operationsSorter: config.operationsSorter,
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
  if (!config.hideModels && content.components?.schemas) {
    const models = traverseSchemas(content, titles, getModelId)

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
