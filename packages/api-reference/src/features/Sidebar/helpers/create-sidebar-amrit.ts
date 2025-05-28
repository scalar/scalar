import { traverseDescription } from '@/features/Sidebar/helpers/traverse-description'
import { traversePaths } from '@/features/Sidebar/helpers/traverse-paths'
import { traverseSchemas } from '@/features/Sidebar/helpers/traverse-schemas'
import { traverseWebhooks } from '@/features/Sidebar/helpers/traverse-webhooks'
import type { SidebarEntry } from '@/features/Sidebar/types'
import type { UseNavState } from '@/hooks/useNavState'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'

/**
 * Exploring creating the sidebar with only one traversal of the spec
 *
 * We do some irregular things here such as passing the same map and array around to save on performance
 *
 * TODO:
 *  - defaultOpenAlltags
 *  - sorting
 *  - breadcrumb
 *  - tagGroups
 *  - add the search index creation as well
 */
export const createSidebarAmrit = (
  content: OpenAPIV3_1.Document,
  {
    config,
    getHeadingId,
    getModelId,
    getOperationId,
    getTagId,
    getWebhookId,
  }: {
    config: ApiReferenceConfiguration
    // These below are temporary, we will fold them into the config object later
  } & Pick<UseNavState, 'getHeadingId' | 'getModelId' | 'getOperationId' | 'getTagId' | 'getWebhookId'>,
) => {
  // Create tag dictionary
  const tagsDict =
    content.tags?.reduce(
      (acc, tag) => {
        acc[tag.name] = tag
        return acc
      },
      {} as Record<string, OpenAPIV3_1.TagObject>,
    ) ?? {}

  const entries: SidebarEntry[] = traverseDescription(content.info?.description, getHeadingId)
  const tags = traversePaths(content, tagsDict, getOperationId)
  const webhooks = traverseWebhooks(content, tags, tagsDict, getWebhookId)

  // Add untagged webhooks
  if (webhooks.length) {
    entries.push({
      id: getWebhookId(),
      title: 'Webhooks',
      children: webhooks,
    })
  }

  // Add models if they are not hidden
  if (!config.hideModels) {
    const models = traverseSchemas(content, getModelId)
    entries.push({
      id: getModelId(),
      title: 'Models',
      children: models,
    })
  }

  return entries
}
