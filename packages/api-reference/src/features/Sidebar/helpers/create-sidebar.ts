import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'

import { traverseDescription } from '@/features/Sidebar/helpers/traverse-description'
import { traversePaths } from '@/features/Sidebar/helpers/traverse-paths'
import { traverseSchemas } from '@/features/Sidebar/helpers/traverse-schemas'
import { traverseTags } from '@/features/Sidebar/helpers/traverse-tags'
import { traverseWebhooks } from '@/features/Sidebar/helpers/traverse-webhooks'
import type { SidebarEntry } from '@/features/Sidebar/types'
import type { UseNavState } from '@/hooks/useNavState'
import { computed, reactive, ref, type Ref } from 'vue'
import { lazyBus } from '@/components/Content/Lazy/lazyBus'
import { scrollToId } from '@/helpers/scroll-to-id'

/** Create sidebar options */
export type CreateSidebarOptions = {
  config: Pick<ApiReferenceConfiguration, 'hideModels' | 'tagsSorter' | 'operationsSorter' | 'defaultOpenAllTags'>
  /** You can optionally pass in these refs in case you need them before the hook is instantiated */
  isSidebarOpen?: Ref<boolean>
} & Pick<UseNavState, 'getHeadingId' | 'getModelId' | 'getOperationId' | 'getSectionId' | 'getTagId' | 'getWebhookId'>

/** Track which sidebar items are opened */
type CollapsedSidebarItems = Record<string, boolean>

/**
 * Creating sidebar with only one traversal of the spec
 *
 * TODO:
 *  - breadcrumb - move to the component
 *  - add the search index creation as well
 *  - update docs
 */
export const createSidebar = (
  content: OpenAPIV3_1.Document,
  {
    config,
    getHeadingId,
    getModelId,
    getOperationId,
    getSectionId,
    getTagId,
    getWebhookId,
    isSidebarOpen: isSidebarOpenRef,
  }: CreateSidebarOptions,
) => {
  const isSidebarOpen = isSidebarOpenRef ?? ref(false)
  const collapsedSidebarItems = reactive<CollapsedSidebarItems>({})

  const toggleCollapsedSidebarItem = (key: string) => (collapsedSidebarItems[key] = !collapsedSidebarItems[key])
  const setCollapsedSidebarItem = (key: string, value: boolean) => (collapsedSidebarItems[key] = value)

  /**
   * Scroll to operation
   *
   * Similar to scrollToId BUT in the case of a section not being open,
   * it uses the lazyBus to ensure the section is open before scrolling to it
   */
  const scrollToOperation = (operationId: string, focus?: boolean) => {
    const sectionId = getSectionId(operationId)

    if (sectionId && sectionId !== operationId) {
      // We use the lazyBus to check when the target has loaded then scroll to it
      if (!collapsedSidebarItems[sectionId]) {
        const unsubscribe = lazyBus.on((ev) => {
          if (ev.id === operationId) {
            scrollToId(operationId, focus)
            unsubscribe()
          }
        })
        setCollapsedSidebarItem(sectionId, true)
      } else {
        scrollToId(operationId, focus)
      }
    }
  }

  /** Sidebar items */
  const items = computed(() => {
    /** Dictionary of name to tags */
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
  })

  // Open all tags on first render
  if (config.defaultOpenAllTags) {
    items.value.entries.forEach((entry) => setCollapsedSidebarItem(entry.id, true))
  }

  return {
    collapsedSidebarItems,
    isSidebarOpen,
    items,
    scrollToOperation,
    setCollapsedSidebarItem,
    toggleCollapsedSidebarItem,
  }
}
