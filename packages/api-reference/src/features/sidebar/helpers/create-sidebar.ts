import { scrollToId } from '@scalar/helpers/dom/scroll-to-id'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { computed, reactive, ref } from 'vue'

import { lazyBus } from '@/components/Lazy'
import type { TraverseSpecOptions } from '@/features/traverse-schema'

/** Track which sidebar items are opened */
type CollapsedSidebarItems = Record<string, boolean>

/** Sidebar initialization options */
export type SidebarOptions = TraverseSpecOptions

/**
 * Creating sidebar with only one traversal of the spec
 *
 * TODO:
 *  - add the search index creation as well
 *  - update docs
 *  - tagged models
 */
export const createSidebar = (store: WorkspaceStore, options: SidebarOptions) => {
  const collapsedSidebarItems = reactive<CollapsedSidebarItems>({})
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
    if (options.config.value.defaultOpenAllTags) {
      result?.forEach((entry) => setCollapsedSidebarItem(entry.id, true))
    }

    return {
      entries: result ?? [],
      entities: store.getComputedProperties(store.workspace['x-scalar-active-document'] || '')?.entities,
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
