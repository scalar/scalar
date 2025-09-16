import { scrollToId } from '@scalar/helpers/dom/scroll-to-id'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { computed, reactive, ref } from 'vue'

import { lazyBus } from '@/components/Lazy'
import { generateReverseIndex } from '@/v2/blocks/scalar-navigation-block/helpers/generate-reverse-index'

/**
 * Creating sidebar with only one traversal of the spec
 *
 * TODO:
 *  - add the search index creation as well
 *  - update docs
 *  - tagged models
 */
export const createSidebar = (store: WorkspaceStore, options: { getSectionId: (hashStr?: string) => string }) => {
  const collapsedSidebarItems = reactive<Record<string, boolean>>({})
  const isSidebarOpen = ref(false)

  const toggleCollapsedSidebarItem = (key: string) => (collapsedSidebarItems[key] = !collapsedSidebarItems[key])
  const setCollapsedSidebarItem = (key: string, value: boolean) => (collapsedSidebarItems[key] = value)

  /**
   * Scroll to operation
   *
   * Similar to scrollToId BUT in the case of a section not being open,
   * it uses the lazyBus to ensure the section is open before scrolling to it
   */
  const scrollToOperation = (operationId: string, focus?: boolean) => {
    const sectionId = options.getSectionId(operationId)

    if (sectionId && sectionId !== operationId) {
      // We use the lazyBus to check when the target has loaded then scroll to it
      if (!collapsedSidebarItems[sectionId]) {
        const unsubscribe = lazyBus.on((ev) => {
          if (ev.loaded === operationId) {
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
    const result = store.workspace.activeDocument?.['x-scalar-navigation']

    // Open all tags
    if (store.config['x-scalar-reference-config'].features.expandAllTagSections) {
      result?.forEach((entry) => setCollapsedSidebarItem(entry.id, true))
    }

    return {
      entries: result ?? [],
      entities: generateReverseIndex(result),
    }
  })

  return {
    collapsedSidebarItems,
    isSidebarOpen,
    items,
    scrollToOperation,
    setCollapsedSidebarItem,
    toggleCollapsedSidebarItem,
  }
}
